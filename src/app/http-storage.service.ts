import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from "@angular/common/http";
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/toPromise';
import {Subject} from "rxjs/Subject";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Observable} from "rxjs/Observable";
import {ConfigService} from "./config.service";

const DEFAULT_POLL_TIMEOUT = 10000;
const DEFAULT_URL = '/v1/poker';

export class Participant {
  id: string;
  name: string;

  constructor(name: string) {
    this.id = Math.random().toString(36).substring(2, 5);
    this.name = name;
  }

  clone(): Participant {
    let participant = new Participant(this.name);
    participant.id = this.id;
    return participant;
  }
}

export class Story {
  id: string;
  name: string;
  votes: { [participantId: string]: string };

  constructor(name: string) {
    this.id = Math.random().toString(36).substring(2, 5);
    this.name = name;
    this.votes = {};
  }

  clone(): Story {
    let story = new Story(this.name);
    story.id = this.id;
    story.votes = Object.assign({}, this.votes);
    return story;
  }
}

export class Session {
  name: string;
  participants: Participant[] = [];
  stories: Story[] = [];
  votingInProgress: string = null;

  constructor(name?: string) {
    this.name = name;
  }

  clone(): Session {
    let session = new Session(this.name);
    session.participants = this.participants.map(p => Participant.prototype.clone.call(p));
    session.stories = this.stories.map(s => Story.prototype.clone.call(s));
    session.votingInProgress = this.votingInProgress;
    return session;
  }
}

export class State {
  constructor(public id?: string, public version?: number, public lastSession?: Session) {
  }
}


@Injectable()
export class HttpStorageService {

  state: State;
  participantId: string;
  private sessionSubject: Subject<Session> = new ReplaySubject<Session>(1);
  private polling: boolean = false;

  get session(): Observable<Session> {
    return this.sessionSubject.asObservable();
  }

  get sessionId(): string {
    return this.state ? this.state.id : null;
  }

  constructor(private http: HttpClient, private config: ConfigService) {
  }

  startSession(name: string): Promise<Session> {
    console.info('startSession', name);
    this.state = new State();
    return this.config.config
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL);
        console.debug('sending POST', url);
        return this.http.post<Session>(url, new Session(name), {observe: 'response'})
          .do(this.stateExtractor)
          .map((r: HttpResponse<Session>) => r.body);
      })
      .toPromise<Session>();
  }

  joinSession(id: string): Promise<Session> {
    console.info('joinSession', id);
    this.state = new State(id);
    return this.config.config
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('requesting GET', url);
        return this.http.get<Session>(url, {observe: 'response'})
          .do(this.stateExtractor)
          .map((r: HttpResponse<Session>) => r.body)
      })
      .toPromise<Session>();
  }

  registerParticipant(participantName: string): Promise<Session> {
    let participant = new Participant(participantName);
    this.participantId = participant.id;
    return this.updateSession(session => session.participants.push(participant));
  }

  private stateExtractor = (response: HttpResponse<Session> | HttpErrorResponse): void => {
    let status = response.status;
    let location = response.headers.get('location');
    console.debug('got response', status, location, response.headers.get('etag'));
    if (status == 304) return; // not modified
    if (status != 200 && status != 201 && status != 412) {
      console.error('Response status invalid: ' + status);
      return;
    }
    if (location && !this.state.id)
      this.state.id = location.match(/\/([0-9a-f]+)$/)[1];
    this.state.version = parseInt(response.headers.get('etag').slice(1, -1));
    this.state.lastSession = response instanceof HttpErrorResponse ? response.error : response.body;
    this.sessionSubject.next(this.state.lastSession);
    console.debug('got state', this.state);
  };

  updateSession(update: (session: Session) => void): Promise<Session> {
    return this.config.config
      .mergeMap(config => {
        let session = Session.prototype.clone.call(this.state.lastSession);
        console.debug('preparing', session);
        update(session);
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('sending PUT', url, session);
        return this.http.put<Session>(url, session, {
          headers: {'if-match': `"${this.state.version}"`},
          observe: 'response'
        })
      })
      .retryWhen(errors =>
        errors.mergeMap(err => {
          if (err instanceof HttpErrorResponse && err.status == 412) {
            this.stateExtractor(err);
            return Observable.of(1); // retry immediately
          } else {
            console.error('caught error', err);
            return Observable.timer(5000); // retry after delay
          }
        }))
      .do(this.stateExtractor)
      .map((r: HttpResponse<Session>) => r.body)
      .toPromise<Session>();
  }

  startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    this.config.config
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('polling GET', url);
        return this.http.get<Session>(url, {
          headers: {
            'if-none-match': `"${this.state.version}"`,
            timeout: (config.pollTimeout || DEFAULT_POLL_TIMEOUT).toString()
          },
          observe: 'response'
        })
      })
      .catch((err: HttpErrorResponse) => {
        if (err instanceof HttpErrorResponse && err.status == 304) {
          return Observable.empty(); // complete immediately
        } else {
          console.error('caught error', err);
          return Observable.timer(5000).takeWhile(() => false); // complete with delay
        }
      })
      .repeatWhen(n => n.takeWhile(() => this.polling))
      .subscribe(this.stateExtractor, err => console.error(err));
  }

  stopPolling(): void {
    this.polling = false;
  }

  addStory(name: string): Promise<Session> {
    let story = new Story(name);
    return this.updateSession(session => session.stories.push(story));
  }

  editStory(id: string, name: string): Promise<Session> {
    return this.updateSession(session => {
      let story = session.stories.find(s => s.id === id);
      if (story) {
        story.name = name;
      }
    });
  }

  deleteStory(id: string): Promise<Session> {
    return this.updateSession(session => {
      let storyIndex = session.stories.findIndex(s => s.id === id);
      if (storyIndex >= 0) {
        session.stories.splice(storyIndex, 1);
      }
    });
  }

  moveStoryUp(id: string): Promise<Session> {
    return this.updateSession(session => {
      let stories = session.stories;
      let storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex > 0) {
        let removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex - 1, 0, removed[0]);
      }
    });
  }

  moveStoryDown(id: string): Promise<Session> {
    return this.updateSession(session => {
      let stories = session.stories;
      let storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex >= 0 && storyIndex < stories.length - 1) {
        let removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex + 1, 0, removed[0]);
      }
    });
  }

  startVoting(storyId: string): Promise<Session> {
    return this.updateSession(session => {
      let story = session.stories.find(s => s.id === storyId);
      if (story) {
        session.votingInProgress = storyId;
      }
    });
  }

  stopVoting(): Promise<Session> {
    return this.updateSession(session => {
      session.votingInProgress = null;
    });
  }

  vote(score: string): Promise<Session> {
    return this.updateSession(session => {
      let story = session.stories.find(s => s.id === session.votingInProgress);
      if (story && this.participantId) {
        story.votes[this.participantId] = score;
      }
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
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
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { ConfigService } from './config.service';
import { Subscription } from 'rxjs/Subscription';

const DEFAULT_POLL_TIMEOUT = 10000;
const DEFAULT_URL = '/v1/poker';

export class Participant {
  id: string;
  name: string;

  constructor(name: string) {
    this.id = Math.random().toString(36).substring(2, 7);
    this.name = name;
  }

  clone(): Participant {
    const participant = new Participant(this.name);
    participant.id = this.id;
    return participant;
  }
}

export class Story {
  id: string;
  name: string;
  votes: { [participantId: string]: string };
  votingInProgress: boolean = false;

  constructor(name: string) {
    this.id = Math.random().toString(36).substring(2, 7);
    this.name = name;
    this.votes = {};
  }

  clone(): Story {
    const story = new Story(this.name);
    story.id = this.id;
    story.votingInProgress = this.votingInProgress;
    story.votes = Object.assign({}, this.votes);
    return story;
  }
}

export class Session {
  name: string;
  participants: Participant[] = [];
  stories: Story[] = [];
  deck: string[] = ['0', '0.5', '1', '2', '3', '5', '10', '20'];

  constructor(name?: string, deck?: string[]) {
    this.name = name;
    if (deck) this.deck = deck;
  }

  clone(): Session {
    const session = new Session(this.name);
    session.participants = this.participants.map(p => Participant.prototype.clone.call(p));
    session.stories = this.stories.map(s => Story.prototype.clone.call(s));
    session.deck = this.deck.slice();
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
  private polling: Subscription;

  getSession(): Observable<Session> {
    return this.sessionSubject.asObservable();
  }

  get sessionId(): string {
    return this.state ? this.state.id : null;
  }

  constructor(private http: HttpClient, private config: ConfigService) {
  }

  private stateExtractor = (response: HttpResponse<Session> | HttpErrorResponse): void => {
    const status = response.status;
    const location = response.headers.get('location');
    console.debug('got response', status, location, response.headers.get('etag'));
    if (status === 304) return; // not modified
    if (status !== 200 && status !== 201 && status !== 412) {
      console.error('Response status invalid: ' + status);
      return;
    }
    if (location && !this.state.id) {
      this.state.id = location.match(/\/([0-9a-f]+)$/)[1];
    }
    this.state.version = parseInt(response.headers.get('etag').slice(1, -1), 10);
    this.state.lastSession = response instanceof HttpErrorResponse ? response.error : response.body;
    this.sessionSubject.next(this.state.lastSession);
    console.debug('got state', this.state);
  };

  startSession(name: string, deck?: string[]): Promise<Session> {
    console.info('startSession', name);
    this.state = new State();
    return this.config.getConfig()
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL);
        console.debug('sending POST', url);
        return this.http.post<Session>(url, new Session(name, deck), { observe: 'response' })
          .do(this.stateExtractor)
          .map((r: HttpResponse<Session>) => r.body);
      })
      .toPromise<Session>();
  }

  joinSession(id: string): Promise<Session> {
    console.info('joinSession', id);
    if (!id) return Promise.reject('sessionId is empty');
    this.state = new State(id);
    return this.config.getConfig()
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('requesting GET', url);
        return this.http.get<Session>(url, { observe: 'response' })
          .do(this.stateExtractor)
          .map((r: HttpResponse<Session>) => r.body);
      })
      .toPromise<Session>();
  }

  registerParticipant(participantName: string): Promise<Session> {
    const participant = new Participant(participantName);
    this.participantId = participant.id;
    return this.updateSession(session => session.participants.push(participant));
  }

  joinAsParticipant(participantId: string): Promise<Participant> {
    if (!participantId) {
      return Promise.reject('participantId is empty');
    }
    const participant = this.state.lastSession.participants.find(p => p.id === participantId);
    if (participant) {
      this.participantId = participant.id;
      return Promise.resolve(participant);
    } else {
      return Promise.reject('no such participant');
    }
  }

  updateSession(update: (session: Session) => void): Promise<Session> {
    const stoppedPolling = this.stopPolling();
    const resumePolling = stoppedPolling ? () => this.startPolling() : () => {};
    return this.config.getConfig()
      .mergeMap(config => {
        const session = Session.prototype.clone.call(this.state.lastSession);
        console.debug('preparing', session);
        update(session);
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('sending PUT', url, session);
        return this.http.put<Session>(url, session, {
          headers: { 'if-match': `"${this.state.version}"` },
          observe: 'response'
        });
      })
      .retryWhen(errors =>
        errors.mergeMap(err => {
          if (err instanceof HttpErrorResponse && err.status === 412) {
            this.stateExtractor(err);
            return Observable.of(1); // retry immediately
          } else {
            console.error('caught error', err);
            return Observable.timer(5000); // retry after delay
          }
        }))
      .do(this.stateExtractor)
      .map((r: HttpResponse<Session>) => r.body)
      .do(() => {}, () => {}, resumePolling)
      .toPromise<Session>();
  }

  startPolling(): void {
    if (this.polling) return;
    this.polling = this.config.getConfig()
      .mergeMap(config => {
        const url = (config.httpStoreUrl || DEFAULT_URL) + '/' + this.state.id;
        console.debug('polling GET', url);
        return this.http.get<Session>(url, {
          headers: {
            'if-none-match': `"${this.state.version}"`,
            timeout: (config.pollTimeout || DEFAULT_POLL_TIMEOUT).toString()
          },
          observe: 'response'
        });
      })
      .catch((err: HttpErrorResponse) => {
        if (err instanceof HttpErrorResponse && err.status === 304) {
          return Observable.empty(); // complete immediately
        } else {
          console.error('caught error', err);
          return Observable.timer(5000).takeWhile(() => false); // complete with delay
        }
      })
      .repeatWhen(n => n.takeWhile(() => !!this.polling))
      .subscribe(this.stateExtractor, err => console.error(err));
  }

  stopPolling(): boolean {
    if (!this.polling) return false;
    this.polling.unsubscribe();
    this.polling = null;
    return true;
  }

  addStory(name: string): Promise<Session> {
    const story = new Story(name);
    return this.updateSession(session => session.stories.push(story));
  }

  addStories(names: string[]): Promise<Session> {
    return this.updateSession(session => {
      names.forEach(name => {
        const story = new Story(name);
        session.stories.push(story);
      });
    });
  }

  editStory(id: string, name: string): Promise<Session> {
    return this.updateSession(session => {
      const story = session.stories.find(s => s.id === id);
      if (story) {
        story.name = name;
      }
    });
  }

  deleteStory(id: string): Promise<Session> {
    return this.updateSession(session => {
      const storyIndex = session.stories.findIndex(s => s.id === id);
      if (storyIndex >= 0) {
        session.stories.splice(storyIndex, 1);
      }
    });
  }

  editParticipant(id: string, name: string): Promise<Session> {
    return this.updateSession(session => {
      const participant = session.participants.find(p => p.id === id);
      if (participant) {
        participant.name = name;
      }
    });
  }

  deleteParticipant(id: string): Promise<Session> {
    return this.updateSession(session => {
      const participantIndex = session.participants.findIndex(p => p.id === id);
      if (participantIndex >= 0) {
        session.participants.splice(participantIndex, 1);
      }
    });
  }

  moveStoryUp(id: string): Promise<Session> {
    return this.updateSession(session => {
      const stories = session.stories;
      const storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex > 0) {
        const removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex - 1, 0, removed[0]);
      }
    });
  }

  moveStoryDown(id: string): Promise<Session> {
    return this.updateSession(session => {
      const stories = session.stories;
      const storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex >= 0 && storyIndex < stories.length - 1) {
        const removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex + 1, 0, removed[0]);
      }
    });
  }

  startVoting(storyId: string): Promise<Session> {
    return this.updateSession(session => {
      const story = session.stories.find(s => s.id === storyId);
      session.stories.forEach(s => s.votingInProgress = false);
      if (story) {
        story.votingInProgress = true;
      }
    });
  }

  stopVoting(): Promise<Session> {
    return this.updateSession(session => {
      session.stories.forEach(s => s.votingInProgress = false);
    });
  }

  vote(score: string): Promise<Session> {
    return this.updateSession(session => {
      const story = session.stories.find(s => s.votingInProgress);
      if (story && this.participantId) {
        story.votes[this.participantId] = score;
      }
    });
  }
}

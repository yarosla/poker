import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from "@angular/common/http";
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/filter';
import {Subject} from "rxjs/Subject";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Observable} from "rxjs/Observable";

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

  constructor(name: string) {
    this.name = name;
  }

  clone(): Session {
    let session = new Session(this.name);
    session.participants = this.participants.map(p => p.clone());
    session.stories = this.stories.map(s => s.clone());
    session.votingInProgress = this.votingInProgress;
    return session;
  }
}

export class State {
  id: string;
  version: number;
  lastSession: Session
}

@Injectable()
export class HttpStorageService {

  state: State;
  private participantId: string;
  private sessionSubject: Subject<Session> = new ReplaySubject<Session>(1);
  private polling: boolean = false;

  get session(): Observable<Session> {
    return this.sessionSubject.asObservable();
  }

  constructor(private http: HttpClient) {
  }

  startSession(name: string): void {
    console.info('startSession', name);
    this.state = new State();
    this.http.post<Session>('/v1/poker', new Session(name), {observe: 'response'})
      .subscribe(this.stateExtractor);
  }

  joinSession(id: string, participantName: string): void {
    // TODO fetch session from server
    let participant = new Participant(participantName);
    this.participantId = participant.id;
    this.updateSession(session => session.participants.push(participant));
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

  updateSession(updater: (session: Session) => void): void {
    Observable.of(1)
      .mergeMap(() => {
        let session = this.state.lastSession.clone();
        console.debug('preparing', session);
        updater(session);
        console.debug('sending', session);
        return this.http.put<Session>(`/v1/poker/${this.state.id}`, session, {
          headers: {'if-match': `"${this.state.version}"`},
          observe: 'response'
        })
      })
      .catch((err: HttpErrorResponse, caught) => {
        if (err instanceof HttpErrorResponse && err.status == 412) {
          this.stateExtractor(err);
          return caught; // retry
        }
        console.debug('caught error', err);
        throw 'Unrecoverable error: ' + err.message;
      })
      .subscribe(this.stateExtractor, err => console.error(err));
  }

  startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    Observable.of(1)
      .mergeMap(() => {
        console.debug('polling', this.state.version);
        return this.http.get<Session>(`/v1/poker/${this.state.id}`, {
          headers: {'if-none-match': `"${this.state.version}"`, timeout: '2000'},
          observe: 'response'
        })
      })
      .catch((err: HttpErrorResponse) => {
        console.debug('caught error', err);
        if (err instanceof HttpErrorResponse && err.status == 304) {
          return Observable.empty();
        }
        throw 'Unrecoverable error: ' + err.message;
      })
      .repeatWhen(n => n.takeWhile(() => this.polling))
      .subscribe(this.stateExtractor, err => console.error(err));
  }

  stopPolling(): void {
    this.polling = false;
  }

  addStory(name: string) {
    let story = new Story(name);
    this.updateSession(session => session.stories.push(story));
  }

  editStory(id: string, name: string): void {
    this.updateSession(session => {
      let story = session.stories.find(s => s.id === id);
      if (story) {
        story.name = name;
      }
    });
  }

  deleteStory(id: string): void {
    this.updateSession(session => {
      let storyIndex = session.stories.findIndex(s => s.id === id);
      if (storyIndex >= 0) {
        session.stories.splice(storyIndex, 1);
      }
    });
  }

  moveStoryUp(id: string): void {
    this.updateSession(session => {
      let stories = session.stories;
      let storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex > 0) {
        let removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex - 1, 0, removed[0]);
      }
    });
  }

  moveStoryDown(id: string): void {
    this.updateSession(session => {
      let stories = session.stories;
      let storyIndex = stories.findIndex(s => s.id === id);
      if (storyIndex >= 0 && storyIndex < stories.length - 1) {
        let removed = stories.splice(storyIndex, 1);
        stories.splice(storyIndex + 1, 0, removed[0]);
      }
    });
  }
}

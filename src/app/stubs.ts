import {Session, Story} from "./http-storage.service";
import {Observable} from "rxjs/Observable";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Subject} from "rxjs/Subject";
import {Injectable} from "@angular/core";

@Injectable()
export class HttpStorageStubService {
  private sessionSubject: Subject<Session> = new ReplaySubject<Session>(1);
  private lastSession: Session;

  get session(): Observable<Session> {
    return this.sessionSubject.asObservable();
  }

  startSession(name: string): Promise<Session> {
    console.info('starting mock session', name);
    this.lastSession = new Session(name);
    this.sessionSubject.next(this.lastSession);
    return new Promise(resolve => resolve(this.lastSession));
  }

  startPolling(): void {
  }

  addStory(name: string): void {
    this.lastSession.stories.push(new Story('name'));
    this.sessionSubject.next(this.lastSession);
  }
}

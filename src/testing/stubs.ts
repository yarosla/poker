import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import { Config } from '../app/config.service';
import { Session, Story } from '../app/http-storage.service';

@Injectable()
export class ConfigStubService {
  config: Observable<Config>;

  constructor(config?: Config) {
    if (!config) {
      config = { httpStoreUrl: null, pollTimeout: 1234 } as Config;
    }
    this.config = Observable.of<Config>(config);
  }
}

@Injectable()
export class HttpStorageStubService {
  private sessionSubject: Subject<Session> = new ReplaySubject<Session>(1);
  session = this.sessionSubject.asObservable();
  private lastSession: Session;

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

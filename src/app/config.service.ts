import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

export class Deck {
  name: string;
  cards: string[]
}

export class Config {
  httpStoreUrl: string;
  pollTimeout: number | string;
  decks?: Deck[]
}

@Injectable()
export class ConfigService {

  private configSubject = new ReplaySubject<Config>(1);

  getConfig(): Observable<Config> {
    return this.configSubject.asObservable();
  }

  constructor(private http: HttpClient) {
    http.get<Config>('config.json')
      .subscribe(this.configSubject);
  }
}

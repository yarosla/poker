import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpStorageService } from '../http-storage.service';
import { ConfigService, Deck } from '../config.service';

@Component({
  selector: 'app-new-session',
  templateUrl: './new-session.component.html',
  styleUrls: ['./new-session.component.css']
})
export class NewSessionComponent implements OnInit {

  newSessionName: string;
  decks: Deck[];
  selectedDeck: Deck;

  constructor(private httpStorage: HttpStorageService, private router: Router, private config: ConfigService) {
  }

  ngOnInit() {
    this.config.getConfig().subscribe(conf => {
      if (conf.decks) {
        this.decks = conf.decks;
        if (this.decks && this.decks.length) this.selectedDeck = this.decks[0];
      }
    });
  }

  startSession() {
    let name = this.newSessionName.trim();
    this.httpStorage.startSession(name, this.selectedDeck ? this.selectedDeck.cards : null)
      .then(() => this.httpStorage.startPolling())
      .then(() => this.router.navigate(['admin', this.httpStorage.sessionId]));
  }

  // noinspection JSMethodCanBeStatic
  compareDecks(d1: Deck, d2: Deck): boolean {
    return d1 && d2 && d1.name === d2.name;
  }
}

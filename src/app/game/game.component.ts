import { Component, OnInit } from '@angular/core';
import { HttpStorageService, Session } from '../http-storage.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  session: Session;
  sessionId: string;
  newStoryName: string;

  constructor(private httpStorage: HttpStorageService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.httpStorage.getSession().subscribe(session => {
      console.info('game start', session);
      this.session = session;
      this.sessionId = this.httpStorage.sessionId;
    });
  }

  addStory(name: string) {
    console.info('addStory', name);
    this.httpStorage.addStory(name);
  }
}

import { Component, OnInit } from '@angular/core';
import { HttpStorageService, Participant, Session, Story } from '../http-storage.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  isAdmin: boolean;
  session: Session;
  sessionId: string;
  newStoryName: string;
  participants: Participant[];
  currentParticipant: Participant;
  votingStory: Story;

  constructor(private httpStorage: HttpStorageService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.url.subscribe(u => {
      this.isAdmin = u[0].path === 'admin';
    });
    this.httpStorage.getSession().subscribe(session => {
      console.info('game start', session);
      this.session = session;
      this.sessionId = this.httpStorage.sessionId;
      this.participants = session.participants.slice();
      this.participants.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      this.currentParticipant = this.participants.find(p => p.id === this.httpStorage.participantId);
      this.votingStory = session.stories.find(s => s.votingInProgress);
    });
  }

  addStory(name: string) {
    console.info('addStory', name);
    this.httpStorage.addStory(name);
  }
}

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
  newStoryNames: string;
  editing: string;
  editingStoryName: string;
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

  addStories() {
    const names = this.newStoryNames.split('\n').map(s => s.trim()).filter(s => !!s);
    if (names.length) this.httpStorage.addStories(names);
    this.newStoryNames = '';
  }

  editStory(storyId: string) {
    const story = this.session.stories.find(s => s.id === storyId);
    if (story) {
      console.info('editing', storyId);
      this.editing = storyId;
      this.editingStoryName = story.name;
    }
  }

  saveStoryEdit() {
    if (this.editing) {
      this.httpStorage.editStory(this.editing, this.editingStoryName);
      this.editing = null;
      this.editingStoryName = null;
    }
  }

  cancelStoryEdit() {
    if (this.editing) {
      this.editing = null;
      this.editingStoryName = null;
    }
  }
}

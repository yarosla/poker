import { Component, OnInit } from '@angular/core';
import { HttpStorageService, Participant, Session, Story } from '../http-storage.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  isAdmin: boolean;
  isObserver: boolean;
  session: Session;
  sessionId: string;
  newStoryNames: string;
  editingStory: string;
  editingStoryName: string;
  editingParticipant: string;
  editingParticipantName: string;
  participants: Participant[];
  currentParticipant: Participant;
  votingStory: Story;

  constructor(public httpStorage: HttpStorageService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.isAdmin = data.admin;
      this.isObserver = data.observer;
    });
    this.httpStorage.getSession().subscribe(session => {
      console.debug('game start', session);
      this.session = session;
      this.sessionId = this.httpStorage.sessionId;
      this.participants = session.participants.slice();
      this.participants.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      this.currentParticipant = this.participants.find(p => p.id === this.httpStorage.participantId);
      this.votingStory = session.stories.find(s => s.votingInProgress);
    });
  }

  hideVote(story: Story, participant: Participant): boolean {
    return !this.isAdmin && story.votingInProgress
      && (!this.currentParticipant || participant.id !== this.currentParticipant.id);
  }

  addStories() {
    const names = this.newStoryNames.split('\n').map(s => s.trim()).filter(s => !!s);
    if (names.length) this.httpStorage.addStories(names);
    this.newStoryNames = '';
  }

  editStory(storyId: string) {
    const story = this.session.stories.find(s => s.id === storyId);
    if (story) {
      console.info('editing story', storyId);
      this.editingStory = storyId;
      this.editingStoryName = story.name;
    }
  }

  saveStoryEdit() {
    if (this.editingStory) {
      this.httpStorage.editStory(this.editingStory, this.editingStoryName);
      this.editingStory = null;
      this.editingStoryName = null;
    }
  }

  cancelStoryEdit() {
    if (this.editingStory) {
      this.editingStory = null;
      this.editingStoryName = null;
    }
  }

  editParticipant(participantId: string) {
    const participant = this.session.participants.find(p => p.id === participantId);
    if (participant) {
      console.info('editing participant', participantId);
      this.editingParticipant = participantId;
      this.editingParticipantName = participant.name;
    }
  }

  saveParticipantEdit() {
    if (this.editingParticipant) {
      this.httpStorage.editParticipant(this.editingParticipant, this.editingParticipantName);
      this.cancelParticipantEdit();
    }
  }

  deleteEditingParticipant() {
    if (this.editingParticipant) {
      this.httpStorage.deleteParticipant(this.editingParticipant);
      this.cancelParticipantEdit();
    }
  }

  cancelParticipantEdit() {
    this.editingParticipant = null;
    this.editingParticipantName = null;
  }

  saveReport(): void {
    const filename = this.session.name + '.txt';
    const header = ['Story'].concat(this.participants.map(p => p.name)).join('\t') + '\r\n';
    const rows = this.session.stories.map(s =>
      [s.name].concat(this.participants.map(p => s.votes[p.id])).join('\t')).join('\r\n');
    const blob = new Blob([header, rows], { type: 'text/plain' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    }
    else {
      const elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }
}

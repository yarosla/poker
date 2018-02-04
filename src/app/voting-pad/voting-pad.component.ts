import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Story } from '../http-storage.service';

@Component({
  selector: 'app-voting-pad',
  templateUrl: './voting-pad.component.html',
  styleUrls: ['./voting-pad.component.css']
})
export class VotingPadComponent implements OnInit {

  @Input() story: Story;
  @Input() confirmedVote: string;
  @Input() deck: string[];
  @Output() vote = new EventEmitter();

  private voted: string;

  constructor() {
  }

  ngOnInit() {
  }

  doVote(score: string) {
    this.voted = score;
    this.vote.emit(score);
  }
}

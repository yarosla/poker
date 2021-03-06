import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
import { HttpStorageService } from '../http-storage.service';

@Component({
  selector: 'app-join-session',
  templateUrl: './join-session.component.html',
  styleUrls: ['./join-session.component.css']
})
export class JoinSessionComponent implements OnInit {

  participantName: string;

  constructor(private route: ActivatedRoute, private router: Router, private httpStorage: HttpStorageService) {
  }

  ngOnInit() {
  }

  joinSession(name?: string) {
    this.route.params
      .map(params => {
        console.debug('params', params);
        return params.sessionId;
      })
      .subscribe((id) => {
        console.debug('params.sessionId', id);
        this.httpStorage.joinSession(id)
          .then((session) => name ? this.httpStorage.registerParticipant(name) : session)
          .then(() => this.httpStorage.startPolling())
          .then(() => this.router.navigate(
            name ? ['play', this.httpStorage.sessionId, this.httpStorage.participantId]
              : ['observe', this.httpStorage.sessionId]
          ));
      });
  }
}

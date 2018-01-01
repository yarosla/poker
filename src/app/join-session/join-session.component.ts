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

  joinSession(name) {
    this.route.params
      .map(params => {
        console.info('params', params);
        return params.id;
      })
      .subscribe((id) => {
        console.info('params.id', id);
        this.httpStorage.joinSession(id)
          .then(() => this.httpStorage.registerParticipant(name))
          .then(() => this.httpStorage.startPolling())
          .then(() => this.router.navigate(['play']));
      });
  }
}

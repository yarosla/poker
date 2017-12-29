import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {HttpStorageService} from "../http-storage.service";

@Component({
  selector: 'app-new-session',
  templateUrl: './new-session.component.html',
  styleUrls: ['./new-session.component.css']
})
export class NewSessionComponent implements OnInit {

  constructor(private httpStorage: HttpStorageService, private router: Router) {
  }

  ngOnInit() {
  }

  newSessionName: string;

  startSession(name: string) {
    this.httpStorage.startSession(name)
      .then(() => this.httpStorage.startPolling())
      .then(() => this.router.navigate(['admin']));
  }
}

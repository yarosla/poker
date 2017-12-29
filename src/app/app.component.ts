import {Component} from '@angular/core';
import {HttpStorageService} from "./http-storage.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  constructor(private httpStorage: HttpStorageService) {
  }

  ngOnInit() {
  }
}

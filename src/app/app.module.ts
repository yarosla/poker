import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {HttpClientModule} from "@angular/common/http";
import {HttpStorageService} from "./http-storage.service";


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [HttpStorageService],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor() {
  }
}

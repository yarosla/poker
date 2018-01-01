import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { HttpStorageService } from './http-storage.service';
import { NewSessionComponent } from './new-session/new-session.component';
import { JoinSessionComponent } from './join-session/join-session.component';
import { GameComponent } from './game/game.component';
import { GameGuard } from './game.guard';
import { ConfigService } from './config.service';


const appRoutes: Routes = [
  { path: 'new', component: NewSessionComponent },
  { path: 'join/:id', component: JoinSessionComponent },
  { path: 'play', component: GameComponent, canActivate: [GameGuard], data: { admin: false } },
  { path: 'admin', component: GameComponent, canActivate: [GameGuard], data: { admin: true } },
  { path: '**', redirectTo: 'new' },
];


@NgModule({
  declarations: [
    AppComponent,
    NewSessionComponent,
    JoinSessionComponent,
    GameComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes/*, {enableTracing: true}*/)
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    ConfigService,
    HttpStorageService,
    GameGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

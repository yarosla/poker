import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { HttpStorageService } from './http-storage.service';

@Injectable()
export class GameGuard implements CanActivate {

  constructor(private httpStorage: HttpStorageService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.httpStorage.sessionId) return true;

    const isAdmin = route.url[0].path === 'admin';
    console.debug('guarding', isAdmin, route.url, route.params);

    return this.httpStorage
      .joinSession(route.params.sessionId)
      .then(session => {
        if (isAdmin) {
          this.httpStorage.startPolling();
          return true;
        } else {
          return this.httpStorage.joinAsParticipant(route.params.participantId)
            .then(() => this.httpStorage.startPolling())
            .then(p => true, err => {
              console.debug('guard err2', err);
              this.router.navigate(['join', route.params.sessionId]);
              return false;
            });
        }
      })
      .then(can => can, err => {
        console.debug('guard err1', err);
        this.router.navigate(['new']);
        return false;
      });
  }
}

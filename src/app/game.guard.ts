import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {HttpStorageService} from "./http-storage.service";

@Injectable()
export class GameGuard implements CanActivate {

  constructor(private httpStorage: HttpStorageService, private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.httpStorage.sessionId)
      this.router.navigate(['new']);
    return true;
  }
}

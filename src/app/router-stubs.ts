export { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';

import { Component, Directive, Injectable, Input } from '@angular/core';
import { NavigationExtras, UrlSegment } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Directive({
  selector: '[routerLink]',
  host: {
    '(click)': 'onClick()'
  }
})
export class RouterLinkStubDirective {
  @Input() routerLink: any;
  navigatedTo: any = null;

  onClick() {
    this.navigatedTo = this.routerLink;
  }
}

@Component({ selector: 'router-outlet', template: '' })
export class RouterOutletStubComponent {
}

@Injectable()
export class RouterStub {
  navigate(commands: any[], extras?: NavigationExtras) {
  }
}


// Only implements params and part of snapshot.params
@Injectable()
export class ActivatedRouteStub {

  private paramsSubject = new BehaviorSubject(this.testParams);
  params = this.paramsSubject.asObservable();
  private urlSubject = new BehaviorSubject<UrlSegment[]>(this.testUrl);
  url = this.urlSubject.asObservable();

  constructor(params?, url?) {
    this.testParams = params || {};
    this.testUrl = url || [];
  }

  private _testParams: {};
  get testParams() {
    return this._testParams;
  }

  set testParams(params: {}) {
    this._testParams = params;
    this.paramsSubject.next(params);
  }

  private _testUrl: UrlSegment[];
  get testUrl() {
    return this._testUrl;
  }

  set testUrl(url: UrlSegment[]) {
    this._testUrl = url;
    this.urlSubject.next(url);
  }

  // ActivatedRoute.snapshot.params
  get snapshot() {
    return { params: this.testParams };
  }
}

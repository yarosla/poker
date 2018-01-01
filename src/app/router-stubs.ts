export { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';

import { Component, Directive, Injectable, Input } from '@angular/core';
import { NavigationExtras } from '@angular/router';
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

  // ActivatedRoute.params is Observable
  private subject = new BehaviorSubject(this.testParams);
  params = this.subject.asObservable();

  constructor(params?) {
    this.testParams = this.params;
  }

// Test parameters
  private _testParams: {};
  get testParams() {
    return this._testParams;
  }

  set testParams(params: {}) {
    this._testParams = params;
    this.subject.next(params);
  }

  // ActivatedRoute.snapshot.params
  get snapshot() {
    return { params: this.testParams };
  }
}

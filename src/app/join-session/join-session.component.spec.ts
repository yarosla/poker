import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {JoinSessionComponent} from './join-session.component';
import {FormsModule} from "@angular/forms";
import {ActivatedRouteStub, RouterStub} from "../router-stubs";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpStorageStubService} from "../stubs";
import {HttpStorageService} from "../http-storage.service";

describe('JoinSessionComponent', () => {
  let component: JoinSessionComponent;
  let fixture: ComponentFixture<JoinSessionComponent>;

  beforeEach(async(() => {
    let activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [JoinSessionComponent],
      providers: [
        {provide: HttpStorageService, useClass: HttpStorageStubService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useValue: activatedRoute},
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {NewSessionComponent} from './new-session.component';
import {ActivatedRoute, Router} from "@angular/router";
import {ActivatedRouteStub, RouterStub} from "../router-stubs";
import {HttpStorageStubService} from "../stubs";
import {HttpStorageService} from "../http-storage.service";
import {FormsModule} from "@angular/forms";

describe('NewSessionComponent', () => {
  let component: NewSessionComponent;
  let fixture: ComponentFixture<NewSessionComponent>;

  beforeEach(async(() => {
    let activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [NewSessionComponent],
      providers: [
        {provide: HttpStorageService, useClass: HttpStorageStubService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useValue: activatedRoute},
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

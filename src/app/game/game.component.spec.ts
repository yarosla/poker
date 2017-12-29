import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {GameComponent} from './game.component';
import {ActivatedRoute, Router} from "@angular/router";
import {ActivatedRouteStub, RouterLinkStubDirective, RouterStub} from "../router-stubs";
import {HttpStorageService} from "../http-storage.service";
import {FormsModule} from "@angular/forms";
import {HttpStorageStubService} from "../stubs";

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(async(() => {
    let activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GameComponent, RouterLinkStubDirective],
      providers: [
        {provide: HttpStorageService, useClass: HttpStorageStubService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useValue: activatedRoute},
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

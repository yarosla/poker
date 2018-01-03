import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { instance, mock, when } from 'ts-mockito';

import { GameComponent } from './game.component';
import { HttpStorageService, Session } from '../http-storage.service';
import { ActivatedRouteStub, RouterLinkStubDirective, RouterStub } from '../../testing/router-stubs';
import { VotingPadComponent } from '../voting-pad/voting-pad.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  const httpStorageMock = mock(HttpStorageService);
  when(httpStorageMock.getSession()).thenCall(() => {
    console.info('generating new session');
    return Observable.of(new Session('test'))
  });
  when(httpStorageMock.sessionId).thenReturn('0abcd');

  beforeEach(async(() => {
    const activatedRoute = new ActivatedRouteStub({}, [{path:'admin'}]);
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GameComponent, RouterLinkStubDirective, VotingPadComponent],
      providers: [
        { provide: HttpStorageService, useValue: instance(httpStorageMock) },
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRoute },
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

import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { GameGuard } from './game.guard';
import { HttpStorageService, Participant, Session } from './http-storage.service';
import { UrlSegment } from '@angular/router/src/url_tree';
import { anything, deepEqual, instance, mock, reset, verify, when } from 'ts-mockito';

describe('GameGuard', () => {
  const routerMock = mock(Router);
  const routeMock = mock(ActivatedRouteSnapshot);
  const httpStorageMock = mock(HttpStorageService);

  beforeEach(() => {
    reset(routerMock);
    reset(routeMock);
    reset(httpStorageMock);
    TestBed.configureTestingModule({
      providers: [
        GameGuard,
        { provide: HttpStorageService, useValue: instance(httpStorageMock) },
        { provide: Router, useValue: instance(routerMock) },
      ]
    });
  });

  it('should allow access to admin', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '0abcd' });
    when(routeMock.url).thenReturn([{ path: 'admin' } as UrlSegment]);
    when(routeMock.data).thenReturn({ admin: true });
    when(httpStorageMock.joinSession('0abcd'))
      .thenCall(() => Promise.resolve(new Session()));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(true),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('0abcd')).once();
    verify(httpStorageMock.joinAsParticipant(anything())).never();
    verify(routerMock.navigate(anything())).never();
  })));

  it('should allow access to player', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '0abcd', participantId: 'fgh' });
    when(routeMock.url).thenReturn([{ path: 'play' } as UrlSegment]);
    when(routeMock.data).thenReturn({});
    when(httpStorageMock.joinSession('0abcd'))
      .thenCall(() => Promise.resolve(new Session()));
    when(httpStorageMock.joinAsParticipant('fgh'))
      .thenCall(() => Promise.resolve({ id: 'fgh', name: 'FGH' } as Participant));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(true),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('0abcd')).once();
    verify(httpStorageMock.joinAsParticipant('fgh')).once();
    verify(routerMock.navigate(anything())).never();
  })));

  it('should allow access to observer', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '0abcd' });
    when(routeMock.url).thenReturn([{ path: 'observe' } as UrlSegment]);
    when(routeMock.data).thenReturn({ observer: true });
    when(httpStorageMock.joinSession('0abcd'))
      .thenCall(() => Promise.resolve(new Session()));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(true),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('0abcd')).once();
    verify(httpStorageMock.joinAsParticipant(anything())).never();
    verify(routerMock.navigate(anything())).never();
  })));

  it('should deny access to play on short url', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '0abcd' });
    when(routeMock.url).thenReturn([{ path: 'play' } as UrlSegment]);
    when(routeMock.data).thenReturn({});
    when(httpStorageMock.joinSession('0abcd'))
      .thenCall(() => Promise.resolve(new Session()));
    when(httpStorageMock.joinAsParticipant(undefined))
      .thenCall(participantId => Promise.reject('no such participant ' + participantId));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(false),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('0abcd')).once();
    verify(httpStorageMock.joinAsParticipant(undefined)).once();
    verify(routerMock.navigate(deepEqual(['join', '0abcd']))).once();
  })));

  it('should deny access to play on shortest url', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({});
    when(routeMock.url).thenReturn([{ path: 'play' } as UrlSegment]);
    when(routeMock.data).thenReturn({});
    when(httpStorageMock.joinSession(undefined))
      .thenCall(sessionId => Promise.reject('no such session ' + sessionId));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(false),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession(undefined)).once();
    verify(httpStorageMock.joinAsParticipant(anything())).never();
    verify(routerMock.navigate(deepEqual(['new']))).once();
  })));

  it('should deny access to wrong player', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '0abcd', participantId: 'jkl' });
    when(routeMock.url).thenReturn([{ path: 'play' } as UrlSegment]);
    when(routeMock.data).thenReturn({});
    when(httpStorageMock.joinSession('0abcd'))
      .thenCall(() => Promise.resolve(new Session()));
    when(httpStorageMock.joinAsParticipant('jkl'))
      .thenCall(participantId => Promise.reject('no such participant ' + participantId));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(false),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('0abcd')).once();
    verify(httpStorageMock.joinAsParticipant('jkl')).once();
    verify(routerMock.navigate(deepEqual(['join', '0abcd']))).once();
  })));

  it('should deny access to play wrong session', fakeAsync(inject([GameGuard], (guard: GameGuard) => {
    when(routeMock.params).thenReturn({ sessionId: '1abcd', participantId: 'fgh' });
    when(routeMock.url).thenReturn([{ path: 'play' } as UrlSegment]);
    when(routeMock.data).thenReturn({});
    when(httpStorageMock.joinSession('1abcd'))
      .thenCall(sessionId => Promise.reject('no such session ' + sessionId));

    Promise.resolve(guard.canActivate(instance(routeMock), null) as boolean)
      .then(can => expect(can).toEqual(false),
        err => expect(err).toBeUndefined());

    tick();
    verify(httpStorageMock.joinSession('1abcd')).once();
    verify(httpStorageMock.joinAsParticipant(anything())).never();
    verify(routerMock.navigate(deepEqual(['new']))).once();
  })));
});

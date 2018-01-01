import { inject, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { GameGuard } from './game.guard';
import { HttpStorageService } from './http-storage.service';
import { HttpStorageStubService } from './stubs';
import { RouterStub } from './router-stubs';

describe('GameGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameGuard,
        { provide: HttpStorageService, useClass: HttpStorageStubService },
        { provide: Router, useClass: RouterStub },
      ]
    });
  });

  it('should ...', inject([GameGuard], (guard: GameGuard) => {
    expect(guard).toBeTruthy();
  }));
});

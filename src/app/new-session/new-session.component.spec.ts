import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { instance, mock } from 'ts-mockito';

import { NewSessionComponent } from './new-session.component';
import { HttpStorageService } from '../http-storage.service';
import { ActivatedRouteStub, RouterStub } from '../router-stubs';

describe('NewSessionComponent', () => {
  let component: NewSessionComponent;
  let fixture: ComponentFixture<NewSessionComponent>;
  const httpStorageMock = mock(HttpStorageService);

  beforeEach(async(() => {
    const activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [NewSessionComponent],
      providers: [
        { provide: HttpStorageService, useValue: instance(httpStorageMock) },
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRoute },
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

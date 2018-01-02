import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { instance, mock } from 'ts-mockito';

import { JoinSessionComponent } from './join-session.component';
import { ActivatedRouteStub, RouterStub } from "../router-stubs";
import { HttpStorageService } from "../http-storage.service";

describe('JoinSessionComponent', () => {
  let component: JoinSessionComponent;
  let fixture: ComponentFixture<JoinSessionComponent>;
  const httpStorageMock = mock(HttpStorageService);

  beforeEach(async(() => {
    const activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [JoinSessionComponent],
      providers: [
        { provide: HttpStorageService, useValue: instance(httpStorageMock) },
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRoute },
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

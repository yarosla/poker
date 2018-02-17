import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { instance, mock, when } from 'ts-mockito';

import { NewSessionComponent } from './new-session.component';
import { HttpStorageService } from '../http-storage.service';
import { ActivatedRouteStub, RouterStub } from '../../testing/router-stubs';
import { Config, ConfigService } from '../config.service';
import { Observable } from 'rxjs/Observable';

describe('NewSessionComponent', () => {
  let component: NewSessionComponent;
  let fixture: ComponentFixture<NewSessionComponent>;
  const httpStorageMock = mock(HttpStorageService);

  const configMock = mock(ConfigService);
  const configObservable = Observable.of<Config>({
    httpStoreUrl: '',
    pollTimeout: 0,
    decks: [{ name: '~', cards: ['1'] }]
  });
  when(configMock.getConfig()).thenReturn(configObservable);

  beforeEach(async(() => {
    const activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [NewSessionComponent],
      providers: [
        { provide: HttpStorageService, useValue: instance(httpStorageMock) },
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ConfigService, useValue: instance(configMock) },
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

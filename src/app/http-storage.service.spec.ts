import {async, fakeAsync, inject, TestBed, tick} from '@angular/core/testing';

import {HttpStorageService, Session, State} from './http-storage.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ConfigStubService} from "./stubs";
import {ConfigService} from "./config.service";

describe('HttpStorageService', () => {
  const URL = '/poker';
  const TIMEOUT = 1234;

  beforeEach(() => {
    const configStub = new ConfigStubService({httpStoreUrl: URL, pollTimeout: TIMEOUT});
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpStorageService, {provide: ConfigService, useValue: configStub}]
    });
  });

  afterEach(inject([HttpTestingController],
    (httpMock: HttpTestingController) => {
      httpMock.verify();
    }));

  it('should be created', inject([HttpStorageService],
    (service: HttpStorageService) => {
      expect(service).toBeTruthy();
    }));

  it('should start new session',
    async(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test startSession');
        const sessionName = 'TestSession';

        service.startSession(sessionName);

        const request = httpMock.expectOne({url: URL, method: 'POST'});
        expect(request.request.body).toEqual(new Session(sessionName));

        request.flush(new Session(sessionName), {
          headers: {
            'Location': 'http://localhost' + URL + '/0abcd',
            'ETag': '"0"',
          },
          status: 201,
          statusText: 'Created'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(0);
        expect(service.state.lastSession).toEqual(new Session(sessionName));
      })));

  it('should join session',
    fakeAsync(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test joinSession');
        const sessionName = 'TestSession';
        const sessionId = '0abcd';

        service.joinSession(sessionId)
          .then(() => service.registerParticipant('Fred'));

        const request1 = httpMock.expectOne({url: URL + '/0abcd', method: 'GET'});
        request1.flush(new Session(sessionName), {
          headers: {'ETag': '"0"'},
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.id).toEqual(sessionId);
        expect(service.state.version).toEqual(0);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        tick();

        const request2 = httpMock.expectOne({url: URL + '/' + sessionId, method: 'PUT'});
        expect(request2.request.headers.get('if-match')).toEqual('"0"');
        expect((request2.request.body as Session).name).toEqual(sessionName);
        expect((request2.request.body as Session).participants.length).toEqual(1);
        expect((request2.request.body as Session).participants[0].name).toEqual('Fred');

        request2.flush(request2.request.body, {
          headers: {'ETag': '"1"'},
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.version).toEqual(1);
        expect(service.state.lastSession.participants[0].name).toEqual('Fred');
      })));

  it('should update session after retry',
    inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test updateSession');
        const sessionName = 'TestSession';
        const newName = 'New Name';
        service.state = new State('0abcd', 3, new Session(sessionName));

        service.updateSession(s => s.name = newName);

        let request1 = httpMock.expectOne({url: URL + '/0abcd', method: 'PUT'});
        expect(request1.request.body).toEqual(new Session(newName));

        request1.flush(new Session(sessionName), {
          headers: {'ETag': '"4"'},
          status: 412,
          statusText: 'Precondition Failed'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        let request2 = httpMock.expectOne({url: URL + '/0abcd', method: 'PUT'});
        expect(request2.request.headers.get('if-match')).toEqual('"4"');
        expect(request2.request.body).toEqual(new Session(newName));

        request2.flush(new Session(newName), {
          headers: {'ETag': '"5"'},
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(5);
        expect(service.state.lastSession).toEqual(new Session(newName));
      }));

  it('should start/stop polling',
    fakeAsync(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test start/stopPolling');
        const sessionName = 'TestSession';
        const newName = 'New Name';
        service.state = new State('0abcd', 3, new Session(sessionName));

        service.startPolling();

        let request1 = httpMock.expectOne({url: URL + '/0abcd', method: 'GET'});
        expect(request1.request.headers.get('if-none-match')).toEqual('"3"');
        expect(request1.request.headers.get('timeout')).toEqual(TIMEOUT.toString());

        request1.flush(null, {
          headers: {'ETag': '"3"'},
          status: 304,
          statusText: 'Not Modified'
        });

        expect(service.state.version).toEqual(3);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        let request2 = httpMock.expectOne({url: URL + '/0abcd', method: 'GET'});
        expect(request2.request.headers.get('if-none-match')).toEqual('"3"');
        expect(request2.request.headers.get('timeout')).toEqual(TIMEOUT.toString());

        request2.flush(new Session(newName), {
          headers: {'ETag': '"4"'},
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(newName));

        let request3 = httpMock.expectOne({url: URL + '/0abcd', method: 'GET'});
        expect(request3.request.headers.get('if-none-match')).toEqual('"4"');
        expect(request3.request.headers.get('timeout')).toEqual(TIMEOUT.toString());

        service.stopPolling();

        request3.flush(null, {
          headers: {'ETag': '"4"'},
          status: 304,
          statusText: 'Not Modified'
        });

        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(newName));

        httpMock.expectNone({url: URL + '/0abcd', method: 'GET'});
      })));
});

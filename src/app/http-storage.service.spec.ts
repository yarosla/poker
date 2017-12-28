import {async, inject, TestBed} from '@angular/core/testing';

import {HttpStorageService, Session, State} from './http-storage.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";

describe('HttpStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpStorageService]
    });
  });

  it('should be created', inject([HttpStorageService], (service: HttpStorageService) => {
    expect(service).toBeTruthy();
  }));

  it('should create session with state',
    async(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test startSession');
        const sessionName = 'TestSession';
        service.startSession(sessionName);

        const request = httpMock.expectOne({url: '/v1/poker', method: 'POST'});
        expect(request.request.body).toEqual(new Session(sessionName));

        request.flush(new Session(sessionName), {
          headers: {
            'Location': 'http://localhost/v1/poker/0abcd',
            'ETag': '"0"',
          },
          status: 201,
          statusText: 'Created'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(0);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        httpMock.verify();
      })));

  it('should update session after retry',
    async(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test updateSession');
        const sessionName = 'TestSession';
        service.state = new State();
        service.state.id = '0abcd';
        service.state.version = 3;
        service.state.lastSession = new Session(sessionName);
        let newName = 'New Name';

        service.updateSession(s => s.name = newName);

        let request1 = httpMock.expectOne({url: '/v1/poker/0abcd', method: 'PUT'});
        expect(request1.request.body).toEqual(new Session(newName));

        request1.flush(new Session(sessionName), {
          headers: {
            'ETag': '"4"',
          },
          status: 412,
          statusText: 'Precondition Failed'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        let request2 = httpMock.expectOne({url: '/v1/poker/0abcd', method: 'PUT'});
        expect(request2.request.body).toEqual(new Session(newName));

        request2.flush(new Session(newName), {
          headers: {
            'ETag': '"5"',
          },
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.id).toEqual('0abcd');
        expect(service.state.version).toEqual(5);
        expect(service.state.lastSession).toEqual(new Session(newName));

        httpMock.verify();
      })));

  it('should start/stop polling',
    async(inject([HttpTestingController, HttpStorageService],
      (httpMock: HttpTestingController, service: HttpStorageService) => {
        console.info('test start/stopPolling');
        const sessionName = 'TestSession';
        service.state = new State();
        service.state.id = '0abcd';
        service.state.version = 3;
        service.state.lastSession = new Session(sessionName);
        let newName = 'New Name';

        service.startPolling();

        let request1 = httpMock.expectOne({url: '/v1/poker/0abcd', method: 'GET'});
        expect(request1.request.headers.get('if-none-match')).toEqual('"3"');
        expect(request1.request.headers.get('timeout')).toEqual('2000');

        request1.flush(null, {
          headers: {
            'ETag': '"3"',
          },
          status: 304,
          statusText: 'Not Modified'
        });

        expect(service.state.version).toEqual(3);
        expect(service.state.lastSession).toEqual(new Session(sessionName));

        let request2 = httpMock.expectOne({url: '/v1/poker/0abcd', method: 'GET'});
        expect(request2.request.headers.get('if-none-match')).toEqual('"3"');
        expect(request2.request.headers.get('timeout')).toEqual('2000');

        request2.flush(new Session(newName), {
          headers: {
            'ETag': '"4"',
          },
          status: 200,
          statusText: 'OK'
        });

        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(newName));

        let request3 = httpMock.expectOne({url: '/v1/poker/0abcd', method: 'GET'});
        expect(request3.request.headers.get('if-none-match')).toEqual('"4"');
        expect(request3.request.headers.get('timeout')).toEqual('2000');

        service.stopPolling();

        request3.flush(null, {
          headers: {
            'ETag': '"4"',
          },
          status: 304,
          statusText: 'Not Modified'
        });

        expect(service.state.version).toEqual(4);
        expect(service.state.lastSession).toEqual(new Session(newName));

        httpMock.expectNone({url: '/v1/poker/0abcd', method: 'GET'});

        httpMock.verify();
      })));

});

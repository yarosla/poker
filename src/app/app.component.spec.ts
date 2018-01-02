import { async, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AppComponent } from './app.component';
import { ActivatedRouteStub, RouterLinkStubDirective, RouterOutletStubComponent, RouterStub } from './router-stubs';


describe('AppComponent', () => {

  beforeEach(async(() => {
    const activatedRoute = new ActivatedRouteStub();
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        AppComponent,
        RouterLinkStubDirective, RouterOutletStubComponent
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  /*
    it(`should have as title 'app'`, async(() => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.debugElement.componentInstance;
      expect(app.title).toEqual('app');
    }));

    it('should render title in a h1 tag', async(() => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
    }));
  */
});

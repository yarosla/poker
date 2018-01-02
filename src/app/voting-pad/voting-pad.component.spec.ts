import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VotingPadComponent } from './voting-pad.component';

describe('VotingPadComponent', () => {
  let component: VotingPadComponent;
  let fixture: ComponentFixture<VotingPadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VotingPadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VotingPadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

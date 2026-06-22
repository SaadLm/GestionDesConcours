import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatureSuccess } from './candidature-success';

describe('CandidatureSuccess', () => {
  let component: CandidatureSuccess;
  let fixture: ComponentFixture<CandidatureSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatureSuccess],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatureSuccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

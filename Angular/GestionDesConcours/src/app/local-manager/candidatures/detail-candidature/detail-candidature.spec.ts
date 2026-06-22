import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailCandidature } from './detail-candidature';

describe('DetailCandidature', () => {
  let component: DetailCandidature;
  let fixture: ComponentFixture<DetailCandidature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailCandidature],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailCandidature);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

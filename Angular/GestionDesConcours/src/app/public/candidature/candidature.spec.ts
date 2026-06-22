import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Candidature } from './candidature';

describe('Candidature', () => {
  let component: Candidature;
  let fixture: ComponentFixture<Candidature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Candidature],
    }).compileComponents();

    fixture = TestBed.createComponent(Candidature);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

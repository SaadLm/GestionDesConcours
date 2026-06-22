import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Concours } from './concours';

describe('Concours', () => {
  let component: Concours;
  let fixture: ComponentFixture<Concours>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Concours],
    }).compileComponents();

    fixture = TestBed.createComponent(Concours);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

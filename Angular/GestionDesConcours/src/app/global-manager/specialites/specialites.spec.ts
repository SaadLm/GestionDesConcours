import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Specialites } from './specialites';

describe('Specialites', () => {
  let component: Specialites;
  let fixture: ComponentFixture<Specialites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Specialites],
    }).compileComponents();

    fixture = TestBed.createComponent(Specialites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

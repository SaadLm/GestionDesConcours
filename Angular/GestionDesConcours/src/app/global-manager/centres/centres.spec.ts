import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Centres } from './centres';

describe('Centres', () => {
  let component: Centres;
  let fixture: ComponentFixture<Centres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Centres],
    }).compileComponents();

    fixture = TestBed.createComponent(Centres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourCreatorComponent } from './tour-creator.component';

describe('TourCreatorComponent', () => {
  let component: TourCreatorComponent;
  let fixture: ComponentFixture<TourCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TourCreatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TourCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

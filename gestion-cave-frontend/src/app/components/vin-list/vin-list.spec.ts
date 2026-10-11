import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinListComponent } from './vin-list';

describe('VinList', () => {
  let component: VinListComponent;
  let fixture: ComponentFixture<VinListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinList } from './vin-list';

describe('VinList', () => {
  let component: VinList;
  let fixture: ComponentFixture<VinList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

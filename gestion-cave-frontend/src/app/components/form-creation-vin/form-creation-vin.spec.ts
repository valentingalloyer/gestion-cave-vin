import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCreationVin } from './form-creation-vin';

describe('FormCreationVin', () => {
  let component: FormCreationVin;
  let fixture: ComponentFixture<FormCreationVin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCreationVin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCreationVin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VinService } from '../../services/vin.service';
import { Vin } from '../../models/vin.model';

@Component({
  selector: 'app-vin-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-creation-vin.html',
  styleUrl: './form-creation-vin.css'
})
export class VinFormComponent {
  vinForm: FormGroup;
  vinAjoute = output<Vin>();

  constructor(private fb: FormBuilder, private vinService: VinService) {
    this.vinForm = this.fb.group({
      nom: ['', Validators.required],
      domaine: ['', Validators.required],
      millesime: [new Date().getFullYear(), [Validators.min(1900), Validators.max(2100)]],
      couleur: ['Rouge'],
      quantite: [1, [Validators.required, Validators.min(1)]],
      emplacement: ['']
    });
  }

  onSubmit() {
    if (this.vinForm.valid) {
      const nouveauVin = this.vinForm.value;
      this.vinService.addVin(nouveauVin).subscribe((vinEnregistre) => {
        this.vinAjoute.emit(vinEnregistre); // On prévient le parent
        this.vinForm.reset({ millesime: 2024, couleur: 'Rouge', quantite: 1 }); // On vide le formulaire
      });
    }
  }
}

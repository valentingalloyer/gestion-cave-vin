import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VinService } from '../../services/vin.service';
import { Vin } from '../../models/vin.model';
import {ToastService} from '../../services/toast';

@Component({
  selector: 'app-vin-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-creation-vin.html',
  styleUrl: './form-creation-vin.css'
})
export class VinFormComponent {
  readonly REGIONS_GROUPEES = [
    { label: 'Plutôt Rouges', regions: ['Bordeaux', 'Bourgogne', 'Vallée du Rhône', 'Sud-Ouest', 'Beaujolais', 'Auvergne'] },
    { label: 'Plutôt Blancs / Effervescents', regions: ['Alsace', 'Champagne', 'Loire', 'Jura', 'Savoie', 'Lorraine', 'Bugey'] },
    { label: 'Plutôt Rosés / Sud', regions: ['Provence', 'Corse', 'Languedoc-Roussillon'] }
  ];

  vinForm: FormGroup;
  vinAjoute = output<Vin>();

  get currentCouleur(): string {
    return this.vinForm.get('couleur')?.value?.toLowerCase().replace('é', 'e') || 'rouge';
  }

  constructor(private fb: FormBuilder,
              private vinService: VinService,
              private toastService: ToastService) {
    const anneeActuelle = new Date().getFullYear();

    this.vinForm = this.fb.group({
      nom: ['', Validators.required],
      domaine: ['', Validators.required],
      appellation: ['', Validators.required],
      millesime: [anneeActuelle, [Validators.min(1900), Validators.max(anneeActuelle)]],
      couleur: ['Rouge'],
      quantite: [1, [Validators.required, Validators.min(1)]],
      emplacement: [''],
      apogeeDebut: [null, [Validators.min(1900), Validators.max(2200)]],
      apogeeFin: [null, [Validators.min(1900), Validators.max(2200)]],
      notePersonnelle: ['']
    });
  }

  onSubmit() {
    if (this.vinForm.valid) {
      const nouveauVin = this.vinForm.value;
      this.vinService.addVin(nouveauVin).subscribe((vinEnregistre) => {
        this.vinAjoute.emit(vinEnregistre);
        this.toastService.show(`🍷 ${vinEnregistre.nom} ajouté avec succès !`)
        this.vinForm.reset({
          millesime: new Date().getFullYear(),
          couleur: 'Rouge',
          quantite: 1,
          emplacement: '',
          apogeeDebut: null,
          apogeeFin: null,
          notePersonnelle: ''
        });
      });
    }
  }
}

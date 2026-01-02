import {Component, output, signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VinService } from '../../services/vin.service';
import { Vin } from '../../models/vin.model';
import {ToastService} from '../../services/toast';
import {REGIONS_GROUPEES} from '../../models/groupeVin.model';

@Component({
  selector: 'app-vin-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-creation-vin.html',
  styleUrl: './form-creation-vin.css'
})
export class VinFormComponent {
  readonly REGIONS_GROUPEES = REGIONS_GROUPEES;

  vinForm: FormGroup;
  vinAjoute = output<Vin>();
  isHighlighted = signal(false);

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

  // Dans vin-form.component.ts
  remplirDepuisExistant(vin: any) {
    this.vinForm.patchValue({
      nom: vin.nom,
      domaine: vin.domaine,
      appellation: vin.appellation,
      couleur: vin.couleur,
      millesime: new Date().getFullYear(),
      quantite: 1,
      emplacement: ''
    });

    this.isHighlighted.set(true);
    setTimeout(() => {
      this.isHighlighted.set(false);
    }, 3000);

    document.getElementById('millesime')?.focus();
  }
}

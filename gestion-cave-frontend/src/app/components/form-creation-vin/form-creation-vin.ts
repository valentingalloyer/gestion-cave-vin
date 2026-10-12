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
  vinEnregistre = output<Vin>();
  isHighlighted = signal(false);
  // Bouteille en cours de modification (null = mode ajout)
  vinEnEdition = signal<Vin | null>(null);

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
      notePersonnelle: [''],
      note: [0]
    });
  }

  onSubmit() {
    if (this.vinForm.invalid) return;

    const vinEnEdition = this.vinEnEdition();

    if (vinEnEdition) {
      this.vinService.updateVin({...this.vinForm.value, id: vinEnEdition.id}).subscribe((vinModifie) => {
        this.vinEnregistre.emit(vinModifie);
        this.toastService.show(`✏️ ${vinModifie.nom} ${vinModifie.millesime} modifié !`);
        this.reinitialiser();
      });
    } else {
      this.vinService.addVin(this.vinForm.value).subscribe((vinAjoute) => {
        this.vinEnregistre.emit(vinAjoute);
        this.toastService.show(`🍷 ${vinAjoute.nom} ajouté avec succès !`);
        this.reinitialiser();
      });
    }
  }

  remplirDepuisExistant(vin: Vin) {
    // Un nouveau millésime est un ajout, même si une modification était en cours
    this.reinitialiser();

    this.vinForm.patchValue({
      nom: vin.nom,
      domaine: vin.domaine,
      appellation: vin.appellation,
      couleur: vin.couleur
    });

    this.mettreEnAvant('millesime');
  }

  modifier(vin: Vin) {
    this.vinEnEdition.set(vin);
    // Une bouteille modifiée peut être à 0 (bue mais gardée en mémoire)
    this.vinForm.get('quantite')?.setValidators([Validators.required, Validators.min(0)]);

    this.vinForm.reset({
      nom: vin.nom,
      domaine: vin.domaine,
      appellation: vin.appellation,
      millesime: vin.millesime,
      couleur: vin.couleur,
      quantite: vin.quantite,
      emplacement: vin.emplacement ?? '',
      // L'API renvoie 0 quand l'apogée n'est pas renseignée
      apogeeDebut: vin.apogeeDebut || null,
      apogeeFin: vin.apogeeFin || null,
      notePersonnelle: vin.notePersonnelle ?? '',
      note: vin.note ?? 0
    });

    this.mettreEnAvant('nom');
  }

  annulerModification() {
    this.reinitialiser();
  }

  setNote(valeur: number) {
    this.vinForm.patchValue({ note: valeur });
  }

  private reinitialiser() {
    this.vinEnEdition.set(null);
    this.vinForm.get('quantite')?.setValidators([Validators.required, Validators.min(1)]);

    this.vinForm.reset({
      nom: '',
      domaine: '',
      appellation: '',
      millesime: new Date().getFullYear(),
      couleur: 'Rouge',
      quantite: 1,
      emplacement: '',
      apogeeDebut: null,
      apogeeFin: null,
      notePersonnelle: '',
      note: 0
    });
  }

  private mettreEnAvant(champ: string) {
    this.isHighlighted.set(true);
    setTimeout(() => {
      this.isHighlighted.set(false);
    }, 3000);

    document.getElementById(champ)?.focus();
  }
}

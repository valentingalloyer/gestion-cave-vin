import {Component, HostListener, output, signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VinService } from '../../services/vin.service';
import { Vin } from '../../models/vin.model';
import {ToastService} from '../../services/toast';
import {REGIONS_GROUPEES} from '../../models/groupeVin.model';

/**
 * Panneau latéral d'ajout / modification / suppression d'une bouteille
 */
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
  // Émis après un ajout, une modification ou une suppression
  caveModifiee = output<void>();
  ouvert = signal(false);
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

  ouvrirAjout() {
    this.reinitialiser();
    this.ouvrir('nom');
  }

  remplirDepuisExistant(vin: Vin) {
    // Un nouveau millésime est un ajout, même depuis une bouteille en cours de modification
    this.reinitialiser();

    this.vinForm.patchValue({
      nom: vin.nom,
      domaine: vin.domaine,
      appellation: vin.appellation,
      couleur: vin.couleur
    });

    this.ouvrir('millesime');
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

    this.ouvrir('nom');
  }

  ajouterMillesimeDepuisEdition() {
    const vin = this.vinEnEdition();
    if (vin && this.abandonConfirme()) {
      this.remplirDepuisExistant(vin);
    }
  }

  onSubmit() {
    if (this.vinForm.invalid) return;

    const vinEnEdition = this.vinEnEdition();

    if (vinEnEdition) {
      this.vinService.updateVin({...this.vinForm.value, id: vinEnEdition.id}).subscribe((vinModifie) => {
        this.toastService.show(`✏️ ${vinModifie.nom} ${vinModifie.millesime} modifié`);
        this.terminer();
      });
    } else {
      this.vinService.addVin(this.vinForm.value).subscribe((vinAjoute) => {
        this.toastService.show(`🍷 ${vinAjoute.nom} ${vinAjoute.millesime} ajouté à la cave`);
        this.terminer();
      });
    }
  }

  supprimer() {
    const vin = this.vinEnEdition();
    if (!vin?.id) return;

    if (confirm(`Voulez-vous vraiment supprimer tous les "${vin.nom}" ${vin.millesime} de votre cave ?`)) {
      this.vinService.deleteVin(vin.id).subscribe(() => {
        this.toastService.show(`🗑️ "${vin.nom}" ${vin.millesime} a été retiré de la cave.`);
        this.terminer();
      });
    }
  }

  @HostListener('document:keydown.escape')
  fermer() {
    if (this.ouvert() && this.abandonConfirme()) {
      this.fermerPanneau();
    }
  }

  setNote(valeur: number) {
    this.vinForm.patchValue({ note: valeur });
    this.vinForm.markAsDirty();
  }

  private ouvrir(champAFocaliser: string) {
    this.ouvert.set(true);
    // La page derrière le panneau ne défile plus
    document.body.style.overflow = 'hidden';
    // Le panneau n'existe dans le DOM qu'au prochain rendu
    setTimeout(() => document.getElementById(champAFocaliser)?.focus());
  }

  private terminer() {
    this.caveModifiee.emit();
    this.fermerPanneau();
  }

  private fermerPanneau() {
    this.ouvert.set(false);
    document.body.style.overflow = '';
    this.reinitialiser();
  }

  private abandonConfirme(): boolean {
    return !this.vinForm.dirty || confirm('Abandonner les modifications non enregistrées ?');
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
}

import {AfterViewInit, Component, HostListener, input, output, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Vin} from '../../models/vin.model';
import {DegustationService} from '../../services/degustation.service';
import {ToastService} from '../../services/toast';

/** Date du jour au format AAAA-MM-JJ, dans le fuseau de l'appareil */
export function aujourdhui(): string {
  return new Date().toLocaleDateString('sv-SE');
}

/**
 * Fenêtre "Ouvrir une bouteille" : note la dégustation dans le journal
 * et retire une bouteille de la cave
 */
@Component({
  selector: 'app-ouvrir-bouteille',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ouvrir-bouteille.html',
  styleUrl: './ouvrir-bouteille.css'
})
export class OuvrirBouteilleComponent implements AfterViewInit {
  vin = input.required<Vin>();
  fermer = output<void>();
  // Émis une fois la dégustation enregistrée
  ouverte = output<void>();

  readonly aujourdhui = aujourdhui();
  formulaire: FormGroup;
  enCours = signal(false);

  constructor(private fb: FormBuilder,
              private degustationService: DegustationService,
              private toastService: ToastService) {
    this.formulaire = this.fb.group({
      date: [this.aujourdhui, Validators.required],
      occasion: [''],
      note: [0],
      commentaire: ['', Validators.maxLength(1000)]
    });
  }

  ngAfterViewInit() {
    document.getElementById('occasion')?.focus();
  }

  @HostListener('document:keydown.escape')
  onEchap() {
    this.fermer.emit();
  }

  setNote(note: number) {
    // Un second clic sur la même étoile retire la note
    this.formulaire.patchValue({note: this.formulaire.value.note === note ? 0 : note});
  }

  onSubmit() {
    if (this.formulaire.invalid || this.enCours()) return;
    this.enCours.set(true);

    const vin = this.vin();
    this.degustationService.ouvrirBouteille({vinId: vin.id!, ...this.formulaire.value}).subscribe({
      next: () => {
        const reste = Math.max(vin.quantite - 1, 0);
        this.toastService.show(`🍷 Bonne dégustation ! Il reste ${reste} ${vin.nom} ${vin.millesime}.`);
        this.ouverte.emit();
      },
      // Le message d'erreur est affiché par erreursInterceptor ; la fenêtre reste ouverte
      error: () => this.enCours.set(false)
    });
  }
}

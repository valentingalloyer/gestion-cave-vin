import {AfterViewInit, Component, HostListener, output, signal} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from '../../services/auth-service';
import {ToastService} from '../../services/toast';

const LONGUEUR_MIN = 4;

/** Le nouveau mot de passe et sa confirmation doivent être identiques */
function confirmationIdentique(groupe: AbstractControl): ValidationErrors | null {
  const {nouveau, confirmation} = groupe.value;
  return confirmation && nouveau !== confirmation ? {differents: true} : null;
}

/**
 * Fenêtre "Changer mon mot de passe"
 */
@Component({
  selector: 'app-mot-de-passe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mot-de-passe.html',
  styleUrl: './mot-de-passe.css'
})
export class MotDePasseComponent implements AfterViewInit {
  readonly longueurMin = LONGUEUR_MIN;
  fermer = output<void>();

  formulaire: FormGroup;
  enCours = signal(false);
  erreur = signal<string | null>(null);

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private toastService: ToastService) {
    this.formulaire = this.fb.group({
      ancien: ['', Validators.required],
      nouveau: ['', [Validators.required, Validators.minLength(LONGUEUR_MIN)]],
      confirmation: ['', Validators.required]
    }, {validators: confirmationIdentique});
  }

  ngAfterViewInit() {
    document.getElementById('ancien-mot-de-passe')?.focus();
  }

  @HostListener('document:keydown.escape')
  onEchap() {
    this.fermer.emit();
  }

  onSubmit() {
    if (this.formulaire.invalid || this.enCours()) return;

    this.enCours.set(true);
    this.erreur.set(null);
    const {ancien, nouveau} = this.formulaire.value;

    this.authService.changerMotDePasse(ancien, nouveau).subscribe({
      next: () => {
        this.toastService.show('🔒 Mot de passe modifié');
        this.fermer.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(err.status === 403 ? 'Le mot de passe actuel est incorrect.'
          : err.status === 400 ? `Le nouveau mot de passe doit faire au moins ${LONGUEUR_MIN} caractères.`
          : 'Le serveur ne répond pas, réessayez dans un instant.');
      }
    });
  }
}

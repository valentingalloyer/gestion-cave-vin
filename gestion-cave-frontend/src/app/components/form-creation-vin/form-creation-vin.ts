import {Component, computed, effect, HostListener, input, output, Signal, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {finalize, Observable} from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { VinService } from '../../services/vin.service';
import { Vin } from '../../models/vin.model';
import {ToastService} from '../../services/toast';
import {REGIONS_GROUPEES} from '../../models/groupeVin.model';
import {normaliser} from '../../models/texte';
import {Degustation} from '../../models/degustation.model';
import {DegustationService} from '../../services/degustation.service';
import {OuvrirBouteilleComponent} from '../ouvrir-bouteille/ouvrir-bouteille';

/** Champs du formulaire utiles aux suggestions et aux doublons */
interface ValeursSaisies {
  nom?: string;
  domaine?: string;
  millesime?: number | string;
  apogeeDebut?: number | null;
  apogeeFin?: number | null;
}

/** Apogée déduite d'un autre millésime du même vin */
export interface ApogeeProposee {
  debut: number | null;
  fin: number | null;
  // Millésime dont on s'est inspiré, et sa période
  reference: Vin;
}

/** Un vin déjà présent dans la cave, proposé pendant la saisie du nom */
export interface SuggestionVin {
  vin: Vin;
  millesimes: number;
}

/**
 * Panneau latéral d'ajout / modification / suppression d'une bouteille
 */
@Component({
  selector: 'app-vin-form',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, OuvrirBouteilleComponent],
  templateUrl: './form-creation-vin.html',
  styleUrl: './form-creation-vin.css'
})
export class VinFormComponent {
  readonly REGIONS_GROUPEES = REGIONS_GROUPEES;

  // Toute la cave : sert aux suggestions et à la détection des doublons
  vins = input<Vin[]>([]);

  vinForm: FormGroup;
  // Émis après un ajout, une modification ou une suppression
  caveModifiee = output<void>();
  ouvert = signal(false);
  // Une requête est en cours : les boutons sont désactivés (pas de double envoi)
  enregistrement = signal(false);
  // Fenêtre "Ouvrir une bouteille" par-dessus le panneau
  degustationOuverte = signal(false);
  // Dégustations déjà notées pour la bouteille en cours de modification
  historique = signal<Degustation[]>([]);
  // Bouteille en cours de modification (null = mode ajout)
  vinEnEdition = signal<Vin | null>(null);

  private valeurs: Signal<ValeursSaisies>;

  // Suggestions sous le champ "Nom du vin"
  suggestionsVisibles = signal(false);
  suggestionActive = signal(-1);

  suggestions = computed<SuggestionVin[]>(() => {
    const recherche = normaliser(this.valeurs()?.nom);
    if (this.vinEnEdition() || recherche.length < 2) return [];

    // Un vin = un nom + un domaine ; on garde son millésime le plus récent
    const parVin = new Map<string, SuggestionVin>();
    for (const vin of this.vins()) {
      const cle = normaliser(vin.nom) + '|' + normaliser(vin.domaine);
      if (!cle.includes(recherche)) continue;
      const deja = parVin.get(cle);
      if (!deja) {
        parVin.set(cle, {vin, millesimes: 1});
      } else {
        deja.millesimes++;
        if (vin.millesime > deja.vin.millesime) deja.vin = vin;
      }
    }

    return [...parVin.values()]
      // Le vin déjà entièrement saisi n'a plus besoin d'être proposé
      .filter(s => !(normaliser(s.vin.nom) === recherche && normaliser(s.vin.domaine) === normaliser(this.valeurs()?.domaine)))
      .sort((a, b) => a.vin.nom.localeCompare(b.vin.nom))
      .slice(0, 6);
  });

  // Même vin (nom + domaine) et même millésime déjà dans la cave : on propose d'ajouter les bouteilles à cette référence
  doublon = computed<Vin | null>(() => {
    const v = this.valeurs();
    if (this.vinEnEdition() || !v?.nom || !v?.domaine || !v?.millesime) return null;
    return this.vins().find(vin =>
      normaliser(vin.nom) === normaliser(v.nom)
      && normaliser(vin.domaine) === normaliser(v.domaine)
      && vin.millesime === Number(v.millesime)) ?? null;
  });

  // Pour un vin déjà connu : période du millésime le plus proche, décalée d'autant d'années
  apogeeProposee = computed<ApogeeProposee | null>(() => {
    const v = this.valeurs();
    const millesime = Number(v?.millesime);
    if (this.vinEnEdition() || !v?.nom || !v?.domaine || !millesime) return null;

    const reference = this.vins()
      .filter(vin => (vin.apogeeDebut || vin.apogeeFin)
        && normaliser(vin.nom) === normaliser(v.nom)
        && normaliser(vin.domaine) === normaliser(v.domaine))
      .sort((a, b) => Math.abs(a.millesime - millesime) - Math.abs(b.millesime - millesime))[0];
    if (!reference) return null;

    const ecart = millesime - reference.millesime;
    return {
      debut: reference.apogeeDebut ? reference.apogeeDebut + ecart : null,
      fin: reference.apogeeFin ? reference.apogeeFin + ecart : null,
      reference
    };
  });

  // Dernière apogée remplie automatiquement : tant que les champs la contiennent, on peut la remplacer
  apogeeRemplie = signal<ApogeeProposee | null>(null);

  mentionApogee = computed<string | null>(() => {
    const proposee = this.apogeeRemplie();
    if (!proposee) return null;

    const {apogeeDebut: debut, apogeeFin: fin, millesime} = proposee.reference;
    const periode = debut && fin ? `${debut}–${fin}` : debut ? `dès ${debut}` : `jusqu'en ${fin}`;
    const ecart = Math.abs(Number(this.valeurs()?.millesime) - millesime);
    const decalage = ecart ? `, décalée de ${ecart} an${ecart > 1 ? 's' : ''}` : '';
    return `Apogée proposée d'après le ${millesime} (${periode})${decalage}. Vous pouvez la modifier.`;
  });

  get currentCouleur(): string {
    return this.vinForm.get('couleur')?.value?.toLowerCase().replace('é', 'e') || 'rouge';
  }

  constructor(private fb: FormBuilder,
              private vinService: VinService,
              private degustationService: DegustationService,
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

    this.valeurs = toSignal(this.vinForm.valueChanges, {initialValue: this.vinForm.value});

    // Remplit l'apogée proposée, sans jamais écraser une saisie de l'utilisateur
    effect(() => {
      const proposee = this.apogeeProposee();
      untracked(() => this.remplirApogee(proposee));
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

    this.degustationService.lister().subscribe({
      next: degustations => this.historique.set(degustations.filter(d => d.vinId === vin.id)),
      error: () => {}
    });

    this.ouvrir('nom');
  }

  ouvrirBouteille() {
    // Le panneau se ferme après la dégustation : on ne perd pas une modification sans prévenir
    if (this.abandonConfirme()) {
      this.degustationOuverte.set(true);
    }
  }

  apresDegustation() {
    this.degustationOuverte.set(false);
    this.terminer();
  }

  ajouterMillesimeDepuisEdition() {
    const vin = this.vinEnEdition();
    if (vin && this.abandonConfirme()) {
      this.remplirDepuisExistant(vin);
    }
  }

  // --- Suggestions ---

  classeCouleur(vin: Vin): string {
    // La couleur peut manquer sur d'anciennes bouteilles
    return (vin.couleur ?? '').toLowerCase().replace('é', 'e');
  }

  onNomSaisi() {
    this.suggestionsVisibles.set(true);
    this.suggestionActive.set(-1);
  }

  onNomClavier(event: KeyboardEvent) {
    const nombre = this.suggestions().length;
    if (nombre === 0) return;

    // Flèche bas : rouvre la liste si elle a été fermée
    if (!this.suggestionsVisibles()) {
      if (event.key === 'ArrowDown') this.suggestionsVisibles.set(true);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const pas = event.key === 'ArrowDown' ? 1 : -1;
      this.suggestionActive.update(i => (i + pas + nombre) % nombre);
    } else if (event.key === 'Enter' && this.suggestionActive() >= 0) {
      // Entrée choisit la suggestion au lieu d'envoyer le formulaire
      event.preventDefault();
      this.choisirSuggestion(this.suggestions()[this.suggestionActive()]);
    } else if (event.key === 'Escape') {
      // Échap ferme la liste sans fermer le panneau
      event.stopPropagation();
      this.suggestionsVisibles.set(false);
    }
  }

  choisirSuggestion(suggestion: SuggestionVin) {
    const vin = suggestion.vin;
    this.vinForm.patchValue({
      nom: vin.nom,
      domaine: vin.domaine,
      appellation: vin.appellation,
      couleur: vin.couleur
    });
    this.vinForm.markAsDirty();
    this.suggestionsVisibles.set(false);
    document.getElementById('millesime')?.focus();
  }

  // --- Enregistrement ---

  /**
   * @param continuer garde le panneau ouvert pour saisir la bouteille suivante
   */
  onSubmit(continuer = false) {
    if (this.vinForm.invalid) return;

    const vinEnEdition = this.vinEnEdition();

    if (vinEnEdition) {
      this.enregistrer(this.vinService.updateVin({...this.vinForm.value, id: vinEnEdition.id}), (vinModifie) => {
        this.toastService.show(`✏️ ${vinModifie.nom} ${vinModifie.millesime} modifié`);
        this.terminer();
      });
    } else {
      this.enregistrer(this.vinService.addVin(this.vinForm.value), (vinAjoute) => {
        this.toastService.show(`🍷 ${vinAjoute.nom} ${vinAjoute.millesime} ajouté à la cave`);
        if (continuer) {
          this.preparerBouteilleSuivante();
        } else {
          this.terminer();
        }
      });
    }
  }

  ajouterAuDoublon() {
    const existant = this.doublon();
    const ajout = Number(this.vinForm.value.quantite) || 1;
    if (!existant) return;

    this.enregistrer(this.vinService.updateVin({...existant, quantite: existant.quantite + ajout}), (vinModifie) => {
      this.toastService.show(`🍷 +${ajout} ${vinModifie.nom} ${vinModifie.millesime} (${vinModifie.quantite} en cave)`);
      this.terminer();
    });
  }

  supprimer() {
    const vin = this.vinEnEdition();
    if (!vin?.id) return;

    if (confirm(`Voulez-vous vraiment supprimer tous les "${vin.nom}" ${vin.millesime} de votre cave ?`)) {
      this.enregistrer(this.vinService.deleteVin(vin.id), () => {
        this.toastService.show(`🗑️ "${vin.nom}" ${vin.millesime} a été retiré de la cave.`);
        this.terminer();
      });
    }
  }

  @HostListener('document:keydown.escape')
  fermer() {
    // Échap ferme d'abord la fenêtre "Ouvrir une bouteille", qui gère sa propre touche Échap
    if (this.degustationOuverte()) return;
    if (this.ouvert() && this.abandonConfirme()) {
      this.fermerPanneau();
    }
  }

  setNote(valeur: number) {
    this.vinForm.patchValue({ note: valeur });
    this.vinForm.markAsDirty();
  }

  /**
   * Envoie une requête au serveur. En cas d'échec, le message d'erreur est affiché par
   * erreursInterceptor et le panneau reste ouvert avec la saisie, pour pouvoir réessayer.
   */
  private enregistrer<T>(requete: Observable<T>, succes: (reponse: T) => void) {
    if (this.enregistrement()) return;
    this.enregistrement.set(true);
    requete.pipe(finalize(() => this.enregistrement.set(false)))
      .subscribe({next: succes, error: () => {}});
  }

  private remplirApogee(proposee: ApogeeProposee | null) {
    const debut = this.vinForm.value.apogeeDebut || null;
    const fin = this.vinForm.value.apogeeFin || null;
    const precedente = this.apogeeRemplie();
    const champsLibres = (!debut && !fin)
      || (!!precedente && debut === precedente.debut && fin === precedente.fin);

    if (!champsLibres) {
      // L'utilisateur a saisi sa propre apogée : on n'y touche plus
      this.apogeeRemplie.set(null);
      return;
    }
    if (!proposee) {
      // Plus de proposition (autre vin saisi) : on retire celle qu'on avait mise
      if (precedente) this.vinForm.patchValue({apogeeDebut: null, apogeeFin: null});
      this.apogeeRemplie.set(null);
      return;
    }
    if (debut !== proposee.debut || fin !== proposee.fin) {
      this.vinForm.patchValue({apogeeDebut: proposee.debut, apogeeFin: proposee.fin});
    }
    this.apogeeRemplie.set(proposee);
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

  /** Après un ajout : formulaire vidé, mais couleur, région et emplacement gardés pour la bouteille suivante */
  private preparerBouteilleSuivante() {
    const {couleur, appellation, emplacement} = this.vinForm.value;
    this.caveModifiee.emit();
    this.reinitialiser();
    this.vinForm.patchValue({couleur, appellation, emplacement});
    document.getElementById('nom')?.focus();
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
    this.degustationOuverte.set(false);
    this.historique.set([]);
    this.suggestionsVisibles.set(false);
    this.apogeeRemplie.set(null);
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

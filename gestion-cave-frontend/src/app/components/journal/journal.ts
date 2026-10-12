import {Component, computed, OnInit, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {Degustation} from '../../models/degustation.model';
import {DegustationService} from '../../services/degustation.service';
import {ToastService} from '../../services/toast';

export interface MoisDuJournal {
  cle: string; // AAAA-MM
  degustations: Degustation[];
}

/**
 * Journal de dégustation : toutes les bouteilles ouvertes, la plus récente en premier
 */
@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './journal.html',
  styleUrl: './journal.css'
})
export class JournalComponent implements OnInit {
  degustations = signal<Degustation[]>([]);
  chargement = signal(true);
  erreur = signal(false);

  // Regroupées par mois (le serveur les renvoie déjà triées par date décroissante)
  mois = computed<MoisDuJournal[]>(() => {
    const parMois = new Map<string, Degustation[]>();
    for (const d of this.degustations()) {
      const cle = d.date.slice(0, 7);
      if (!parMois.has(cle)) parMois.set(cle, []);
      parMois.get(cle)!.push(d);
    }
    return [...parMois.entries()].map(([cle, degustations]) => ({cle, degustations}));
  });

  ouvertesCetteAnnee = computed(() => {
    const annee = String(new Date().getFullYear());
    return this.degustations().filter(d => d.date.startsWith(annee)).length;
  });

  noteMoyenne = computed(() => {
    const notes = this.degustations().map(d => d.note).filter((n): n is number => !!n);
    return notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
  });

  constructor(private degustationService: DegustationService,
              private toastService: ToastService) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.chargement.set(true);
    this.erreur.set(false);
    this.degustationService.lister().subscribe({
      next: degustations => {
        this.degustations.set(degustations);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      }
    });
  }

  supprimer(d: Degustation) {
    if (!confirm(`Retirer du journal la dégustation de ${d.nom} ${d.millesime} ?\nLa bouteille ne sera pas remise en cave.`)) return;

    this.degustationService.supprimer(d.id).subscribe({
      next: () => {
        this.degustations.update(liste => liste.filter(x => x.id !== d.id));
        this.toastService.show('Dégustation retirée du journal');
      },
      error: () => {}
    });
  }

  classeCouleur(d: Degustation): string {
    return (d.couleur ?? '').toLowerCase().replace('é', 'e');
  }
}

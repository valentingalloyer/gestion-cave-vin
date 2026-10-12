import {Component, computed, effect, EventEmitter, OnInit, Output, signal} from '@angular/core';
import { Vin } from '../../models/vin.model';
import { VinService } from '../../services/vin.service';
import { CaveCacheService } from '../../services/cave-cache';
import { Apogee, apogeeDe, estABoire } from '../../models/apogee';
import { normaliser } from '../../models/texte';
import { caveEnCsv, telecharger } from '../../models/export';
import {CommonModule} from '@angular/common';

export interface RegionDeVins {
  nom: string;
  vins: Vin[];
  bouteilles: number;
}

@Component({
  selector: 'app-vin-list',
  standalone: true,
  templateUrl: './vin-list.html',
  imports: [CommonModule],
  styleUrls: ['./vin-list.css']
})
export class VinListComponent implements OnInit {
  isLoading = signal(true);
  isTakingLonger = signal(false);
  vins = signal<Vin[]>([]);
  // false tant que la liste affichée vient du cache et pas encore du serveur
  synchronise = signal(false);
  dateCache = signal<Date | null>(null);
  // Le serveur n'a pas répondu malgré les nouvelles tentatives
  serveurInjoignable = signal(false);

  @Output() modifierVin = new EventEmitter<Vin>();
  @Output() ajouterBouteille = new EventEmitter<void>();

  searchQuery = signal('');
  // Filtres : couleur ('' = toutes), bouteilles prêtes à boire, bouteilles bues masquées
  filtreCouleur = signal('');
  filtreABoire = signal(false);
  masquerBues = signal(false);
  readonly couleurs = ['Rouge', 'Blanc', 'Rosé'];

  filtresActifs = computed(() =>
    !!this.searchQuery() || !!this.filtreCouleur() || this.filtreABoire() || this.masquerBues());
  collapsedRegions = signal<Set<string>>(new Set());

  filteredAndSortedVins = computed(() => {
    const query = normaliser(this.searchQuery());
    const couleur = this.filtreCouleur();
    let items = this.vins();

    if (couleur) items = items.filter(v => v.couleur === couleur);
    if (this.filtreABoire()) items = items.filter(v => estABoire(v));
    if (this.masquerBues()) items = items.filter(v => v.quantite > 0);

    if (query) {
      items = items.filter(v => {
        // On crée une grande chaîne normalisée avec toutes les infos du vin
        const content = normaliser(`${v.nom} ${v.domaine} ${v.appellation} ${v.millesime} ${v.emplacement}`);
        return content.includes(query);
      });
    }

    // Tri insensible aux accents et à la ponctuation : "Chateau Margaux" se range avec "Château Margaux"
    return [...items].sort((a, b) =>
      normaliser(a.nom).localeCompare(normaliser(b.nom))
      || normaliser(a.domaine).localeCompare(normaliser(b.domaine))
      || a.millesime - b.millesime);
  });

  /**
   * Vins regroupés par région, les régions par ordre alphabétique
   */
  regions = computed<RegionDeVins[]>(() => {
    const parRegion = new Map<string, RegionDeVins>();

    for (const vin of this.filteredAndSortedVins()) {
      // Même région malgré des différences d'accents ou d'espaces : on garde le premier nom rencontré
      const cle = normaliser(vin.appellation || 'Sans région');
      if (!parRegion.has(cle)) {
        parRegion.set(cle, {nom: vin.appellation || 'Sans région', vins: [], bouteilles: 0});
      }
      const region = parRegion.get(cle)!;
      region.vins.push(vin);
      region.bouteilles += vin.quantite;
    }

    return [...parRegion.values()].sort((a, b) => a.nom.localeCompare(b.nom));
  });

  nombreTotalBouteilles = computed(() => {
    return this.filteredAndSortedVins().reduce((total, vin) => total + vin.quantite, 0);
  });

  nombreTotalReferences = computed(() => this.filteredAndSortedVins().length);

  nombreABoire = computed(() => this.compterBouteilles(v => estABoire(v)));
  nombreABoireVite = computed(() => this.compterBouteilles(v => apogeeDe(v)?.statut === 'vite'));

  constructor(private vinService: VinService,
              private caveCache: CaveCacheService) {
    // Chaque changement venant du serveur (chargement, +/-) met le cache à jour
    effect(() => {
      if (this.synchronise()) this.caveCache.ecrire(this.vins());
    });
  }

  ngOnInit(): void {
    // Le serveur peut dormir : on montre tout de suite la dernière cave connue
    const cache = this.caveCache.lire();
    if (cache) {
      this.vins.set(cache.vins);
      this.dateCache.set(cache.date);
      this.isLoading.set(false);
    }

    this.chargerVins();
  }

  chargerVins() {
    // Le loader plein écran n'apparaît qu'au premier chargement :
    // après un enregistrement, la liste se met à jour sans perdre la position dans la page
    if (this.vins().length === 0) this.isLoading.set(true);
    this.serveurInjoignable.set(false);

    // Si au bout de 3 secondes on n'a toujours rien, on active le message spécial
    const timer = setTimeout(() => {
      if (this.isLoading()) this.isTakingLonger.set(true);
    }, 3000);

    this.vinService.getVins().subscribe({
      next: (data) => {
        this.vins.set(data);
        this.synchronise.set(true);
        this.isLoading.set(false);
        this.isTakingLonger.set(false);
        clearTimeout(timer);
      },
      error: () => {
        this.serveurInjoignable.set(true);
        this.isLoading.set(false);
        this.isTakingLonger.set(false);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  changerQuantite(vin: Vin, delta: number) {
    const nouvelleQuantite = vin.quantite + delta;

    // Sécurité : pas de quantité négative
    if (nouvelleQuantite < 0) return;

    const vinModifie = { ...vin, quantite: nouvelleQuantite };

    // En cas d'échec, la quantité affichée ne change pas et erreursInterceptor prévient l'utilisateur
    this.vinService.updateVin(vinModifie).subscribe({
      next: () => this.vins.update(listeActuelle =>
        listeActuelle.map(v => v.id === vin.id ? vinModifie : v)
      ),
      error: () => {}
    });
  }

  toggleRegion(regionName: string) {
    const currentCollapsed = new Set(this.collapsedRegions());

    if (currentCollapsed.has(regionName)) {
      currentCollapsed.delete(regionName);
    } else {
      currentCollapsed.add(regionName);
    }

    this.collapsedRegions.set(currentCollapsed);
  }

  isRegionCollapsed(regionName: string): boolean {
    return this.collapsedRegions().has(regionName);
  }

  apogee(vin: Vin): Apogee | null {
    return apogeeDe(vin);
  }

  basculerCouleur(couleur: string) {
    this.filtreCouleur.update(actuelle => actuelle === couleur ? '' : couleur);
  }

  classeCouleur(vin: Vin): string {
    return (vin.couleur ?? '').toLowerCase().replace('é', 'e');
  }

  /** Toute la cave (sans tenir compte des filtres) dans un fichier pour Excel : sert aussi de sauvegarde */
  exporter() {
    const date = new Date().toISOString().slice(0, 10);
    telecharger(caveEnCsv(this.vins()), `cave-${date}.csv`);
  }

  reinitialiserFiltres() {
    this.searchQuery.set('');
    this.filtreCouleur.set('');
    this.filtreABoire.set(false);
    this.masquerBues.set(false);
  }

  private compterBouteilles(condition: (vin: Vin) => boolean): number {
    return this.filteredAndSortedVins().filter(condition).reduce((total, vin) => total + vin.quantite, 0);
  }
}

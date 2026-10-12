import {Component, computed, EventEmitter, OnInit, Output, signal} from '@angular/core';
import { Vin } from '../../models/vin.model';
import { VinService } from '../../services/vin.service';
import {CommonModule} from '@angular/common';
import { REGIONS_GROUPEES} from '../../models/groupeVin.model';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-vin-list',
  standalone: true,
  templateUrl: './vin-list.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  styleUrls: ['./vin-list.css']
})
export class VinListComponent implements OnInit {
  isLoading = signal(true);
  isTakingLonger = signal(false);
  vins = signal<Vin[]>([]);

  @Output() preparerNouveauMillesime = new EventEmitter<Vin>();
  @Output() modifierVin = new EventEmitter<Vin>();
  @Output() ajouterBouteille = new EventEmitter<void>();

  searchQuery = signal('');
  openedGroups = signal<Set<string>>(new Set());

  /**
   * Grouper les vins par nom + domaine
   */
  groupedVins = computed(() => {
    const vins = this.filteredAndSortedVins();
    const regionsMap = new Map<string, Map<string, Map<string, Vin[]>>>();
    const masterNames = new Map<string, string>();

    vins.forEach(vin => {
      // 1. Création des clés de comparaison (insensibles aux fautes)
      const rKey = this.normaliser(vin.appellation || 'Sans région');
      const nKey = this.normaliser(vin.nom);
      const dKey = this.normaliser(vin.domaine || 'Domaine non précisé');

      // 2. Sauvegarde du "joli nom" (on prend celui du premier vin rencontré)
      if (!masterNames.has(rKey)) masterNames.set(rKey, vin.appellation || 'Sans région');
      if (!masterNames.has(nKey)) masterNames.set(nKey, vin.nom);
      if (!masterNames.has(dKey)) masterNames.set(dKey, vin.domaine || 'Domaine non précisé');

      const pRegion = masterNames.get(rKey)!;
      const pNom = masterNames.get(nKey)!;
      const pDomaine = masterNames.get(dKey)!;

      // 3. Construction de la pyramide
      if (!regionsMap.has(pRegion)) regionsMap.set(pRegion, new Map());
      const namesInRegion = regionsMap.get(pRegion)!;

      if (!namesInRegion.has(pNom)) namesInRegion.set(pNom, new Map());
      const domainsInName = namesInRegion.get(pNom)!;

      if (!domainsInName.has(pDomaine)) domainsInName.set(pDomaine, []);

      domainsInName.get(pDomaine)!.push(vin);
    });

    return regionsMap;
  });

  filteredAndSortedVins = computed(() => {
    const query = this.normaliser(this.searchQuery());
    let items = this.vins();

    if (query) {
      items = items.filter(v => {
        // On crée une grande chaîne normalisée avec toutes les infos du vin
        const content = this.normaliser(`
        ${v.nom}
        ${v.domaine}
        ${v.appellation}
        ${v.millesime}
        ${v.emplacement}
      `);

        return content.includes(query);
      });
    }

    return [...items].sort((a, b) => a.nom.localeCompare(b.nom));
  });

  nombreTotalBouteilles = computed(() => {
    return this.filteredAndSortedVins().reduce((total, vin) => total + vin.quantite, 0);
  });

  nombreTotalReferences = computed(() => this.filteredAndSortedVins().length);

  collapsedRegions = signal<Set<string>>(new Set());

  constructor(private vinService: VinService) {}

  ngOnInit(): void {
    this.chargerVins();
  }

  toggleGroup(cle: string) {
    const current = new Set(this.openedGroups());
    if (current.has(cle)) current.delete(cle);
    else current.add(cle);
    this.openedGroups.set(current);
  }

  chargerVins() {
    // Le loader plein écran n'apparaît qu'au premier chargement :
    // après un enregistrement, la liste se met à jour sans perdre la position dans la page
    if (this.vins().length === 0) this.isLoading.set(true);

    // Si au bout de 3 secondes on n'a toujours rien, on active le message spécial
    const timer = setTimeout(() => {
      if (this.isLoading()) this.isTakingLonger.set(true);
    }, 3000);

    this.vinService.getVins().subscribe({
      next: (data) => {
        this.vins.set(data);
        this.isLoading.set(false);
        this.isTakingLonger.set(false);
        clearTimeout(timer);
      },
      error: () => {
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

    this.vinService.updateVin(vinModifie).subscribe(() => {
      this.vins.update(listeActuelle =>
        listeActuelle.map(v => v.id === vin.id ? vinModifie : v)
      );
    });
  }

  getCountForRegion(nameMap: Map<string, Map<string, Vin[]>>): number {
    let total = 0;

    // Pour chaque nom de vin
    nameMap.forEach(domainMap => {

      // Chaque domaine
      domainMap.forEach(vins => {

        vins.forEach(v => {
          total += v.quantite;
        });
      });
    });

    return total;
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

  private normaliser(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD") // Sépare les accents des lettres
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]/g, "") // Supprime tout ce qui n'est pas lettre ou chiffre (espaces, tirets...)
      .trim();
  }

  getFirstVin(domainMap: Map<string, Vin[]>) {
    const firstArray = domainMap?.values().next().value;
    return firstArray ? firstArray[0] : {} as Vin;
  }

  resetSearch() {
    this.searchQuery.set('');
    const input = document.querySelector('.search-input') as HTMLInputElement;
    if (input) input.value = '';
  }
}

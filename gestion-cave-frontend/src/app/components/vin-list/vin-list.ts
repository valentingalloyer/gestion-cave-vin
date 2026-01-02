import {Component, computed, EventEmitter, OnInit, Output, signal} from '@angular/core';
import { Vin } from '../../models/vin.model';
import { VinService } from '../../services/vin.service';
import {CommonModule} from '@angular/common';
import {GroupeVin, REGIONS_GROUPEES} from '../../models/groupeVin.model';
import {ToastService} from '../../services/toast';
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

  @Output() preparerNouveauMillesime = new EventEmitter<GroupeVin>();

  searchQuery = signal('');
  selectedAppellation = signal('');
  readonly REGIONS_GROUPEES = REGIONS_GROUPEES;
  openedGroups = signal<Set<string>>(new Set());

  /**
   * Grouper les vins par nom + domaine
   */
  groupedVins = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const regionFilter = this.selectedAppellation();
    const map = new Map<string, GroupeVin>();

    let filtered = this.vins().filter(v => {
      // Condition 1 : Recherche textuelle
      const matchesSearch = v.nom.toLowerCase().includes(query) || v.domaine.toLowerCase().includes(query);
      // Condition 2 : Filtre par région
      const matchesRegion = regionFilter === '' || v.appellation === regionFilter;

      return matchesSearch && matchesRegion;
    });

    // 2. Groupement
    filtered.forEach(v => {
      const cle = `${v.nom}-${v.domaine}`.toLowerCase();
      if (!map.has(cle)) {
        map.set(cle, {
          cle, nom: v.nom, domaine: v.domaine, couleur: v.couleur,
          appellation: v.appellation, vintages: [], totalQuantite: 0
        });
      }
      const group = map.get(cle)!;
      group.vintages.push(v);
      group.totalQuantite += v.quantite;
    });

    // 3. TRI FINAL PAR COULEUR PUIS NOM
    const colorOrder: Record<string, number> = { 'Rouge': 1, 'Blanc': 2, 'Rosé': 3 };

    return Array.from(map.values()).sort((a, b) => {
      // D'abord on compare le poids de la couleur
      const weightA = colorOrder[a.couleur] || 99;
      const weightB = colorOrder[b.couleur] || 99;

      if (weightA !== weightB) {
        return weightA - weightB;
      }
      // Si même couleur, on trie par nom alphabétique
      return a.nom.localeCompare(b.nom);
    });
  });

  filteredAndSortedVins = computed(() => {
    // Filtrer les vins
    let result = this.vins().filter(vin =>
      (vin.nom.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
      vin.domaine.toLowerCase().includes(this.searchQuery().toLowerCase())) &&
      (this.selectedAppellation() === '' || vin.appellation === this.selectedAppellation())
    );

    // Trier par nom
    result.sort((a, b) => {
      return a.nom.localeCompare(b.nom);
    });

    return result;
  });

  nombreTotalBouteilles = computed(() => {
    return this.filteredAndSortedVins().reduce((total, vin) => total + vin.quantite, 0);
  });

  nombreTotalReferences = computed(() => this.filteredAndSortedVins().length);

  constructor(private vinService: VinService,
              protected toastService: ToastService) {}

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
    this.isLoading.set(true);

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

  supprimerVin(id: number, nom: string, annee: number) {
    if (confirm(`Voulez-vous vraiment supprimer tous les "${nom}" ${annee} de votre cave ?`)) {
      this.vinService.deleteVin(id).subscribe(() => {
        this.toastService.show(`🗑️ "${nom}" ${annee} a été retiré de la cave.`);

        this.chargerVins();
      });
    }
  }

  onRegionChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedAppellation.set(value);
  }

  onAjouterMillesime(group: GroupeVin) {
    this.preparerNouveauMillesime.emit(group);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}

import {Component, computed, OnInit, signal} from '@angular/core';
import { Vin } from '../../models/vin.model';
import { VinService } from '../../services/vin.service';
import {CommonModule} from '@angular/common';
import {GroupeVin} from '../../models/groupeVin.model';

@Component({
  selector: 'app-vin-list',
  standalone: true,
  templateUrl: './vin-list.html',
  imports: [
    CommonModule
  ],
  styleUrls: ['./vin-list.css']
})
export class VinListComponent implements OnInit {
  vins = signal<Vin[]>([]);

  searchQuery = signal('');
  openedGroups = signal<Set<string>>(new Set());

  /**
   * Grouper les vins par nom + domaine
    */
  groupedVins = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const map = new Map<string, GroupeVin>();

    // 1. Filtrage (nom, domaine ou même couleur !)
    const filtered = this.vins().filter(v =>
      v.nom.toLowerCase().includes(query) ||
      v.domaine.toLowerCase().includes(query) ||
      v.couleur.toLowerCase().includes(query)
    );

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

  sortKey = signal<keyof Vin>('nom'); // Par défaut on trie par nom
  sortDirection = signal<'asc' | 'desc'>('asc');

  filteredAndSortedVins = computed(() => {
    let result = this.vins().filter(vin =>
      vin.nom.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
      vin.domaine.toLowerCase().includes(this.searchQuery().toLowerCase())
    );

    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA! < valB!) return -1 * direction;
      if (valA! > valB!) return 1 * direction;
      return 0;
    });
  });

  constructor(private vinService: VinService) {}

  ngOnInit(): void {
    this.chargerVins();
  }

  setSort(key: keyof Vin) {
    if (this.sortKey() === key) {
      // Si on clique sur la même colonne, on inverse l'ordre
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Sinon on change de colonne et on remet en ascendant
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
  }

  toggleGroup(cle: string) {
    const current = new Set(this.openedGroups());
    if (current.has(cle)) current.delete(cle);
    else current.add(cle);
    this.openedGroups.set(current);
  }

  chargerVins() {
    this.vinService.getVins().subscribe(data => {
      console.log(data);
      this.vins.set(data)
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
}

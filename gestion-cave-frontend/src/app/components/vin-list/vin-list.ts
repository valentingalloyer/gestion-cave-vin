import {Component, computed, OnInit, signal} from '@angular/core';
import { Vin } from '../../models/vin.model';
import { VinService } from '../../services/vin.service';
import {CommonModule, NgClass, NgForOf} from '@angular/common';

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

  filteredVins = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.vins().filter(vin =>
      vin.nom.toLowerCase().includes(query) ||
      vin.domaine.toLowerCase().includes(query)
    );
  });

  constructor(private vinService: VinService) {}

  ngOnInit(): void {
    this.chargerVins();
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

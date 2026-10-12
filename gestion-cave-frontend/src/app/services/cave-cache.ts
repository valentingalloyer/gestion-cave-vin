import { Injectable } from '@angular/core';
import { Vin } from '../models/vin.model';

export interface CaveEnCache {
  vins: Vin[];
  date: Date;
}

/**
 * Dernière cave chargée, gardée dans le navigateur.
 * Elle s'affiche immédiatement pendant que le serveur Render se réveille.
 */
@Injectable({ providedIn: 'root' })
export class CaveCacheService {
  private readonly cle = 'cave';

  lire(): CaveEnCache | null {
    try {
      const brut = localStorage.getItem(this.cle);
      if (!brut) return null;
      const {vins, date} = JSON.parse(brut);
      return Array.isArray(vins) ? {vins, date: new Date(date)} : null;
    } catch {
      return null;
    }
  }

  ecrire(vins: Vin[]) {
    try {
      localStorage.setItem(this.cle, JSON.stringify({vins, date: new Date().toISOString()}));
    } catch {
      // Stockage plein ou indisponible : le cache est un confort, pas une obligation
    }
  }

  vider() {
    localStorage.removeItem(this.cle);
  }
}

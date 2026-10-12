import { Injectable, signal } from '@angular/core';

export type Theme = 'clair' | 'auto' | 'sombre';

/**
 * Thème choisi par l'utilisateur, mémorisé dans le navigateur.
 * "auto" suit le réglage clair/sombre de l'appareil.
 * Le même attribut est déjà posé dans index.html avant le démarrage d'Angular,
 * pour éviter un flash de thème clair au chargement.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly cle = 'theme';
  theme = signal<Theme>(this.lire());

  constructor() {
    this.appliquer(this.theme());
  }

  choisir(theme: Theme) {
    this.theme.set(theme);
    this.appliquer(theme);
    try {
      localStorage.setItem(this.cle, theme);
    } catch {
      // Stockage indisponible : le thème vaut pour la session en cours seulement
    }
  }

  private lire(): Theme {
    try {
      const theme = localStorage.getItem(this.cle);
      return theme === 'clair' || theme === 'sombre' ? theme : 'auto';
    } catch {
      return 'auto';
    }
  }

  private appliquer(theme: Theme) {
    document.documentElement.dataset['theme'] = theme;
  }
}

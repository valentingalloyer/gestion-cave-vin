import { Injectable, signal } from '@angular/core';

export type Theme = 'clair' | 'sombre';

/**
 * Thème clair ou sombre, mémorisé dans le navigateur.
 * Sans choix enregistré, on suit le réglage de l'appareil.
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

  basculer() {
    const theme: Theme = this.theme() === 'sombre' ? 'clair' : 'sombre';
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
      if (theme === 'clair' || theme === 'sombre') return theme;
    } catch {
      // Stockage indisponible : on suit l'appareil
    }
    const appareilSombre = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return appareilSombre ? 'sombre' : 'clair';
  }

  private appliquer(theme: Theme) {
    document.documentElement.dataset['theme'] = theme;
  }
}

import {Vin} from './vin.model';

export type StatutApogee = 'jeune' | 'pret' | 'vite' | 'passe';

export interface Apogee {
  statut: StatutApogee;
  libelle: string;
  // Phrase complète pour l'infobulle, avec les années
  detail: string;
}

/**
 * Où en est la bouteille par rapport à sa période idéale de dégustation.
 * Renvoie null si l'apogée n'est pas renseignée (l'API renvoie 0 dans ce cas).
 * "À boire vite" = dernière année de la période, ou l'année d'avant.
 */
export function apogeeDe(vin: Vin, annee = new Date().getFullYear()): Apogee | null {
  const debut = vin.apogeeDebut || null;
  const fin = vin.apogeeFin || null;
  if (!debut && !fin) return null;

  const periode = debut && fin ? `À boire entre ${debut} et ${fin}`
    : debut ? `À boire à partir de ${debut}`
    : `À boire jusqu'en ${fin}`;

  if (debut && annee < debut) {
    return {statut: 'jeune', libelle: 'Trop jeune', detail: `${periode} : encore ${debut - annee} an${debut - annee > 1 ? 's' : ''} à attendre`};
  }
  if (fin && annee > fin) {
    return {statut: 'passe', libelle: 'Passé', detail: `${periode} : apogée dépassée`};
  }
  if (fin && fin - annee <= 1) {
    const reste = fin - annee + 1;
    return {statut: 'vite', libelle: 'À boire vite', detail: `${periode} : ${reste > 1 ? `plus que ${reste} ans` : 'dernière année'} pour la boire`};
  }
  return {statut: 'pret', libelle: 'À boire', detail: periode};
}

/** Prêt à boire : dans sa période, y compris la fin de période */
export function estABoire(vin: Vin): boolean {
  const statut = apogeeDe(vin)?.statut;
  return statut === 'pret' || statut === 'vite';
}

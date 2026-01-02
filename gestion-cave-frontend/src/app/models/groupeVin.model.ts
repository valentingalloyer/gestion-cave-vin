import {Vin} from './vin.model';

export interface GroupeVin {
  cle: string;
  nom: string;
  domaine: string;
  couleur: string;
  appellation: string;
  vintages: Vin[];
  totalQuantite: number;
}

export const REGIONS_GROUPEES = [
  { label: 'Plutôt Rouges', regions: ['Bordeaux', 'Bourgogne', 'Vallée du Rhône', 'Sud-Ouest', 'Beaujolais', 'Auvergne'] },
  { label: 'Plutôt Blancs / Effervescents', regions: ['Alsace', 'Champagne', 'Loire', 'Jura', 'Savoie', 'Lorraine', 'Bugey'] },
  { label: 'Plutôt Rosés / Sud', regions: ['Provence', 'Corse', 'Languedoc-Roussillon'] }
];

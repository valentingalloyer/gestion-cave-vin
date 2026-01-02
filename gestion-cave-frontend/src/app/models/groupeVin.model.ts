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

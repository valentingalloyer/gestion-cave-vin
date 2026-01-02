export interface Vin {
  id?: number;
  nom: string;
  domaine: string;
  millesime: number;
  couleur: string;
  appellation: string;
  quantite: number;
  emplacement: string;
  apogeeDebut: number;
  apogeeFin: number;
  notePersonnelle?: string;
}

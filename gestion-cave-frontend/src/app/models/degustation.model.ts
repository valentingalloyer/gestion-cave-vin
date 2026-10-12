/** Une bouteille ouverte, avec une copie du vin au moment de la dégustation */
export interface Degustation {
  id: number;
  vinId: number | null;
  nom: string;
  domaine: string;
  millesime: number;
  couleur: string;
  appellation: string;
  date: string; // AAAA-MM-JJ
  occasion: string | null;
  note: number | null;
  commentaire: string | null;
}

export interface NouvelleDegustation {
  vinId: number;
  date: string;
  occasion: string;
  note: number;
  commentaire: string;
}

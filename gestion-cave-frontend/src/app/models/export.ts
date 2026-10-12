import {Vin} from './vin.model';
import {apogeeDe} from './apogee';
import {normaliser} from './texte';

const COLONNES = ['Région', 'Nom', 'Domaine', 'Couleur', 'Millésime', 'Quantité', 'Emplacement',
  'Note (/5)', 'À boire dès', "Jusqu'à", 'Apogée', 'Commentaire'];

/**
 * Toute la cave au format CSV, prêt à ouvrir dans Excel :
 * séparateur ";" (Excel en français), BOM UTF-8 pour les accents, une ligne par référence.
 */
export function caveEnCsv(vins: Vin[]): string {
  const tries = [...vins].sort((a, b) =>
    (a.appellation ?? '').localeCompare(b.appellation ?? '')
    || normaliser(a.nom).localeCompare(normaliser(b.nom))
    || a.millesime - b.millesime);

  const lignes = tries.map(v => [
    v.appellation,
    v.nom,
    v.domaine,
    v.couleur,
    v.millesime,
    v.quantite,
    v.emplacement,
    v.note || '',
    v.apogeeDebut || '',
    v.apogeeFin || '',
    apogeeDe(v)?.libelle ?? '',
    v.notePersonnelle
  ]);

  return '﻿' + [COLONNES, ...lignes]
    .map(ligne => ligne.map(cellule).join(';'))
    .join('\r\n');
}

/** Cellule entre guillemets, guillemets internes doublés */
function cellule(valeur: unknown): string {
  const texte = valeur === null || valeur === undefined ? '' : String(valeur);
  return '"' + texte.replace(/"/g, '""') + '"';
}

/** Déclenche le téléchargement d'un fichier texte dans le navigateur */
export function telecharger(contenu: string, nomFichier: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenu], {type}));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}

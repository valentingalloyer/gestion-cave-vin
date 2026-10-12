/**
 * Version comparable d'un texte : minuscules, sans accents, sans espaces ni ponctuation.
 * "Château-Margaux" et "chateau margaux" donnent tous les deux "chateaumargaux".
 */
export function normaliser(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Sépare les accents des lettres
    .replace(/[̀-ͯ]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, ''); // Supprime tout ce qui n'est pas lettre ou chiffre (espaces, tirets...)
}

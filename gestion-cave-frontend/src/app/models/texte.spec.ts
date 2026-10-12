import {normaliser} from './texte';

describe('normaliser', () => {
  it('ignore accents, majuscules, espaces et ponctuation', () => {
    expect(normaliser('Château-Margaux')).toBe('chateaumargaux');
    expect(normaliser('chateau margaux')).toBe('chateaumargaux');
    expect(normaliser("Château d'Esclans")).toBe('chateaudesclans');
  });

  it('garde les chiffres', () => {
    expect(normaliser('Casier A1')).toBe('casiera1');
  });

  it('accepte une valeur vide', () => {
    expect(normaliser('')).toBe('');
    expect(normaliser(null)).toBe('');
    expect(normaliser(undefined)).toBe('');
  });
});

import {apogeeDe, estABoire} from './apogee';
import {Vin} from './vin.model';

function vin(apogeeDebut: number, apogeeFin: number): Vin {
  return {
    nom: 'Test', domaine: 'Domaine', millesime: 2015, couleur: 'Rouge', appellation: 'Bordeaux',
    quantite: 1, emplacement: '', apogeeDebut, apogeeFin
  };
}

// Toutes les dates sont calculées pour l'année 2026
const ANNEE = 2026;

describe('apogeeDe', () => {
  it("renvoie null quand l'apogée n'est pas renseignée (0 côté API)", () => {
    expect(apogeeDe(vin(0, 0), ANNEE)).toBeNull();
  });

  it('dit "Trop jeune" avant le début de la période', () => {
    const a = apogeeDe(vin(2028, 2050), ANNEE)!;
    expect(a.statut).toBe('jeune');
    expect(a.detail).toContain('encore 2 ans');
  });

  it('dit "À boire" dès la première année de la période', () => {
    expect(apogeeDe(vin(2026, 2040), ANNEE)!.statut).toBe('pret');
  });

  it('dit "À boire vite" la dernière année et l\'année d\'avant', () => {
    expect(apogeeDe(vin(2020, 2027), ANNEE)!.statut).toBe('vite');
    expect(apogeeDe(vin(2020, 2026), ANNEE)!.statut).toBe('vite');
    expect(apogeeDe(vin(2020, 2026), ANNEE)!.detail).toContain('dernière année');
  });

  it('dit "Passé" après la fin de la période', () => {
    expect(apogeeDe(vin(2015, 2025), ANNEE)!.statut).toBe('passe');
  });

  it('gère une apogée avec seulement un début ou seulement une fin', () => {
    expect(apogeeDe(vin(2030, 0), ANNEE)!.statut).toBe('jeune');
    expect(apogeeDe(vin(2020, 0), ANNEE)!.statut).toBe('pret');
    expect(apogeeDe(vin(0, 2026), ANNEE)!.statut).toBe('vite');
    expect(apogeeDe(vin(0, 2020), ANNEE)!.statut).toBe('passe');
  });
});

describe('estABoire', () => {
  it('inclut "À boire" et "À boire vite", pas les autres', () => {
    const annee = new Date().getFullYear();
    expect(estABoire(vin(annee - 5, annee + 10))).toBe(true);
    expect(estABoire(vin(annee - 5, annee))).toBe(true);
    expect(estABoire(vin(annee + 2, annee + 10))).toBe(false);
    expect(estABoire(vin(annee - 10, annee - 1))).toBe(false);
    expect(estABoire(vin(0, 0))).toBe(false);
  });
});

import {caveEnCsv} from './export';
import {Vin} from './vin.model';

function vin(champs: Partial<Vin>): Vin {
  return {
    nom: 'Vin', domaine: 'Domaine', millesime: 2015, couleur: 'Rouge', appellation: 'Bordeaux',
    quantite: 1, emplacement: '', apogeeDebut: 0, apogeeFin: 0, ...champs
  };
}

describe('caveEnCsv', () => {
  it('commence par le BOM UTF-8 et une ligne d\'en-tête séparée par des ;', () => {
    const csv = caveEnCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv.slice(1).split('\r\n')[0]).toBe(
      '"Région";"Nom";"Domaine";"Couleur";"Millésime";"Quantité";"Emplacement";"Note (/5)";"À boire dès";"Jusqu\'à";"Apogée";"Commentaire"');
  });

  it('écrit une ligne par bouteille, champs vides pour une apogée ou une note absentes', () => {
    const lignes = caveEnCsv([vin({nom: 'Margaux', quantite: 6})]).split('\r\n');
    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toBe('"Bordeaux";"Margaux";"Domaine";"Rouge";"2015";"6";"";"";"";"";"";""');
  });

  it('protège les guillemets, points-virgules et retours à la ligne des commentaires', () => {
    const ligne = caveEnCsv([vin({notePersonnelle: 'Dit "superbe"; à revoir\nplus tard'})]).split('\r\n')[1];
    expect(ligne.endsWith('"Dit ""superbe""; à revoir\nplus tard"')).toBe(true);
  });

  it('trie par région, puis par nom sans tenir compte des accents, puis par millésime', () => {
    const csv = caveEnCsv([
      vin({appellation: 'Provence', nom: 'Bandol'}),
      vin({appellation: 'Bordeaux', nom: 'Château Margaux', millesime: 2018}),
      vin({appellation: 'Bordeaux', nom: 'Chateau Margaux', millesime: 2010}),
      vin({appellation: 'Alsace', nom: 'Riesling'})
    ]);
    const noms = csv.split('\r\n').slice(1).map(l => l.split(';')[1] + ' ' + l.split(';')[4]);
    expect(noms).toEqual(['"Riesling" "2015"', '"Chateau Margaux" "2010"', '"Château Margaux" "2018"', '"Bandol" "2015"']);
  });
});

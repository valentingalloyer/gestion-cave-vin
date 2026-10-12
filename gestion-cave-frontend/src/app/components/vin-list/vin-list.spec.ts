import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {VinListComponent} from './vin-list';
import {Vin} from '../../models/vin.model';

const ANNEE = new Date().getFullYear();

const CAVE: Vin[] = [
  // À boire
  {id: 1, nom: 'Château Margaux', domaine: 'Château Margaux', appellation: 'Bordeaux', couleur: 'Rouge',
    millesime: 2015, quantite: 6, emplacement: 'Casier A1', apogeeDebut: ANNEE - 1, apogeeFin: ANNEE + 20},
  // À boire vite
  {id: 2, nom: 'Bandol Rosé', domaine: 'Domaine Tempier', appellation: 'Provence', couleur: 'Rosé',
    millesime: 2022, quantite: 2, emplacement: 'Frigo', apogeeDebut: ANNEE - 3, apogeeFin: ANNEE},
  // Trop jeune
  {id: 3, nom: 'Riesling', domaine: 'Zind-Humbrecht', appellation: 'Alsace', couleur: 'Blanc',
    millesime: 2023, quantite: 3, emplacement: '', apogeeDebut: ANNEE + 2, apogeeFin: ANNEE + 15},
  // Bue, sans apogée
  {id: 4, nom: 'Châteauneuf-du-Pape', domaine: 'Beaucastel', appellation: 'Vallée du Rhône', couleur: 'Rouge',
    millesime: 2016, quantite: 0, emplacement: '', apogeeDebut: 0, apogeeFin: 0}
];

describe('VinListComponent (liste de la cave)', () => {
  let fixture: ComponentFixture<VinListComponent>;
  let liste: VinListComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [VinListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(VinListComponent);
    liste = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);

    fixture.detectChanges(); // ngOnInit : chargement de la cave
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/vins')).flush(CAVE);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('compte bouteilles, références et bouteilles à boire', () => {
    expect(liste.nombreTotalBouteilles()).toBe(11);
    expect(liste.nombreTotalReferences()).toBe(4);
    expect(liste.nombreABoire()).toBe(8);
    expect(liste.nombreABoireVite()).toBe(2);
  });

  it('regroupe par région, dans l\'ordre alphabétique', () => {
    expect(liste.regions().map(r => r.nom)).toEqual(['Alsace', 'Bordeaux', 'Provence', 'Vallée du Rhône']);
  });

  it('filtre par couleur', () => {
    liste.basculerCouleur('Rosé');
    expect(liste.filteredAndSortedVins().map(v => v.id)).toEqual([2]);
    // Un second clic retire le filtre
    liste.basculerCouleur('Rosé');
    expect(liste.filteredAndSortedVins()).toHaveLength(4);
  });

  it('filtre les bouteilles à boire maintenant', () => {
    liste.filtreABoire.set(true);
    expect(liste.filteredAndSortedVins().map(v => v.id).sort()).toEqual([1, 2]);
  });

  it('masque les bouteilles bues sur demande', () => {
    liste.masquerBues.set(true);
    expect(liste.filteredAndSortedVins().map(v => v.id)).not.toContain(4);
  });

  it('cherche sans tenir compte des accents', () => {
    liste.searchQuery.set('chateauneuf');
    expect(liste.filteredAndSortedVins().map(v => v.id)).toEqual([4]);
    liste.reinitialiserFiltres();
    expect(liste.filtresActifs()).toBe(false);
  });

  it('ne descend jamais sous 0 bouteille', () => {
    liste.changerQuantite(CAVE[3], -1);
    http.expectNone(r => r.method === 'PUT');
  });

  it('met à jour la quantité une fois le serveur d\'accord', () => {
    liste.changerQuantite(CAVE[0], 1);
    const requete = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/vins/1'));
    expect(requete.request.body.quantite).toBe(7);
    requete.flush({...CAVE[0], quantite: 7});
    expect(liste.vins().find(v => v.id === 1)?.quantite).toBe(7);
  });

  it('garde la quantité affichée si le serveur échoue', () => {
    liste.changerQuantite(CAVE[0], 1);
    http.expectOne(r => r.method === 'PUT').flush(null, {status: 503, statusText: 'Indisponible'});
    expect(liste.vins().find(v => v.id === 1)?.quantite).toBe(6);
  });

  it('garde la cave en cache pour le prochain démarrage', () => {
    const cache = JSON.parse(localStorage.getItem('cave')!);
    expect(cache.vins).toHaveLength(4);
  });
});

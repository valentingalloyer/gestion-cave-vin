import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {VinFormComponent} from './form-creation-vin';
import {Vin} from '../../models/vin.model';

const CAVE: Vin[] = [
  {id: 1, nom: 'Château Margaux', domaine: 'Château Margaux', appellation: 'Bordeaux', couleur: 'Rouge',
    millesime: 2015, quantite: 6, emplacement: 'Casier A1', apogeeDebut: 2025, apogeeFin: 2045},
  {id: 2, nom: 'Chateau Margaux', domaine: 'Chateau Margaux', appellation: 'Bordeaux', couleur: 'Rouge',
    millesime: 2010, quantite: 1, emplacement: 'Casier A2', apogeeDebut: 2020, apogeeFin: 2040},
  {id: 3, nom: 'Pavillon Blanc', domaine: 'Château Margaux', appellation: 'Bordeaux', couleur: 'Blanc',
    millesime: 2020, quantite: 2, emplacement: '', apogeeDebut: 0, apogeeFin: 0},
  {id: 4, nom: 'Gevrey-Chambertin', domaine: 'Domaine Trapet', appellation: 'Bourgogne', couleur: 'Rouge',
    millesime: 2020, quantite: 2, emplacement: '', apogeeDebut: 2026, apogeeFin: 2038},
  {id: 5, nom: 'Gevrey-Chambertin', domaine: 'Domaine Rousseau', appellation: 'Bourgogne', couleur: 'Rouge',
    millesime: 2019, quantite: 4, emplacement: '', apogeeDebut: 2027, apogeeFin: 2040}
];

describe('VinFormComponent (panneau)', () => {
  let fixture: ComponentFixture<VinFormComponent>;
  let panneau: VinFormComponent;
  let http: HttpTestingController;

  // Saisie dans le formulaire, puis mise à jour des calculs (suggestions, apogée proposée...)
  function saisir(valeurs: Record<string, unknown>) {
    panneau.vinForm.patchValue(valeurs);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VinFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(VinFormComponent);
    panneau = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('vins', CAVE);
    panneau.ouvrirAjout();
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    document.body.style.overflow = '';
  });

  describe('suggestions', () => {
    it("n'apparaissent qu'à partir de 2 lettres", () => {
      saisir({nom: 'm'});
      expect(panneau.suggestions()).toEqual([]);
    });

    it('regroupent les orthographes d\'un même vin et cherchent aussi dans le domaine', () => {
      saisir({nom: 'marg'});
      const noms = panneau.suggestions().map(s => `${s.vin.nom} (${s.millesimes})`);
      // Les deux Margaux ont des domaines écrits différemment mais identiques une fois normalisés
      expect(noms).toEqual(['Château Margaux (2)', 'Pavillon Blanc (1)']);
    });

    it('distinguent un même nom chez deux domaines', () => {
      saisir({nom: 'gevrey'});
      expect(panneau.suggestions().map(s => s.vin.domaine)).toEqual(['Domaine Trapet', 'Domaine Rousseau']);
    });

    it('remplissent nom, domaine, région et couleur quand on en choisit une', () => {
      saisir({nom: 'pavil'});
      panneau.choisirSuggestion(panneau.suggestions()[0]);
      expect(panneau.vinForm.value).toMatchObject({
        nom: 'Pavillon Blanc', domaine: 'Château Margaux', appellation: 'Bordeaux', couleur: 'Blanc'
      });
    });

    it("n'apparaissent pas en mode modification", () => {
      panneau.modifier(CAVE[0]);
      http.expectOne(r => r.url.endsWith('/degustations')).flush([]);
      saisir({nom: 'marg'});
      expect(panneau.suggestions()).toEqual([]);
    });
  });

  describe('doublons', () => {
    it('détecte le même vin, même domaine et même millésime, malgré les accents', () => {
      saisir({nom: 'chateau margaux', domaine: 'CHÂTEAU MARGAUX', millesime: 2015});
      expect(panneau.doublon()?.id).toBe(1);
    });

    it("ne signale rien pour un autre millésime ou un autre domaine", () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2016});
      expect(panneau.doublon()).toBeNull();
      saisir({nom: 'Gevrey-Chambertin', domaine: 'Domaine Inconnu', millesime: 2020});
      expect(panneau.doublon()).toBeNull();
    });

    it('ajoute les bouteilles saisies à la référence existante', () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2015, quantite: 6});
      panneau.ajouterAuDoublon();

      const requete = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/vins/1'));
      expect(requete.request.body.quantite).toBe(12);
      requete.flush({...CAVE[0], quantite: 12});
      expect(panneau.ouvert()).toBe(false);
    });
  });

  describe('apogée proposée', () => {
    it('décale l\'apogée du millésime le plus proche du même vin', () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2016});
      expect(panneau.vinForm.value).toMatchObject({apogeeDebut: 2026, apogeeFin: 2046});
      expect(panneau.mentionApogee()).toContain("d'après le 2015");
    });

    it('suit le millésime tant que l\'utilisateur n\'a pas saisi sa propre apogée', () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2016});
      saisir({millesime: 2011});
      // Le 2010 est maintenant le plus proche
      expect(panneau.vinForm.value).toMatchObject({apogeeDebut: 2021, apogeeFin: 2041});
    });

    it("n'écrase jamais une apogée saisie par l'utilisateur", () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2016});
      saisir({apogeeDebut: 2030});
      saisir({millesime: 2018});
      expect(panneau.vinForm.value.apogeeDebut).toBe(2030);
      expect(panneau.mentionApogee()).toBeNull();
    });

    it('reste propre à chaque domaine pour un même nom de vin', () => {
      saisir({nom: 'Gevrey-Chambertin', domaine: 'Domaine Trapet', millesime: 2022});
      expect(panneau.vinForm.value).toMatchObject({apogeeDebut: 2028, apogeeFin: 2040});
    });

    it('retire la proposition quand le vin saisi devient inconnu', () => {
      saisir({nom: 'Château Margaux', domaine: 'Château Margaux', millesime: 2016});
      saisir({domaine: 'Domaine Inconnu'});
      expect(panneau.vinForm.value).toMatchObject({apogeeDebut: null, apogeeFin: null});
    });
  });

  it('"Ajouter et continuer" garde le panneau ouvert avec couleur, région et emplacement', () => {
    saisir({nom: 'Saint-Joseph', domaine: 'Domaine Gonon', appellation: 'Vallée du Rhône',
      millesime: 2021, emplacement: 'Casier F1', couleur: 'Rouge'});
    panneau.onSubmit(true);
    http.expectOne(r => r.method === 'POST' && r.url.endsWith('/vins'))
      .flush({id: 99, nom: 'Saint-Joseph', millesime: 2021});

    expect(panneau.ouvert()).toBe(true);
    expect(panneau.vinForm.value).toMatchObject({
      nom: '', domaine: '', appellation: 'Vallée du Rhône', emplacement: 'Casier F1', couleur: 'Rouge'
    });
  });

  it('reste ouvert avec la saisie quand le serveur échoue', () => {
    saisir({nom: 'Saint-Joseph', domaine: 'Domaine Gonon', appellation: 'Vallée du Rhône', millesime: 2021});
    panneau.onSubmit();
    http.expectOne(r => r.method === 'POST').flush(null, {status: 503, statusText: 'Indisponible'});

    expect(panneau.ouvert()).toBe(true);
    expect(panneau.vinForm.value.nom).toBe('Saint-Joseph');
    expect(panneau.enregistrement()).toBe(false);
  });
});

-- Bouteilles de test pour le compte de test (users.id = 2)
-- À lancer dans le SQL Editor de Neon.
--
-- 1. Vérifier d'abord que l'id 2 est bien le compte de test, et pas celui de Jack :
--      select id, username from users;
--
-- 2. Lancer l'insert ci-dessous. Il n'insère rien si l'utilisateur 2 n'existe pas.
--
-- Les données couvrent les cas à tester :
--   - les trois couleurs (liserés rouge / blanc / rosé)
--   - plusieurs régions des trois groupes du formulaire
--   - plusieurs millésimes d'un même vin (regroupement nom > domaine > année)
--   - deux orthographes d'un même vin ("Chateau" / "Château") : la liste doit les regrouper
--   - un même nom chez deux domaines différents
--   - une quantité à 0, des bouteilles sans note, sans apogée, sans emplacement
--   - un long commentaire (tronqué avec "…" dans la liste)

insert into vins (nom, domaine, appellation, couleur, millesime, quantite, emplacement, note, apogee_debut, apogee_fin, note_personnelle, user_id)
select v.nom, v.domaine, v.appellation, v.couleur, v.millesime, v.quantite, v.emplacement, v.note, v.apogee_debut, v.apogee_fin, v.note_personnelle, u.id
from (values
    -- Bordeaux : trois millésimes du même vin, dont une orthographe sans accent
    ('Château Margaux',   'Château Margaux',          'Bordeaux',             'Rouge', 2015, 6,  'Casier A1', 5,    2025, 2045, 'Grand millésime, à oublier en cave.'),
    ('Château Margaux',   'Château Margaux',          'Bordeaux',             'Rouge', 2018, 3,  'Casier A1', 4,    2028, 2050, null),
    ('Chateau Margaux',   'Chateau Margaux',          'Bordeaux',             'Rouge', 2010, 1,  'Casier A2', null, 2020, 2040, null),
    ('Pavillon Blanc',    'Château Margaux',          'Bordeaux',             'Blanc', 2020, 2,  'Casier A3', 4,    2024, 2035, null),

    -- Bourgogne : même nom chez deux domaines différents
    ('Gevrey-Chambertin', 'Domaine Armand Rousseau',  'Bourgogne',            'Rouge', 2019, 4,  'Casier B1', 5,    2027, 2040, 'Superbe sur un gibier.'),
    ('Gevrey-Chambertin', 'Domaine Trapet',           'Bourgogne',            'Rouge', 2020, 2,  'Casier B1', null, 2026, 2038, null),
    ('Chablis Premier Cru','Domaine William Fèvre',   'Bourgogne',            'Blanc', 2021, 6,  'Frigo',     3,    2023, 2030, 'Huîtres, poisson grillé.'),

    -- Vallée du Rhône : une bouteille déjà bue (quantité 0)
    ('Châteauneuf-du-Pape','Château de Beaucastel',   'Vallée du Rhône',      'Rouge', 2016, 0,  'Casier C1', 4,    2022, 2035, 'Dernière bouteille ouverte pour Noël.'),
    ('Crozes-Hermitage',  'Domaine Alain Graillot',   'Vallée du Rhône',      'Rouge', 2022, 12, 'Casier C2', 3,    0,    0,    null),

    -- Blancs / effervescents
    ('Riesling Grand Cru','Domaine Zind-Humbrecht',   'Alsace',               'Blanc', 2017, 3,  'Casier D1', 4,    2022, 2035, null),
    ('Brut Réserve',      'Billecart-Salmon',         'Champagne',            'Blanc', 2018, 6,  'Frigo',     5,    0,    0,    'Pour les grandes occasions, et aussi pour les petites. Parfait à l''apéritif avec des gougères, ou tout au long d''un repas de fête.'),
    ('Sancerre',          'Domaine Vacheron',         'Loire',                'Blanc', 2023, 4,  '',          null, 0,    0,    null),
    ('Vin Jaune',         'Domaine Berthet-Bondet',   'Jura',                 'Blanc', 2014, 1,  'Casier D2', 5,    2024, 2070, null),

    -- Rosés / Sud
    ('Whispering Angel',  'Château d''Esclans',       'Provence',             'Rosé',  2023, 6,  'Frigo',     3,    2024, 2025, null),
    ('Bandol Rosé',       'Domaine Tempier',          'Provence',             'Rosé',  2022, 2,  'Frigo',     4,    2023, 2027, null),
    ('Patrimonio',        'Domaine Antoine Arena',    'Corse',                'Rosé',  2023, 3,  null,        null, 0,    0,    null),
    ('Mas de Daumas Gassac','Mas de Daumas Gassac',   'Languedoc-Roussillon', 'Rouge', 2019, 5,  'Casier E1', 4,    2025, 2040, null)
) as v (nom, domaine, appellation, couleur, millesime, quantite, emplacement, note, apogee_debut, apogee_fin, note_personnelle)
join users u on u.id = 2;

-- Pour tout supprimer et repartir de zéro (uniquement les vins du compte de test) :
--   delete from vins where user_id = 2;

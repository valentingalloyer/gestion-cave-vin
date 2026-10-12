# 🍷 Gestion de Cave à Vin

Application Fullstack pour gérer une cave personnelle. Développée pour mon beau-père !
https://gestion-cave-vin.vercel.app/
Le serveur peut mettre jusqu'à 90 secondes à se réveiller

## 🚀 Technologies
- **Backend :** Java 21, Spring Boot 3.5.9, Spring Data JPA
- **Frontend :** Angular 18+, Signals, Reactive Forms
- **Base de données :** PostgreSQL (Hébergée sur Neon.tech)

## 🛠️ Installation

### Backend
1. Aller dans `gestion-cave`
2. Définir les variables d'environnement :
   - `DB_URL`, `DB_USER`, `DB_PASSWORD` : accès PostgreSQL
   - `JWT_SECRET` : clé de signature des tokens (32 caractères minimum)
   - `PROPRIETAIRE_USERNAME`, `PROPRIETAIRE_PASSWORD` : compte créé au démarrage s'il n'existe pas (pas d'inscription publique). Il récupère les vins sans propriétaire.
   - `REINITIALISER_UTILISATEUR`, `REINITIALISER_MOT_DE_PASSE` (facultatives) : mot de passe oublié. Impose ce mot de passe à ce compte au démarrage, une seule fois par valeur ; les variables peuvent ensuite être retirées.
3. Lancer avec `./mvnw spring-boot:run`

### Frontend
1. Aller dans `gestion-cave-frontend`
2. Installer les dépendances : `npm install`
3. Lancer avec `ng serve`
4. Ouvrir `http://localhost:4200`

## ✅ Tests

À lancer avant chaque mise en ligne.

### Backend
Dans `gestion-cave` : `mvn test` (base H2 en mémoire, aucune variable d'environnement nécessaire).

Sans Java installé, via Docker (depuis la racine du projet) :
```
docker run --rm -v "$PWD/gestion-cave:/app" -w /app maven:3.9.6-eclipse-temurin-21 mvn -q test
```

Couvre l'authentification, l'isolation entre comptes, les bouteilles, le journal de dégustation, le changement de mot de passe et la création du compte propriétaire.

### Frontend
Dans `gestion-cave-frontend` : `npm test -- --watch=false`

Couvre les règles d'apogée, l'export CSV, la recherche, les filtres et les quantités de la liste, et le panneau d'ajout (suggestions, doublons, apogée proposée).

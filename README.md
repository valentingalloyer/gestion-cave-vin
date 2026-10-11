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
3. Lancer avec `./mvnw spring-boot:run`

### Frontend
1. Aller dans `gestion-cave-frontend`
2. Installer les dépendances : `npm install`
3. Lancer avec `ng serve`
4. Ouvrir `http://localhost:4200`

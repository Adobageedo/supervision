# Guide de Configuration - Application Supervision

## Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+
- Angular CLI 17+ (`npm install -g @angular/cli`)
- Docker et Docker Compose (optionnel mais recommandé)

## Installation Rapide avec Docker

```bash
# Cloner ou se placer dans le projet
cd Supervision

# Démarrer tous les services
docker-compose up -d

# L'application sera accessible sur:
# - Frontend: http://localhost:4200
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

## Installation Manuelle

### 1. Base de Données PostgreSQL

```bash
# Créer la base de données
createdb supervision_maintenance

# Ou avec psql
psql -U postgres
CREATE DATABASE supervision_maintenance;
\q
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=supervision_maintenance
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password
# JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
# JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters

# Peupler la base de données avec des données initiales
npm run seed

# Démarrer le serveur de développement
npm run dev
```

Le backend sera accessible sur `http://localhost:3000`

### 3. Frontend

```bash
# Si Angular CLI n'est pas installé
npm install -g @angular/cli

# Créer l'application Angular
cd ..
ng new frontend --routing --style=scss --strict

cd frontend

# Installer Angular Material et les dépendances
ng add @angular/material
npm install @angular/material-moment-adapter moment
npm install chart.js ng2-charts

# Copier les fichiers du frontend (voir structure ci-dessous)
# Les fichiers de configuration et les composants sont à créer

# Démarrer le serveur de développement
npm start
# ou
ng serve
```

Le frontend sera accessible sur `http://localhost:4200`

## Compte Admin par Défaut

Après avoir exécuté `npm run seed` dans le backend:

- **Email**: `admin@supervision.com`
- **Password**: `Admin123!`

## Structure du Projet

```
Supervision/
├── backend/                 # API Node.js + Express + TypeORM
│   ├── src/
│   │   ├── config/         # Configuration DB
│   │   ├── controllers/    # Controllers API
│   │   ├── entities/       # Entités TypeORM
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Logique métier
│   │   ├── utils/          # Utilitaires
│   │   ├── database/
│   │   │   └── seeds/      # Seeds
│   │   └── server.ts       # Point d'entrée
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Services, guards, interceptors
│   │   │   ├── shared/     # Composants partagés
│   │   │   ├── features/   # Modules fonctionnels
│   │   │   └── app.module.ts
│   │   ├── assets/         # Images, styles
│   │   └── environments/   # Configuration par environnement
│   ├── angular.json
│   └── package.json
│
├── docker/                 # Configuration Docker
├── docker-compose.yml      # Orchestration des services
└── README.md
```

## Commandes Utiles

### Backend

```bash
cd backend

# Développement
npm run dev                 # Démarrer avec hot-reload
npm run build              # Build pour production
npm start                  # Démarrer en production

# Base de données
npm run migration:generate  # Générer une migration
npm run migration:run      # Exécuter les migrations
npm run migration:revert   # Annuler la dernière migration
npm run seed               # Peupler la base de données

# Tests
npm test                   # Tests unitaires
npm run test:e2e          # Tests d'intégration
npm run test:watch        # Tests en mode watch

# Qualité du code
npm run lint              # Linter
npm run format            # Formater le code
```

### Frontend

```bash
cd frontend

# Développement
npm start                  # Démarrer le serveur de dev
ng serve                   # Alternative
ng serve --open           # Ouvrir dans le navigateur

# Build
ng build                   # Build de développement
ng build --configuration production  # Build de production

# Tests
npm test                   # Tests unitaires
ng test                    # Alternative
ng e2e                     # Tests end-to-end

# Génération de code
ng generate component features/interventions/list
ng generate service core/services/intervention
ng generate guard core/guards/auth
```

### Docker

```bash
# Tout démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tout
docker-compose down

# Rebuild
docker-compose build

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Tests de l'API

### Avec curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supervision.com","password":"Admin123!"}'

# Récupérer les interventions (remplacer YOUR_TOKEN)
curl http://localhost:3000/api/interventions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Avec une collection Postman/Insomnia

Importez la collection depuis `docs/api-collection.json` (à créer si besoin)

## Dépannage

### Erreur de connexion à la base de données

Vérifiez que:
- PostgreSQL est démarré: `pg_isadmin`
- Les credentials dans `.env` sont corrects
- La base de données existe: `psql -l | grep supervision`

### Port déjà utilisé

Si le port 3000 ou 4200 est déjà utilisé:

```bash
# Trouver le process
lsof -i :3000
lsof -i :4200

# Tuer le process
kill -9 PID
```

Ou changez le port dans les fichiers de configuration.

### Erreurs npm install

```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

## Production

### Variables d'Environnement

Configurez les variables d'environnement appropriées:

- `NODE_ENV=production`
- `JWT_SECRET` et `JWT_REFRESH_SECRET` forts et aléatoires
- Credentials de base de données sécurisés
- CORS configuré pour votre domaine

### Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
ng build --configuration production
# Servir dist/frontend avec nginx ou autre serveur web
```

### Déploiement avec Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Support

Pour toute question ou problème:
1. Vérifiez les logs: `docker-compose logs` ou dans `backend/logs/`
2. Consultez la documentation API
3. Créez une issue sur le repository

## Licence

MIT

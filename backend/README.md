# Backend API - Gestion des Interventions de Maintenance

API RESTful Node.js/Express pour la gestion des interventions de maintenance.

## Installation

```bash
npm install
cp .env.example .env
# Éditer .env avec vos configurations
```

## Base de données

```bash
# Créer la base de données PostgreSQL
createdb supervision_maintenance

# Exécuter les migrations (auto avec synchronize en dev)
npm run migration:run

# Peupler avec des données de test
npm run seed
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

Compte admin par défaut:
- Email: `admin@supervision.com`
- Password: `Admin123!`

## Production

```bash
npm run build
npm start
```

## Tests

```bash
npm test                 # Tests unitaires
npm run test:e2e        # Tests d'intégration
npm run test:watch      # Mode watch
```

## API Documentation

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur

### Interventions

- `GET /api/interventions` - Liste avec filtres et pagination
- `GET /api/interventions/:id` - Détail
- `POST /api/interventions` - Créer (WRITE/ADMIN)
- `PUT /api/interventions/:id` - Modifier (WRITE/ADMIN)
- `DELETE /api/interventions/:id` - Supprimer (WRITE/ADMIN)
- `POST /api/interventions/:id/archive` - Archiver (WRITE/ADMIN)
- `POST /api/interventions/:id/restore` - Restaurer (WRITE/ADMIN)
- `GET /api/interventions/export/csv` - Export CSV
- `GET /api/interventions/stats` - Statistiques

### Valeurs Prédéfinies

- `GET /api/predefined` - Toutes les valeurs
- `GET /api/predefined/:type` - Par type
- `POST /api/predefined` - Créer (ADMIN)
- `PUT /api/predefined/:id` - Modifier (ADMIN)
- `DELETE /api/predefined/:id` - Supprimer (ADMIN)

### Audit

- `GET /api/audit` - Logs d'audit (ADMIN)
- `GET /api/audit/entity/:entityId` - Par entité (ADMIN)

## Structure

```
backend/
├── src/
│   ├── config/          # Configuration DB
│   ├── controllers/     # Controllers API
│   ├── entities/        # Entités TypeORM
│   ├── middlewares/     # Middlewares Express
│   ├── routes/          # Routes API
│   ├── services/        # Logique métier
│   ├── utils/           # Utilitaires
│   ├── database/
│   │   └── seeds/       # Seeds
│   └── server.ts        # Point d'entrée
├── test/                # Tests
└── dist/                # Build production
```

## Variables d'Environnement

Voir `.env.example` pour la liste complète.

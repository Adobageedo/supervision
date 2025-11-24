# Application de Gestion des Interventions de Maintenance

Application web professionnelle pour suivre, historiser et gérer les interventions de maintenance sur des centrales de production d'énergie (éolien, solaire, etc.).

## 🎯 Fonctionnalités

- ✅ **Gestion complète des interventions** (CRUD)
- 🔍 **Recherche et filtrage avancés**
- 📊 **Export CSV** (compatible Excel/Google Sheets)
- 👥 **Gestion des utilisateurs** avec authentification JWT
- 📱 **Interface responsive** (mobile et desktop)
- 📜 **Historique et traçabilité** complète
- 🔒 **Sécurité** et contrôle d'accès granulaire
- 📈 **Production-ready** avec monitoring et logging

## 🏗️ Architecture

```
Supervision/
├── backend/          # API Node.js + Express + TypeORM
├── frontend/         # Application Angular + Material Design
├── docker/           # Configuration Docker
└── docs/             # Documentation
```

## 🛠️ Stack Technique

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: TypeORM
- **Base de données**: PostgreSQL 14+
- **Authentification**: JWT (JSON Web Tokens)
- **Tests**: Jest, Supertest

### Frontend
- **Framework**: Angular 17+
- **UI Library**: Angular Material
- **State Management**: RxJS
- **Tests**: Karma, Jasmine, Cypress

### DevOps
- **Containerisation**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (à configurer)
- **Monitoring**: Winston (logs), PM2 (production)

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+ (ou Docker)
- Angular CLI (`npm install -g @angular/cli`)

### Installation avec Docker (Recommandé)

```bash
# Cloner le projet
cd Supervision

# Démarrer tous les services
docker-compose up -d

# L'application sera accessible sur:
# - Frontend: http://localhost:4200
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

### Installation Manuelle

#### 1. Base de données

```bash
# Créer la base de données PostgreSQL
createdb supervision_maintenance
```

#### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement dans .env
npm run migration:run
npm run dev
```

#### 3. Frontend

```bash
cd frontend
npm install
npm start
```

## 📦 Modèle de Données

### Intervention
- Titre de l'intervention
- Centrale (référence)
- Équipement
- Type d'événement (arrêt, alerte, préventif)
- Type de dysfonctionnement
- Dates (début, fin, indisponibilité)
- Intervenants
- Commentaires
- Perte de production
- Perte de communication

### Utilisateur
- Email
- Rôle (admin, écriture, lecture seule)
- Historique des actions

### Listes Prédéfinies
- Centrales
- Équipements
- Types d'événements
- Types de dysfonctionnements

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Hashage des mots de passe (bcrypt)
- Protection CORS
- Rate limiting
- Validation des entrées
- SQL injection protection (TypeORM)

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/refresh` - Rafraîchir le token

### Interventions
- `GET /api/interventions` - Liste avec filtres et pagination
- `GET /api/interventions/:id` - Détail d'une intervention
- `POST /api/interventions` - Créer une intervention
- `PUT /api/interventions/:id` - Modifier une intervention
- `DELETE /api/interventions/:id` - Supprimer une intervention
- `GET /api/interventions/export/csv` - Export CSV

### Listes Prédéfinies
- `GET /api/predefined/:type` - Listes (centrales, équipements, etc.)
- `POST /api/predefined/:type` - Ajouter une valeur
- `DELETE /api/predefined/:type/:id` - Supprimer une valeur

## 🧪 Tests

```bash
# Backend
cd backend
npm test                 # Tests unitaires
npm run test:e2e        # Tests d'intégration

# Frontend
cd frontend
npm test                 # Tests unitaires
npm run e2e             # Tests end-to-end (Cypress)
```

## 🚢 Déploiement Production

### Avec Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manuel

```bash
# Backend
cd backend
npm run build
npm run migration:run
npm start

# Frontend
cd frontend
npm run build
# Servir le dossier dist/ avec nginx ou autre serveur web
```

## 📝 Variables d'Environnement

Voir les fichiers `.env.example` dans les dossiers `backend/` et `frontend/`.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

Développé pour la gestion professionnelle des interventions de maintenance sur les centrales de production d'énergie.

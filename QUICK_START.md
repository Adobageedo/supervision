# Démarrage Rapide - 5 minutes

## Option 1: Avec Docker (Recommandé)

```bash
# 1. Créer le fichier .env pour le backend
cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=supervision_maintenance
DB_USER=supervision_user
DB_PASSWORD=supervision_password
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-12345
JWT_REFRESH_SECRET=votre-refresh-secret-minimum-32-caracteres-67890
CORS_ORIGIN=http://localhost:4200
EOF

# 2. Démarrer avec Docker
docker-compose up -d

# 3. Peupler la base de données (une seule fois)
docker-compose exec backend npm run seed

# ✅ C'est tout! Ouvrez votre navigateur:
# Frontend: http://localhost:4200
# Backend: http://localhost:3000
# Login: admin@supervision.com / Admin123!
```

## Option 2: Installation Manuelle

### Backend

```bash
# 1. Base de données
createdb supervision_maintenance

# 2. Backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run seed
npm run dev
```

### Frontend

```bash
# 3. Installer Angular CLI si nécessaire
npm install -g @angular/cli

# 4. Créer l'application Angular
cd ..
ng new frontend --routing --style=scss --strict
cd frontend

# 5. Installer les dépendances
ng add @angular/material
npm install @angular/material-moment-adapter moment chart.js ng2-charts

# 6. Démarrer
ng serve
```

## Accès

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Login**: 
  - Email: `admin@supervision.com`
  - Password: `Admin123!`

## Prochaines Étapes

1. Se connecter avec le compte admin
2. Explorer le tableau de bord
3. Créer une intervention de test
4. Tester l'export CSV
5. Consulter la documentation complète dans `SETUP.md`

## Arrêter l'Application

```bash
# Docker
docker-compose down

# Manuel
# Ctrl+C dans chaque terminal
```

## Besoin d'Aide?

Consultez `SETUP.md` pour la documentation complète et le dépannage.

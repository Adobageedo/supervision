#!/bin/bash

# Script d'initialisation du frontend Angular
# Ce script crée et configure l'application Angular avec Material Design

set -e

echo "🚀 Initialisation du frontend Angular..."

# Vérifier si Angular CLI est installé
if ! command -v ng &> /dev/null; then
    echo "❌ Angular CLI n'est pas installé"
    echo "📦 Installation d'Angular CLI..."
    npm install -g @angular/cli
fi

# Vérifier si le dossier frontend existe déjà
if [ -d "frontend" ]; then
    echo "⚠️  Le dossier frontend existe déjà"
    read -p "Voulez-vous le supprimer et recommencer? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf frontend
    else
        echo "❌ Annulation de l'initialisation"
        exit 1
    fi
fi

# Créer l'application Angular
echo "📦 Création de l'application Angular..."
ng new frontend --routing --style=scss --strict --skip-git

cd frontend

# Installer Angular Material
echo "📦 Installation d'Angular Material..."
ng add @angular/material --skip-confirmation

# Installer les dépendances supplémentaires
echo "📦 Installation des dépendances..."
npm install @angular/material-moment-adapter moment
npm install chart.js ng2-charts
npm install --save-dev @types/node

# Créer la structure des dossiers
echo "📁 Création de la structure des dossiers..."
mkdir -p src/app/core/{services,guards,interceptors,models}
mkdir -p src/app/shared/{components,directives,pipes}
mkdir -p src/app/features/{auth,interventions,dashboard,admin}

# Créer les environnements
echo "📝 Configuration des environnements..."
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
EOF

cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: '/api'
};
EOF

# Créer un fichier de styles globaux
echo "🎨 Configuration des styles..."
cat >> src/styles.scss << 'EOF'

/* Configuration Angular Material */
@import '@angular/material/prebuilt-themes/indigo-pink.css';

/* Styles globaux */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.full-width {
  width: 100%;
}

.spacer {
  flex: 1 1 auto;
}

/* Utilitaires */
.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }
.mb-1 { margin-bottom: 8px; }
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }
.p-1 { padding: 8px; }
.p-2 { padding: 16px; }
.p-3 { padding: 24px; }

.text-center { text-align: center; }
.text-right { text-align: right; }
EOF

echo "✅ Frontend Angular initialisé avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. cd frontend"
echo "  2. npm start"
echo "  3. Ouvrez http://localhost:4200"
echo ""
echo "📚 Pour créer les composants, consultez FRONTEND_GUIDE.md"

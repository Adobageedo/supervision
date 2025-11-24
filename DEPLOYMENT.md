# Guide de Déploiement en Production

## Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Docker et Docker Compose installés
- Nom de domaine configuré
- Certificat SSL (Let's Encrypt recommandé)
- PostgreSQL (base de données externe recommandée pour la production)

## Option 1: Déploiement avec Docker (Recommandé)

### 1. Préparation du Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Configuration des Variables d'Environnement

```bash
# Créer le fichier .env pour la production
cat > .env.prod << 'EOF'
# Application
NODE_ENV=production

# Database
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=supervision_maintenance_prod
DB_USER=supervision_prod_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# JWT - Générer des clés sécurisées
JWT_SECRET=YOUR_SECURE_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_SECURE_REFRESH_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Générer des secrets JWT sécurisés
openssl rand -base64 32
```

### 3. Configuration Nginx pour SSL

Créer le fichier `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://backend:3000/api/health;
    }
}
```

### 4. Déploiement

```bash
# Cloner ou transférer le projet sur le serveur
git clone your-repo.git supervision
cd supervision

# Ou utiliser scp/rsync
# rsync -avz --exclude node_modules ./ user@server:/path/to/supervision/

# Configurer les variables d'environnement
cp .env.prod backend/.env

# Build et démarrer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f

# Exécuter les seeds (première installation uniquement)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### 5. Obtenir un Certificat SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d your-domain.com

# Renouvellement automatique (déjà configuré par défaut)
sudo certbot renew --dry-run
```

## Option 2: Déploiement Manuel

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm ci --only=production

# Build
npm run build

# Installer PM2 pour la gestion des processus
npm install -g pm2

# Démarrer avec PM2
pm2 start dist/server.js --name supervision-api

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### 2. Frontend

```bash
cd frontend

# Build
npm run build -- --configuration production

# Servir avec Nginx
sudo cp -r dist/frontend/* /var/www/html/
```

### 3. Configuration Nginx

```bash
# Installer Nginx
sudo apt install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/supervision

# Activer le site
sudo ln -s /etc/nginx/sites-available/supervision /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Sauvegardes

### Base de Données

```bash
# Script de sauvegarde automatique
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="supervision_maintenance_prod"

mkdir -p $BACKUP_DIR

# Sauvegarde PostgreSQL
pg_dump -h localhost -U supervision_prod_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
EOF

chmod +x backup-db.sh

# Ajouter au crontab pour sauvegarde quotidienne à 2h du matin
crontab -e
# Ajouter: 0 2 * * * /path/to/backup-db.sh
```

## Monitoring

### 1. Logs Application

```bash
# Avec Docker
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Avec PM2
pm2 logs supervision-api
pm2 monit
```

### 2. Health Checks

```bash
# Script de monitoring
cat > health-check.sh << 'EOF'
#!/bin/bash
ENDPOINT="https://your-domain.com/health"

response=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $response -eq 200 ]; then
    echo "$(date): Application is healthy"
else
    echo "$(date): Application is down! Status: $response"
    # Envoyer une alerte (email, Slack, etc.)
fi
EOF

chmod +x health-check.sh

# Exécuter toutes les 5 minutes
crontab -e
# Ajouter: */5 * * * * /path/to/health-check.sh >> /var/log/health-check.log
```

### 3. Monitoring avec PM2 Plus (optionnel)

```bash
pm2 link your-secret-key your-public-key
pm2 install pm2-server-monit
```

## Mises à Jour

### Avec Docker

```bash
cd supervision

# Récupérer les dernières modifications
git pull

# Rebuild et redémarrer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Manuel

```bash
# Backend
cd backend
git pull
npm ci --only=production
npm run build
pm2 restart supervision-api

# Frontend
cd frontend
git pull
npm run build -- --configuration production
sudo cp -r dist/frontend/* /var/www/html/
```

## Sécurité

### 1. Firewall

```bash
# Installer UFW
sudo apt install ufw

# Configurer les règles
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Activer le firewall
sudo ufw enable
sudo ufw status
```

### 2. Fail2Ban

```bash
# Installer Fail2Ban
sudo apt install fail2ban

# Configurer
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Démarrer
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Sécurité PostgreSQL

```bash
# Modifier postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'

# Modifier pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Restreindre les connexions

sudo systemctl restart postgresql
```

## Performance

### 1. Optimisation PostgreSQL

```sql
-- Vacuum régulier
VACUUM ANALYZE;

-- Index sur les colonnes fréquemment recherchées
CREATE INDEX idx_interventions_centrale ON interventions(centrale);
CREATE INDEX idx_interventions_date_debut ON interventions(date_debut);
CREATE INDEX idx_interventions_archived ON interventions(is_archived);
```

### 2. Compression Nginx

Déjà configuré dans docker-compose.prod.yml

### 3. CDN (optionnel)

Configurer CloudFlare ou AWS CloudFront pour servir les assets statiques.

## Dépannage Production

### Vérifier l'état des services

```bash
# Docker
docker-compose -f docker-compose.prod.yml ps

# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Vérifier les logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Redémarrer les services

```bash
# Docker
docker-compose -f docker-compose.prod.yml restart

# PM2
pm2 restart all

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql
```

## Rollback

En cas de problème après une mise à jour:

```bash
# Avec Docker
docker-compose -f docker-compose.prod.yml down
git checkout previous-tag
docker-compose -f docker-compose.prod.yml up -d

# Restaurer la base de données si nécessaire
gunzip < /backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U supervision_prod_user supervision_maintenance_prod
```

## Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Secrets JWT sécurisés générés
- [ ] Base de données créée et accessible
- [ ] Certificat SSL installé
- [ ] Firewall configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring en place
- [ ] Health checks configurés
- [ ] Tests de charge effectués
- [ ] Documentation mise à jour
- [ ] Plan de rollback prêt

## Support

Pour toute question ou problème en production:
1. Consultez les logs
2. Vérifiez le monitoring
3. Consultez la documentation
4. Contactez le support technique

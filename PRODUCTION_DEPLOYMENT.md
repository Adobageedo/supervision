# Production Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- SSL certificates (Let's Encrypt recommended)
- Domain name configured (chardouin.fr)
- Server with at least 2GB RAM

### 1. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd supervision

# Create environment file
cp .env.example .env

# Edit .env and update ALL values
nano .env
```

**Important:** Update these critical values in `.env`:
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ character string (generate with: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` - Different random 32+ character string
- `CORS_ORIGIN` - Your production domain(s)

### 2. SSL Certificates

Place your SSL certificates in `nginx/certs/`:
```bash
# Using Let's Encrypt (recommended)
sudo certbot certonly --standalone -d chardouin.fr -d www.chardouin.fr

# Copy certificates
sudo cp /etc/letsencrypt/live/chardouin.fr/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/chardouin.fr/privkey.pem nginx/certs/
sudo chmod 644 nginx/certs/*.pem
```

### 3. Deploy

```bash
# Run the deployment script
./deploy.sh
```

The script will:
- ✅ Validate environment configuration
- ✅ Check SSL certificates
- ✅ Backup existing database
- ✅ Build Docker images
- ✅ Start all services
- ✅ Verify health checks

## 📋 Manual Deployment

If you prefer manual deployment:

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Service Management

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 💾 Database Management

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U supervision_user supervision_maintenance > backup_$(date +%Y%m%d).sql

# Or use the backup script
./scripts/backup-db.sh
```

### Restore Database
```bash
# Restore from backup
cat backup_20231201.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U supervision_user supervision_maintenance
```

### Access Database
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user supervision_maintenance
```

## 🔍 Health Checks

### Check Service Health
```bash
# Backend health
curl https://chardouin.fr/api/health

# Nginx health
curl https://chardouin.fr/health

# Check all containers
docker-compose -f docker-compose.prod.yml ps
```

### Monitor Resources
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🛡️ Security Checklist

- [ ] Strong passwords in `.env` file
- [ ] JWT secrets are random and secure
- [ ] SSL certificates are valid and up-to-date
- [ ] CORS_ORIGIN set to your domain only
- [ ] Database port not exposed externally
- [ ] Regular backups configured
- [ ] Firewall configured (ports 80, 443 only)
- [ ] `.env` file not committed to git

## 🔄 SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/chardouin.fr/*.pem /path/to/supervision/nginx/certs/ && docker-compose -f /path/to/supervision/docker-compose.prod.yml restart nginx"
```

## 📊 Monitoring

### Application Logs
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# Container resource usage
docker stats supervision-backend supervision-frontend supervision-nginx supervision-db

# Database connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user -d supervision_maintenance -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common issues:
# 1. Database not ready - wait and restart
# 2. Environment variables missing - check .env
# 3. Port already in use - check for conflicts
```

### Frontend not loading
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Verify build completed
docker-compose -f docker-compose.prod.yml logs frontend

# Check nginx config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Database connection issues
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend node -e "console.log('Testing DB connection...')"

# Check credentials in .env match
```

### SSL certificate issues
```bash
# Verify certificates exist
ls -la nginx/certs/

# Check certificate validity
openssl x509 -in nginx/certs/fullchain.pem -text -noout

# Test nginx config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

## 🔐 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `supervision_maintenance` |
| `POSTGRES_USER` | Database user | `supervision_user` |
| `POSTGRES_PASSWORD` | Database password | `strong_random_password` |
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | JWT signing secret | `random_32_char_string` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | `different_random_string` |
| `BACKEND_PORT` | Backend port | `4202` |
| `CORS_ORIGIN` | Allowed origins | `https://chardouin.fr` |
| `DOMAIN` | Your domain | `chardouin.fr` |
| `EMAIL` | Admin email | `admin@chardouin.fr` |

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables in `.env`
3. Check service health: `docker-compose -f docker-compose.prod.yml ps`
4. Review this guide's troubleshooting section

## 🎯 Production Best Practices

1. **Regular Backups**: Schedule daily database backups
2. **Monitoring**: Set up monitoring and alerting
3. **Updates**: Keep Docker images and dependencies updated
4. **Security**: Regularly update SSL certificates and review security settings
5. **Logs**: Implement log rotation to manage disk space
6. **Testing**: Test updates in staging before production
7. **Documentation**: Keep deployment notes and runbooks updated

# 🚀 Quick Reference Card

## Essential Commands

### 🎯 Deployment
```bash
./deploy.sh                              # Initial deployment
./scripts/update-production.sh           # Update existing deployment
./scripts/health-check.sh                # Check system health
```

### 📦 Docker Services
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View status
docker-compose -f docker-compose.prod.yml ps

# View logs (all services)
docker-compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres

# Restart service
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### 💾 Database
```bash
# Backup
./scripts/backup-db.sh

# Restore
./scripts/restore-db.sh backups/backup_file.sql.gz

# Access database CLI
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user supervision_maintenance

# View database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user -d supervision_maintenance -c "SELECT pg_size_pretty(pg_database_size('supervision_maintenance'));"
```

### 🔍 Monitoring
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend --tail=100
```

### 🔒 SSL/TLS
```bash
# Check certificate expiry
openssl x509 -enddate -noout -in nginx/certs/fullchain.pem

# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx (after config change)
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Renew Let's Encrypt certificates
sudo certbot renew
sudo cp /etc/letsencrypt/live/chardouin.fr/*.pem nginx/certs/
docker-compose -f docker-compose.prod.yml restart nginx
```

### 🧹 Cleanup
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | https://chardouin.fr |
| API | https://chardouin.fr/api |
| Health Check | https://chardouin.fr/api/health |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (DO NOT COMMIT) |
| `docker-compose.prod.yml` | Production Docker configuration |
| `nginx/conf.d/default.conf` | Nginx configuration |
| `nginx/certs/` | SSL certificates |
| `deploy.sh` | Main deployment script |
| `PRODUCTION_DEPLOYMENT.md` | Full deployment guide |
| `PRODUCTION_CHECKLIST.md` | Deployment checklist |

## 🔧 Environment Variables

Generate secure secrets:
```bash
# JWT Secret
openssl rand -base64 32

# Strong password
openssl rand -base64 24
```

Critical variables in `.env`:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

## 🚨 Emergency Procedures

### Application Down
```bash
# 1. Check service status
docker-compose -f docker-compose.prod.yml ps

# 2. Check logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# 3. Restart all services
docker-compose -f docker-compose.prod.yml restart

# 4. If still down, rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Issues
```bash
# 1. Check database status
docker-compose -f docker-compose.prod.yml ps postgres

# 2. Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# 3. Restart database
docker-compose -f docker-compose.prod.yml restart postgres

# 4. If corrupted, restore from backup
./scripts/restore-db.sh backups/latest_backup.sql.gz
```

### SSL Certificate Expired
```bash
# 1. Renew certificate
sudo certbot renew --force-renewal

# 2. Copy new certificates
sudo cp /etc/letsencrypt/live/chardouin.fr/*.pem nginx/certs/

# 3. Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Rollback to Previous Version
```bash
# 1. Stop current deployment
docker-compose -f docker-compose.prod.yml down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Restore database if needed
./scripts/restore-db.sh backups/pre_deploy_backup.sql.gz

# 4. Deploy previous version
./deploy.sh
```

## 📊 Health Checks

Quick health verification:
```bash
# Backend health
curl https://chardouin.fr/api/health

# Frontend
curl -I https://chardouin.fr

# Database (from inside backend container)
docker-compose -f docker-compose.prod.yml exec backend node -e "console.log('DB check')"

# All services
./scripts/health-check.sh
```

## 🎯 Performance Tips

```bash
# View container resource usage
docker stats --no-stream

# Check database connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user -d supervision_maintenance -c "SELECT count(*) FROM pg_stat_activity;"

# Analyze slow queries
docker-compose -f docker-compose.prod.yml exec postgres psql -U supervision_user -d supervision_maintenance -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## 📞 Support Checklist

When reporting issues, gather:
1. Service status: `docker-compose -f docker-compose.prod.yml ps`
2. Recent logs: `docker-compose -f docker-compose.prod.yml logs --tail=100`
3. Error messages
4. Steps to reproduce
5. Expected vs actual behavior

## 🔗 Quick Links

- [Full Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- [Deployment Checklist](PRODUCTION_CHECKLIST.md)
- [Production Summary](PRODUCTION_READY_SUMMARY.md)
- [Nginx Configuration](nginx/README.md)

---

**Keep this card handy for day-to-day operations!**

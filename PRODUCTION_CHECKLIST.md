# 🚀 Production Deployment Checklist

Use this checklist to ensure your production deployment is secure and ready.

## 📋 Pre-Deployment Checklist

### Environment Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `POSTGRES_PASSWORD` changed to strong password (min 16 characters)
- [ ] `JWT_SECRET` generated with `openssl rand -base64 32`
- [ ] `JWT_REFRESH_SECRET` generated (different from JWT_SECRET)
- [ ] `CORS_ORIGIN` set to production domain(s)
- [ ] `DOMAIN` set to your domain name
- [ ] `EMAIL` set to valid admin email
- [ ] All `CHANGE_THIS` values updated in `.env`

### SSL/TLS Configuration
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] `fullchain.pem` placed in `nginx/certs/`
- [ ] `privkey.pem` placed in `nginx/certs/`
- [ ] Certificate permissions set correctly (644)
- [ ] Certificate expiry date noted (set renewal reminder)

### Server Configuration
- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Server has minimum 2GB RAM
- [ ] Server has minimum 20GB disk space
- [ ] Firewall configured (allow ports 80, 443)
- [ ] SSH access configured
- [ ] Non-root user created for deployment

### Domain Configuration
- [ ] Domain DNS A record points to server IP
- [ ] WWW subdomain configured (if needed)
- [ ] DNS propagation verified

### Code & Repository
- [ ] Latest code pulled from repository
- [ ] All dependencies up to date
- [ ] No sensitive data in repository
- [ ] `.gitignore` properly configured
- [ ] Production branch created (if using git flow)

## 🔒 Security Checklist

### Application Security
- [ ] Strong database passwords set
- [ ] JWT secrets are random and secure
- [ ] CORS restricted to production domain only
- [ ] Helmet.js security headers enabled
- [ ] Rate limiting configured
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF protection implemented

### Infrastructure Security
- [ ] Database port not exposed externally
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban or similar intrusion prevention installed
- [ ] Automatic security updates enabled
- [ ] Firewall rules configured (UFW/iptables)
- [ ] Only necessary ports open (80, 443, 22)

### SSL/TLS Security
- [ ] TLS 1.2+ only (no TLS 1.0/1.1)
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled
- [ ] SSL stapling enabled
- [ ] Certificate chain complete

## 🗄️ Database Checklist

- [ ] Database backup strategy defined
- [ ] Initial database backup created
- [ ] Backup retention policy set (30 days recommended)
- [ ] Backup restoration tested
- [ ] Database credentials secured
- [ ] Connection pooling configured
- [ ] Database migrations ready

## 📦 Docker Configuration

- [ ] Production Dockerfiles reviewed
- [ ] `.dockerignore` configured
- [ ] Multi-stage builds used
- [ ] Non-root user in containers
- [ ] Health checks configured
- [ ] Resource limits set (if needed)
- [ ] Volume persistence configured
- [ ] Container restart policies set

## 🌐 Nginx Configuration

- [ ] Nginx config syntax validated
- [ ] HTTP to HTTPS redirect configured
- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] Security headers added
- [ ] Rate limiting configured (if needed)
- [ ] Log rotation configured
- [ ] Custom error pages (optional)

## 📊 Monitoring & Logging

- [ ] Application logging configured
- [ ] Log rotation set up
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring set up
- [ ] Resource monitoring configured
- [ ] Alert notifications configured
- [ ] Backup monitoring enabled

## 🧪 Testing Checklist

### Pre-Deployment Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing (if available)
- [ ] Manual testing completed
- [ ] Performance testing done
- [ ] Security scanning completed

### Post-Deployment Testing
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connections work
- [ ] Authentication works
- [ ] All features functional
- [ ] SSL certificate valid
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done

## 🚀 Deployment Steps

1. **Backup Current State**
   ```bash
   ./scripts/backup-db.sh
   ```

2. **Run Deployment Script**
   ```bash
   ./deploy.sh
   ```

3. **Verify Deployment**
   ```bash
   ./scripts/health-check.sh
   ```

4. **Monitor Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## ✅ Post-Deployment Checklist

### Immediate Verification
- [ ] All containers running
- [ ] Health checks passing
- [ ] Frontend accessible via HTTPS
- [ ] Backend API responding
- [ ] Database connections working
- [ ] No errors in logs
- [ ] SSL certificate valid
- [ ] Redirects working (HTTP → HTTPS)

### Functional Testing
- [ ] User login works
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] File uploads work (if applicable)
- [ ] Search functionality works
- [ ] All critical features tested

### Performance Verification
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Database queries optimized

### Security Verification
- [ ] SSL Labs test (A+ rating)
- [ ] Security headers check
- [ ] CORS working correctly
- [ ] Authentication secure
- [ ] No exposed secrets

## 🔄 Ongoing Maintenance

### Daily
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Verify backups completed

### Weekly
- [ ] Review security logs
- [ ] Check disk space
- [ ] Monitor performance metrics
- [ ] Review backup integrity

### Monthly
- [ ] Update dependencies
- [ ] Review SSL certificate expiry
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup restoration test

### Quarterly
- [ ] Full security assessment
- [ ] Disaster recovery drill
- [ ] Performance benchmarking
- [ ] Documentation update

## 📞 Emergency Contacts

- **Server Provider**: _________________
- **Domain Registrar**: _________________
- **SSL Provider**: _________________
- **On-Call Developer**: _________________
- **Database Admin**: _________________

## 🔗 Important URLs

- **Production Site**: https://chardouin.fr
- **API Health**: https://chardouin.fr/api/health
- **Server Dashboard**: _________________
- **Monitoring Dashboard**: _________________
- **Error Tracking**: _________________

## 📝 Rollback Plan

If deployment fails:

1. **Stop new deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore previous version**
   ```bash
   git checkout <previous-commit>
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Restore database (if needed)**
   ```bash
   ./scripts/restore-db.sh backups/latest_backup.sql.gz
   ```

4. **Verify rollback**
   ```bash
   ./scripts/health-check.sh
   ```

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All services running and healthy
- ✅ Application accessible via HTTPS
- ✅ No critical errors in logs
- ✅ All health checks passing
- ✅ Core functionality working
- ✅ Performance metrics acceptable
- ✅ Security headers present
- ✅ Backups configured and working

---

**Last Updated**: _________________  
**Deployed By**: _________________  
**Deployment Date**: _________________  
**Version**: _________________

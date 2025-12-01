# Nginx Configuration

This directory contains the Nginx configuration for the Supervision application.

## Directory Structure

```
nginx/
├── conf.d/
│   └── default.conf       # Main Nginx configuration
├── certs/
│   ├── fullchain.pem      # SSL certificate (not in git)
│   └── privkey.pem        # SSL private key (not in git)
└── logs/                  # Nginx logs (created at runtime)
```

## SSL Certificates

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d chardouin.fr -d www.chardouin.fr

# Copy to nginx/certs/
sudo cp /etc/letsencrypt/live/chardouin.fr/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/chardouin.fr/privkey.pem nginx/certs/
sudo chmod 644 nginx/certs/*.pem
```

### Auto-Renewal

Set up a cron job for automatic renewal:

```bash
# Edit crontab
sudo crontab -e

# Add renewal job (runs twice daily)
0 0,12 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/chardouin.fr/*.pem /path/to/supervision/nginx/certs/ && docker-compose -f /path/to/supervision/docker-compose.prod.yml restart nginx"
```

## Configuration Features

### Security Headers
- **HSTS**: Forces HTTPS for 1 year
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Performance Optimization
- **Gzip Compression**: Reduces bandwidth usage
- **HTTP/2**: Faster page loads
- **Static Asset Caching**: 1-year cache for static files
- **SSL Session Caching**: Reduces SSL handshake overhead

### Proxy Configuration
- **WebSocket Support**: For real-time features
- **Proper Headers**: X-Forwarded-* headers
- **Timeouts**: 60s for long-running requests
- **Buffering**: Optimized for performance

## Testing Configuration

Test Nginx configuration before restarting:

```bash
# Test configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload configuration (if test passes)
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Viewing Logs

```bash
# Access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Error logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Or from host (if volume mounted)
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

## SSL Security Test

Test your SSL configuration:

```bash
# Using SSL Labs (online)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=chardouin.fr

# Using testssl.sh (local)
docker run --rm -ti drwetter/testssl.sh chardouin.fr
```

## Common Issues

### Certificate Not Found
```bash
# Check certificates exist
ls -la nginx/certs/

# Verify permissions
chmod 644 nginx/certs/*.pem
```

### Configuration Syntax Error
```bash
# Test configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Check logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### 502 Bad Gateway
- Backend service not running
- Backend not accessible from nginx container
- Check backend health: `curl http://supervision-backend:4202/api/health`

## Customization

### Adding Custom Domain

Edit `conf.d/default.conf`:

```nginx
server_name chardouin.fr www.chardouin.fr your-domain.com;
```

### Adjusting Cache Duration

Edit static asset caching:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;  # Change to desired duration
}
```

### Adding Rate Limiting

Add to server block:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

## Monitoring

Monitor Nginx performance:

```bash
# Active connections
docker-compose -f docker-compose.prod.yml exec nginx cat /var/run/nginx.pid | xargs ps -p

# Request statistics (if stub_status enabled)
curl http://localhost/nginx_status
```

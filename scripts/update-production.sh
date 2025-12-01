#!/bin/bash

# ============================================
# Production Update Script
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_header "Production Update Process"

# Confirm update
echo "This will update the production application with the latest code."
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Update cancelled"
    exit 0
fi

# Backup database
print_header "Creating Database Backup"
./scripts/backup-db.sh

# Pull latest code
print_header "Pulling Latest Code"
git pull origin main || git pull origin master
print_success "Code updated"

# Rebuild images
print_header "Rebuilding Docker Images"
docker-compose -f docker-compose.prod.yml build --no-cache
print_success "Images rebuilt"

# Stop services gracefully
print_header "Stopping Services"
docker-compose -f docker-compose.prod.yml down
print_success "Services stopped"

# Start services
print_header "Starting Services"
docker-compose -f docker-compose.prod.yml up -d
print_success "Services started"

# Wait for health checks
print_header "Waiting for Services to be Healthy"
sleep 10

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        print_success "Application is healthy"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Application failed to start properly"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Show status
print_header "Deployment Status"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_success "Update completed successfully!"
echo ""
echo "Application is running at: https://chardouin.fr"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"

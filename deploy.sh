#!/bin/bash

# ============================================
# Production Deployment Script
# Supervision Maintenance Application
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
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

# Check if .env file exists
check_env_file() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo "Please create .env file from .env.example:"
        echo "  cp .env.example .env"
        echo "Then update all values in .env file"
        exit 1
    fi
    
    print_success ".env file found"
    
    # Check for default/insecure values
    if grep -q "CHANGE_THIS" .env; then
        print_error "Found default values in .env file!"
        echo "Please update all CHANGE_THIS values in .env file"
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Check if SSL certificates exist
check_ssl_certs() {
    print_header "Checking SSL Certificates"
    
    if [ ! -f nginx/certs/fullchain.pem ] || [ ! -f nginx/certs/privkey.pem ]; then
        print_warning "SSL certificates not found in nginx/certs/"
        echo "Please add your SSL certificates:"
        echo "  - nginx/certs/fullchain.pem"
        echo "  - nginx/certs/privkey.pem"
        echo ""
        echo "Or use Let's Encrypt to generate them."
        read -p "Continue without SSL? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "SSL certificates found"
    fi
}

# Create necessary directories
create_directories() {
    print_header "Creating Necessary Directories"
    
    mkdir -p nginx/logs
    mkdir -p backend/logs
    
    print_success "Directories created"
}

# Pull latest changes (if using git)
pull_latest() {
    print_header "Pulling Latest Changes"
    
    if [ -d .git ]; then
        git pull origin main || git pull origin master
        print_success "Latest changes pulled"
    else
        print_warning "Not a git repository, skipping pull"
    fi
}

# Build and start services
deploy_services() {
    print_header "Building and Deploying Services"
    
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    
    echo "Building images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed"
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Healthy"
    
    echo "Waiting for database..."
    sleep 5
    
    echo "Waiting for backend..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml exec -T backend node -e "require('http').get('http://localhost:4202/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
            print_success "Backend is healthy"
            break
        fi
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts..."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend failed to start"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
}

# Show deployment status
show_status() {
    print_header "Deployment Status"
    
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "Your application is now running:"
    echo "  - Frontend: https://chardouin.fr"
    echo "  - Backend API: https://chardouin.fr/api"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo ""
}

# Backup database
backup_database() {
    print_header "Creating Database Backup"
    
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U supervision_user supervision_maintenance > $BACKUP_FILE
    
    print_success "Database backed up to $BACKUP_FILE"
}

# Main deployment flow
main() {
    print_header "Starting Production Deployment"
    
    # Pre-deployment checks
    check_env_file
    check_ssl_certs
    create_directories
    
    # Ask for confirmation
    echo ""
    read -p "Ready to deploy to production? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Backup existing database if running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "supervision-db"; then
        backup_database
    fi
    
    # Deploy
    pull_latest
    deploy_services
    wait_for_services
    show_status
}

# Run main function
main

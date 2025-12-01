#!/bin/bash

# ============================================
# Pre-Flight Check Script
# Run this before deploying to production
# ============================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((ERRORS++))
}

# Check Docker
print_header "Docker Installation"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    check_pass "Docker installed (version $DOCKER_VERSION)"
else
    check_fail "Docker not installed"
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    check_pass "Docker Compose installed (version $COMPOSE_VERSION)"
else
    check_fail "Docker Compose not installed"
fi

# Check .env file
print_header "Environment Configuration"
if [ -f .env ]; then
    check_pass ".env file exists"
    
    # Check for default values
    if grep -q "CHANGE_THIS" .env; then
        check_fail ".env contains default CHANGE_THIS values"
    else
        check_pass "No default CHANGE_THIS values found"
    fi
    
    # Check required variables
    required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET" "CORS_ORIGIN")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            value=$(grep "^${var}=" .env | cut -d'=' -f2)
            if [ -n "$value" ]; then
                check_pass "$var is set"
            else
                check_fail "$var is empty"
            fi
        else
            check_fail "$var is missing"
        fi
    done
    
    # Check JWT secret length
    JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
    if [ ${#JWT_SECRET} -ge 32 ]; then
        check_pass "JWT_SECRET is sufficiently long (${#JWT_SECRET} chars)"
    else
        check_warn "JWT_SECRET should be at least 32 characters (current: ${#JWT_SECRET})"
    fi
    
else
    check_fail ".env file not found (copy from .env.example)"
fi

# Check SSL certificates
print_header "SSL Certificates"
if [ -f nginx/certs/fullchain.pem ]; then
    check_pass "fullchain.pem exists"
    
    # Check certificate expiry
    EXPIRY=$(openssl x509 -enddate -noout -in nginx/certs/fullchain.pem | cut -d= -f2)
    EXPIRY_EPOCH=$(date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null || date -d "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        check_pass "Certificate valid for $DAYS_UNTIL_EXPIRY days"
    elif [ $DAYS_UNTIL_EXPIRY -gt 0 ]; then
        check_warn "Certificate expires in $DAYS_UNTIL_EXPIRY days (renew soon)"
    else
        check_fail "Certificate has expired"
    fi
else
    check_warn "fullchain.pem not found (SSL will not work)"
fi

if [ -f nginx/certs/privkey.pem ]; then
    check_pass "privkey.pem exists"
    
    # Check permissions
    PERMS=$(stat -f "%OLp" nginx/certs/privkey.pem 2>/dev/null || stat -c "%a" nginx/certs/privkey.pem 2>/dev/null)
    if [ "$PERMS" = "644" ] || [ "$PERMS" = "600" ]; then
        check_pass "privkey.pem has correct permissions ($PERMS)"
    else
        check_warn "privkey.pem permissions should be 600 or 644 (current: $PERMS)"
    fi
else
    check_warn "privkey.pem not found (SSL will not work)"
fi

# Check disk space
print_header "System Resources"
DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ $(echo "$DISK_AVAIL > 10" | bc 2>/dev/null || echo "1") -eq 1 ]; then
    check_pass "Sufficient disk space available"
else
    check_warn "Low disk space (less than 10GB available)"
fi

# Check memory
if command -v free &> /dev/null; then
    MEM_AVAIL=$(free -g | awk 'NR==2 {print $7}')
    if [ $MEM_AVAIL -ge 2 ]; then
        check_pass "Sufficient memory available (${MEM_AVAIL}GB)"
    else
        check_warn "Low memory (less than 2GB available)"
    fi
fi

# Check required directories
print_header "Directory Structure"
required_dirs=("nginx/conf.d" "nginx/certs" "backend" "frontend" "scripts")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directory exists: $dir"
    else
        check_fail "Directory missing: $dir"
    fi
done

# Check required files
print_header "Required Files"
required_files=(
    "docker-compose.prod.yml"
    "frontend/Dockerfile.prod"
    "backend/Dockerfile.prod"
    "nginx/conf.d/default.conf"
    "deploy.sh"
)
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "File exists: $file"
    else
        check_fail "File missing: $file"
    fi
done

# Check script permissions
print_header "Script Permissions"
scripts=("deploy.sh" "scripts/backup-db.sh" "scripts/restore-db.sh" "scripts/health-check.sh" "scripts/update-production.sh")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "$script is executable"
        else
            check_warn "$script is not executable (run: chmod +x $script)"
        fi
    fi
done

# Check Docker Compose syntax
print_header "Docker Compose Configuration"
if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    check_pass "docker-compose.prod.yml syntax is valid"
else
    check_fail "docker-compose.prod.yml has syntax errors"
fi

# Check Nginx configuration
print_header "Nginx Configuration"
if [ -f nginx/conf.d/default.conf ]; then
    # Basic syntax check (can't fully validate without running container)
    if grep -q "server_name" nginx/conf.d/default.conf; then
        check_pass "Nginx configuration appears valid"
    else
        check_warn "Nginx configuration may be incomplete"
    fi
fi

# Check for sensitive files in git
print_header "Git Security"
if [ -d .git ]; then
    if git ls-files | grep -q "\.env$"; then
        check_fail ".env file is tracked by git (SECURITY RISK!)"
    else
        check_pass ".env file is not tracked by git"
    fi
    
    if git ls-files | grep -q "\.pem$"; then
        check_fail "SSL certificates are tracked by git (SECURITY RISK!)"
    else
        check_pass "SSL certificates are not tracked by git"
    fi
fi

# Summary
print_header "Pre-Flight Check Summary"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review PRODUCTION_CHECKLIST.md"
    echo "  2. Run: ./deploy.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Checks passed with warnings. Review warnings before deploying.${NC}"
    echo ""
    echo "You can proceed with deployment, but address warnings if possible."
    exit 0
else
    echo -e "${RED}✗ Pre-flight check failed. Fix errors before deploying.${NC}"
    echo ""
    echo "Please address the errors above before attempting deployment."
    exit 1
fi

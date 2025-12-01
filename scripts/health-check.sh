#!/bin/bash

# ============================================
# Health Check Script
# ============================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

check_service() {
    local service=$1
    local status=$(docker-compose -f docker-compose.prod.yml ps -q $service 2>/dev/null)
    
    if [ -z "$status" ]; then
        echo -e "${RED}✗ $service: Not running${NC}"
        return 1
    else
        local health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose -f docker-compose.prod.yml ps -q $service) 2>/dev/null)
        if [ "$health" == "healthy" ] || [ -z "$health" ]; then
            echo -e "${GREEN}✓ $service: Running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ $service: Running but unhealthy${NC}"
            return 1
        fi
    fi
}

check_url() {
    local name=$1
    local url=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✓ $name: Accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ $name: Not accessible${NC}"
        return 1
    fi
}

# Main health check
print_header "Docker Services Status"
check_service "postgres"
check_service "backend"
check_service "nginx"

print_header "HTTP Endpoints"
check_url "Backend Health" "http://localhost/api/health"
check_url "Frontend" "http://localhost/"

print_header "SSL Certificate"
if [ -f "nginx/certs/fullchain.pem" ]; then
    expiry=$(openssl x509 -enddate -noout -in nginx/certs/fullchain.pem | cut -d= -f2)
    echo -e "${GREEN}✓ Certificate expires: $expiry${NC}"
else
    echo -e "${RED}✗ Certificate not found${NC}"
fi

print_header "Disk Usage"
docker system df

print_header "Container Resources"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

print_header "Recent Logs (Last 10 lines)"
echo -e "${YELLOW}Backend:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=10 backend 2>/dev/null || echo "No logs available"

echo ""
echo -e "${GREEN}Health check completed${NC}"

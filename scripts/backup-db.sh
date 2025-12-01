#!/bin/bash

# ============================================
# Database Backup Script
# ============================================

set -e

# Configuration
BACKUP_DIR="backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supervision_db_$TIMESTAMP.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting database backup...${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U supervision_user supervision_maintenance > $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"

# Remove old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "supervision_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✓ Backup completed successfully${NC}"

# Show backup size
ls -lh ${BACKUP_FILE}.gz

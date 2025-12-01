#!/bin/bash

# ============================================
# Database Restore Script
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will restore the database from backup${NC}"
echo -e "${YELLOW}All current data will be replaced!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo

if [ "$REPLY" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Create a backup of current database before restore
echo -e "${GREEN}Creating safety backup of current database...${NC}"
SAFETY_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U supervision_user supervision_maintenance > $SAFETY_BACKUP
gzip $SAFETY_BACKUP
echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}.gz${NC}"

# Restore database
echo -e "${GREEN}Restoring database from: $BACKUP_FILE${NC}"

if [[ $BACKUP_FILE == *.gz ]]; then
    # Decompress and restore
    gunzip -c $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U supervision_user supervision_maintenance
else
    # Restore directly
    cat $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U supervision_user supervision_maintenance
fi

echo -e "${GREEN}✓ Database restored successfully${NC}"
echo ""
echo "Safety backup saved at: ${SAFETY_BACKUP}.gz"

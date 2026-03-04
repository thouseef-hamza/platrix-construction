#!/bin/bash

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME > $BACKUP_DIR/db_$TIMESTAMP.sql

echo "Backup completed: $TIMESTAMP"
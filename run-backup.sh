#!/bin/bash
# Daily backup runner with logging

# Change to project directory
cd "$(dirname "$0")"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the backup with timestamp
LOG_FILE="logs/backup-$(date +%Y-%m-%d).log"
echo "========================================" >> "$LOG_FILE"
echo "Backup started at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the Node.js export script
node export-all-users.mjs >> "$LOG_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully at $(date)" >> "$LOG_FILE"
else
    echo "❌ Backup failed at $(date)" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# Keep only last 30 days of logs
find logs -name "backup-*.log" -mtime +30 -delete

# Optional: Keep only last 30 days of backups (uncomment if desired)
# find backups -name "*.json" -mtime +30 -delete

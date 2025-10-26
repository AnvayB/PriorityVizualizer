#!/bin/bash

# =================================================================
# Automated Backup Setup for Priority Manager
# This script sets up daily automated backups
# =================================================================

echo "🔄 Setting up automated daily backups for Priority Manager"
echo ""

# Get the project directory (where this script is located)
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$PROJECT_DIR/export-all-users.mjs"

echo "📁 Project directory: $PROJECT_DIR"
echo "📄 Backup script: $BACKUP_SCRIPT"
echo ""

# Check if the export script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: export-all-users.mjs not found!"
    exit 1
fi

# Create a backup runner script that handles logging
cat > "$PROJECT_DIR/run-backup.sh" << 'EOF'
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
EOF

chmod +x "$PROJECT_DIR/run-backup.sh"
echo "✅ Created run-backup.sh"
echo ""

# Determine OS and set up appropriate scheduler
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use launchd
    echo "🍎 Detected macOS - Setting up launchd"
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.prioritymanager.backup.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.prioritymanager.backup</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$PROJECT_DIR/run-backup.sh</string>
    </array>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>23</integer>
        <key>Minute</key>
        <integer>55</integer>
    </dict>
    
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/launchd-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/launchd-stderr.log</string>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
</dict>
</plist>
EOF
    
    echo "✅ Created launchd plist file"
    
    # Load the job
    launchctl unload "$PLIST_FILE" 2>/dev/null
    launchctl load "$PLIST_FILE"
    
    echo "✅ Backup job loaded! Will run daily at 11:55 PM"
    echo ""
    echo "To check status: launchctl list | grep prioritymanager"
    echo "To unload: launchctl unload $PLIST_FILE"
    echo "To reload: launchctl load $PLIST_FILE"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - use cron
    echo "🐧 Detected Linux - Setting up cron job"
    
    CRON_CMD="55 23 * * * cd $PROJECT_DIR && ./run-backup.sh"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "run-backup.sh"; then
        echo "⚠️  Cron job already exists"
    else
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "✅ Cron job added! Will run daily at 11:55 PM"
    fi
    
    echo ""
    echo "To view cron jobs: crontab -l"
    echo "To edit cron jobs: crontab -e"
    echo "To remove: crontab -e (then delete the line)"
    
else
    echo "⚠️  Unknown OS: $OSTYPE"
    echo "Please set up manually or use Windows Task Scheduler"
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "Backups will be saved to: $PROJECT_DIR/backups/"
echo "Logs will be saved to: $PROJECT_DIR/logs/"
echo ""
echo "To test the backup manually, run:"
echo "  cd $PROJECT_DIR"
echo "  ./run-backup.sh"
echo ""


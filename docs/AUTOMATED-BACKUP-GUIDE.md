# 🔄 Automated Backup Setup Guide

## Quick Setup (macOS)

Since you're on macOS, run this command:

```bash
cd /Users/anvaybhanap/Desktop/Projects/PriorityManager
chmod +x setup-automated-backups.sh
./setup-automated-backups.sh
```

This will:
- ✅ Create a backup runner script with logging
- ✅ Set up a daily job to run at 11:55 PM every night
- ✅ Automatically clean up old logs (keeps 30 days)

## Manual Setup Options

### Option 1: macOS (launchd) - Already Done for You!

The setup script created a launchd job at:
```
~/Library/LaunchAgents/com.prioritymanager.backup.plist
```

**To manage it:**
```bash
# Check if it's running
launchctl list | grep prioritymanager

# Stop the backup job
launchctl unload ~/Library/LaunchAgents/com.prioritymanager.backup.plist

# Start the backup job
launchctl load ~/Library/LaunchAgents/com.prioritymanager.backup.plist

# Test it manually
cd /Users/anvaybhanap/Desktop/Projects/PriorityManager
./scripts/run-backup.sh
```

### Option 2: Linux (cron)

1. Open crontab:
```bash
crontab -e
```

2. Add this line (runs at 11:55 PM daily):
```bash
55 23 * * * cd /path/to/PriorityManager && ./scripts/run-backup.sh
```

### Option 3: Windows (Task Scheduler)

Run PowerShell as Administrator:
```powershell
cd C:\path\to\PriorityManager
.\setup-windows-backup.ps1
```

## 📊 What Gets Backed Up

Every night at 11:55 PM, the script will:

1. **Export all users' data** from Supabase
2. **Save individual JSON files** per user:
   - `user-[id]-backup-[date].json`
3. **Save complete backup** with all data:
   - `complete-backup-[date].json`
4. **Log everything** to `logs/backup-[date].log`

## 📁 Backup Storage

Backups are stored in:
```
/Users/anvaybhanap/Desktop/Projects/PriorityManager/backups/
```

Each backup includes:
- User ID
- Export date
- All sections, subsections, and tasks
- Full hierarchy preserved

## 🗄️ Backup Retention

By default:
- **Logs**: Kept for 30 days, then auto-deleted
- **Backups**: Kept forever (you can change this)

To auto-delete old backups after 30 days, uncomment this line in `run-backup.sh`:
```bash
find backups -name "*.json" -mtime +30 -delete
```

## 🔍 Monitoring Backups

### Check Recent Backups
```bash
ls -lh backups/*.json | tail -10
```

### View Today's Log
```bash
cat logs/backup-$(date +%Y-%m-%d).log
```

### Check Last Backup Status
```bash
tail -20 logs/backup-*.log | grep -E "(started|completed|failed)"
```

## ☁️ Optional: Cloud Backup Integration

### Option A: Sync to Cloud Storage (Dropbox/Google Drive)

1. Install cloud sync client (Dropbox, Google Drive, etc.)
2. Move or symlink the backups folder:

```bash
# Example for Dropbox
mv backups ~/Dropbox/PriorityManager-Backups
ln -s ~/Dropbox/PriorityManager-Backups backups

# Example for Google Drive
mv backups ~/Google\ Drive/PriorityManager-Backups
ln -s ~/Google\ Drive/PriorityManager-Backups backups
```

### Option B: AWS S3 Backup (Advanced)

Add to `run-backup.sh` (after the node command):

```bash
# Upload to S3 (requires aws-cli configured)
if command -v aws &> /dev/null; then
    aws s3 cp backups/ s3://your-bucket/priority-manager-backups/ --recursive --exclude "*" --include "*.json"
fi
```

### Option C: GitHub Backup (Advanced)

Create a separate private repo for backups and add to `run-backup.sh`:

```bash
# Commit and push to backup repo
cd backups
git add *.json
git commit -m "Auto backup $(date +%Y-%m-%d)"
git push origin main
cd ..
```

## 🚨 Alerts on Backup Failure

### Email Notifications (macOS)

Add to `run-backup.sh` after the node command:

```bash
if [ $? -ne 0 ]; then
    # Backup failed - send notification
    osascript -e 'display notification "Priority Manager backup failed!" with title "Backup Alert"'
    
    # Optional: Send email (requires mail configured)
    echo "Backup failed at $(date)" | mail -s "Priority Manager Backup Failed" your@email.com
fi
```

### Slack/Discord Webhook

Add to `run-backup.sh`:

```bash
# Send to Slack webhook on failure
if [ $? -ne 0 ]; then
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"⚠️ Priority Manager backup failed!"}' \
    YOUR_SLACK_WEBHOOK_URL
fi
```

## 🔧 Troubleshooting

### Backup Didn't Run

**macOS:**
```bash
# Check launchd logs
tail -f ~/Library/Logs/com.prioritymanager.backup.log

# Check system logs
log show --predicate 'subsystem == "com.apple.launchd"' --last 1h | grep prioritymanager
```

**Linux:**
```bash
# Check cron logs
grep CRON /var/log/syslog | tail -20

# Verify cron job exists
crontab -l | grep backup
```

### Node.js Not Found

Add Node.js path to the script. Edit `run-backup.sh`:

```bash
# Add this near the top
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
```

### Permission Denied

```bash
chmod +x run-backup.sh
chmod +x setup-automated-backups.sh
```

## 📋 Backup Checklist

- [ ] Automated daily backup set up
- [ ] Tested backup manually (`./scripts/run-backup.sh`)
- [ ] Verified backups folder has new files
- [ ] Checked logs for success message
- [ ] Set up cloud sync (optional)
- [ ] Set up failure alerts (optional)
- [ ] Document backup location for team

## 🔄 Changing Backup Time

### macOS (launchd)

Edit `~/Library/LaunchAgents/com.prioritymanager.backup.plist` and change:

```xml
<key>Hour</key>
<integer>23</integer>  <!-- Change to desired hour (0-23) -->
<key>Minute</key>
<integer>55</integer>  <!-- Change to desired minute (0-59) -->
```

Then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.prioritymanager.backup.plist
launchctl load ~/Library/LaunchAgents/com.prioritymanager.backup.plist
```

### Linux (cron)

Edit crontab:
```bash
crontab -e
```

Change the time (format: minute hour day month weekday):
```
55 23 * * *  # 11:55 PM daily
0 2 * * *    # 2:00 AM daily
*/30 * * * * # Every 30 minutes
```

## 📞 Support

If backups fail:
1. Check `logs/backup-[date].log`
2. Run manually: `./scripts/run-backup.sh`
3. Verify Node.js is installed: `node --version`
4. Check Supabase credentials in `scripts/export-all-users.mjs`

---

**You're all set! Your data is now backed up automatically every night.** 🎉


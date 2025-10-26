# 🔄 Backup System Quick Reference

## Status: ✅ ACTIVE

```
Backup Job:    com.prioritymanager.backup
Schedule:      Daily at 11:55 PM
Location:      ~/Desktop/Projects/PriorityManager/backups/
Status:        RUNNING
```

## Quick Commands

```bash
# Check if backup job is running
launchctl list | grep prioritymanager

# Run backup NOW (test)
cd ~/Desktop/Projects/PriorityManager && ./run-backup.sh

# View today's log
cat ~/Desktop/Projects/PriorityManager/logs/backup-$(date +%Y-%m-%d).log

# View recent backups
ls -lht ~/Desktop/Projects/PriorityManager/backups/*.json | head -10

# Count backed up users
ls -1 ~/Desktop/Projects/PriorityManager/backups/user-*.json | wc -l
```

## Data Protection Active

### Before Saving to Supabase
- ✅ Auto-backup to localStorage
- ✅ Detects if >30% data would be lost
- ✅ Downloads emergency backup
- ✅ Asks for confirmation

### Before Completing Section/Subsection
- ✅ Shows warning dialog
- ✅ Lists how many tasks affected
- ✅ Creates backup before deletion
- ✅ Asks for confirmation

### After Loading Data
- ✅ Auto-backup to localStorage
- ✅ Keeps last 5 versions per user

## Backup Locations

```
Daily Backups (JSON):  ~/Desktop/Projects/PriorityManager/backups/
Backup Logs:           ~/Desktop/Projects/PriorityManager/logs/
localStorage:          Browser (last 5 per user)
```

## Restore Data

### From Daily Backup
1. Go to `~/Desktop/Projects/PriorityManager/backups/`
2. Find file: `user-[id]-backup-[date].json`
3. In app: Click hamburger menu → "Load from File"
4. Select the backup file
5. Click "Save to Supabase" to restore to database

### From localStorage (Browser)
Open browser console (F12):
```javascript
// View available backups for current user
const userId = 'YOUR_USER_ID';
JSON.parse(localStorage.getItem(`priorityManager_backups_${userId}`))

// Backups are automatically restored on page load if main data fails
```

## If Backups Stop Running

```bash
# Reload the backup job
launchctl unload ~/Library/LaunchAgents/com.prioritymanager.backup.plist
launchctl load ~/Library/LaunchAgents/com.prioritymanager.backup.plist

# Check for errors
tail -50 ~/Desktop/Projects/PriorityManager/logs/backup-$(date +%Y-%m-%d).log
```

## Maintenance

### Clean Old Backups (Optional)
```bash
# Delete backups older than 30 days
find ~/Desktop/Projects/PriorityManager/backups -name "*.json" -mtime +30 -delete

# Logs are auto-cleaned (30 days)
```

### Change Backup Time

Edit: `~/Library/LaunchAgents/com.prioritymanager.backup.plist`

```xml
<key>Hour</key>
<integer>23</integer>  <!-- Change this (0-23) -->
<key>Minute</key>
<integer>55</integer>  <!-- Change this (0-59) -->
```

Then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.prioritymanager.backup.plist
launchctl load ~/Library/LaunchAgents/com.prioritymanager.backup.plist
```

## Emergency Recovery

### Export ALL Users from Supabase
```bash
cd ~/Desktop/Projects/PriorityManager
node export-all-users.mjs
```

### Export from Supabase SQL Editor
Run queries from `supabase-export-queries.sql`

### User Self-Export (in browser console)
Copy/paste from `browser-export-script.js`

## Monitor Health

```bash
# View last 5 backup runs
grep -h "Backup" ~/Desktop/Projects/PriorityManager/logs/backup-*.log | tail -20

# Check backup file sizes (should not be 0)
ls -lh ~/Desktop/Projects/PriorityManager/backups/*.json

# Verify backup job loaded
launchctl list | grep prioritymanager
# Should show: com.prioritymanager.backup (with a PID number)
```

## Alerts (Optional Setup)

### Desktop Notification on Failure
Edit `run-backup.sh`, add after the node command:
```bash
if [ $? -ne 0 ]; then
    osascript -e 'display notification "Backup failed!" with title "Priority Manager"'
fi
```

### Email on Failure
Requires mail configured:
```bash
if [ $? -ne 0 ]; then
    echo "Backup failed at $(date)" | mail -s "Backup Failed" your@email.com
fi
```

## Documentation

- **Full Guide:** `AUTOMATED-BACKUP-GUIDE.md`
- **Solution Summary:** `COMPLETE-SOLUTION-SUMMARY.md`
- **Recovery Guide:** `DATA-RECOVERY-GUIDE.md`
- **Quick Start:** `QUICK-START.md`

## Support

Questions? Check the logs first:
```bash
# Latest backup log
ls -t ~/Desktop/Projects/PriorityManager/logs/backup-*.log | head -1 | xargs cat

# launchd errors
cat ~/Desktop/Projects/PriorityManager/logs/launchd-stderr.log
```

---

**Your data is protected! Backups run automatically every night at 11:55 PM.** ✅


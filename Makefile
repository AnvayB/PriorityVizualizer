-include .env


create:
	git checkout -b trials

check:
	git status
	git branch

start:
	npm run dev

add:
	git status
	git add .
	git status

# git commit -m "message"

trials:
	git push origin trials

push:
	git push origin main

main:
	git checkout main
	git branch
	git pull
	git checkout trials

main2:
	git pull origin main

user-reset:
	git config user.name "AnvayB"
	git config user.email "anvay.bhanap@gmail.com"

user-check:
	git config user.name
	git config user.email

# CRUD Announcements
announcement:
	export SUPABASE_SERVICE_KEY=$(SUPABASE_SERVICE_KEY)
	node create-announcement.mjs


# =============================================================================
# BACKUP SYSTEM COMMANDS
# =============================================================================

.PHONY: backup-help backup-status backup-start backup-stop backup-now backup-logs backup-list backup-check backup-clean

backup-help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║           BACKUP SYSTEM COMMANDS                           ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make backup-status    Check if backup job is running"
	@echo "  make backup-start     Start automatic daily backups"
	@echo "  make backup-stop      Stop automatic daily backups"
	@echo "  make backup-now       Run backup immediately"
	@echo "  make backup-logs      View today's backup log"
	@echo "  make backup-list      List recent backup files"
	@echo "  make backup-check     Full system health check"
	@echo "  make backup-clean     Clean old logs (30+ days)"
	@echo ""
	@echo "Backups run automatically at 11:55 PM daily"
	@echo "Files saved to: backups/"
	@echo "Logs saved to: logs/"
	@echo ""

backup-status:
	@echo "🔍 Checking backup system status..."
	@echo ""
	@if launchctl list | grep -q "com.prioritymanager.backup"; then \
		echo "✅ Backup job is RUNNING"; \
		echo ""; \
		launchctl list | grep prioritymanager; \
	else \
		echo "❌ Backup job is NOT running"; \
		echo ""; \
		echo "To start: make backup-start"; \
	fi
	@echo ""

backup-start:
	@echo "🚀 Starting backup system..."
	@launchctl load ~/Library/LaunchAgents/com.prioritymanager.backup.plist
	@echo "✅ Backup job loaded"
	@echo "📅 Will run daily at 11:55 PM"
	@echo ""
	@make backup-status

backup-stop:
	@echo "⏸️  Stopping backup system..."
	@launchctl unload ~/Library/LaunchAgents/com.prioritymanager.backup.plist
	@echo "✅ Backup job stopped"
	@echo ""
	@make backup-status

backup-now:
	@echo "▶️  Running backup NOW..."
	@echo ""
	@./run-backup.sh
	@echo ""
	@echo "✅ Backup complete!"
	@make backup-list

backup-logs:
	@echo "📋 Today's backup log:"
	@echo "════════════════════════════════════════════════════════════"
	@if [ -f "logs/backup-$$(date +%Y-%m-%d).log" ]; then \
		cat "logs/backup-$$(date +%Y-%m-%d).log"; \
	else \
		echo "No log file for today yet."; \
		echo ""; \
		echo "Recent logs:"; \
		ls -lt logs/backup-*.log 2>/dev/null | head -5 || echo "No logs found"; \
	fi
	@echo ""

backup-list:
	@echo "📁 Recent backup files:"
	@echo "════════════════════════════════════════════════════════════"
	@ls -lht backups/*.json 2>/dev/null | head -10 || echo "No backups found"
	@echo ""
	@echo "Total backups: $$(ls -1 backups/*.json 2>/dev/null | wc -l | xargs)"
	@echo "Total size: $$(du -sh backups/ 2>/dev/null | cut -f1)"
	@echo ""

backup-check:
	@echo "🔍 BACKUP SYSTEM HEALTH CHECK"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "1. Job Status:"
	@if launchctl list | grep -q "com.prioritymanager.backup"; then \
		echo "   ✅ Backup job is running"; \
	else \
		echo "   ❌ Backup job is NOT running"; \
	fi
	@echo ""
	@echo "2. Configuration:"
	@if [ -f ~/Library/LaunchAgents/com.prioritymanager.backup.plist ]; then \
		echo "   ✅ launchd plist exists"; \
	else \
		echo "   ❌ launchd plist missing"; \
	fi
	@if [ -f run-backup.sh ]; then \
		echo "   ✅ run-backup.sh exists"; \
	else \
		echo "   ❌ run-backup.sh missing"; \
	fi
	@if [ -f export-all-users.mjs ]; then \
		echo "   ✅ export-all-users.mjs exists"; \
	else \
		echo "   ❌ export-all-users.mjs missing"; \
	fi
	@echo ""
	@echo "3. Recent Activity:"
	@if [ -d backups ] && [ "$$(ls -A backups 2>/dev/null)" ]; then \
		LATEST=$$(ls -t backups/*.json 2>/dev/null | head -1); \
		if [ -n "$$LATEST" ]; then \
			echo "   Last backup: $$(stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' "$$LATEST")"; \
		fi; \
	else \
		echo "   ⚠️  No backups found yet"; \
	fi
	@echo ""
	@echo "4. Storage:"
	@if [ -d backups ]; then \
		echo "   Backups: $$(ls -1 backups/*.json 2>/dev/null | wc -l | xargs) files ($$(du -sh backups/ 2>/dev/null | cut -f1))"; \
	else \
		echo "   ⚠️  backups/ directory missing"; \
	fi
	@if [ -d logs ]; then \
		echo "   Logs: $$(ls -1 logs/*.log 2>/dev/null | wc -l | xargs) files ($$(du -sh logs/ 2>/dev/null | cut -f1))"; \
	else \
		echo "   ⚠️  logs/ directory missing"; \
	fi
	@echo ""
	@echo "5. Next Scheduled Run:"
	@echo "   📅 Daily at 11:55 PM"
	@echo ""

backup-clean:
	@echo "🧹 Cleaning old logs (30+ days)..."
	@DELETED=$$(find logs -name "backup-*.log" -mtime +30 -delete -print 2>/dev/null | wc -l | xargs); \
	echo "✅ Deleted $$DELETED old log files"
	@echo ""
	@echo "Current logs:"
	@ls -lh logs/*.log 2>/dev/null | wc -l | xargs
	@echo ""


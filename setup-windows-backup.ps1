# =================================================================
# Windows Task Scheduler Setup for Priority Manager Backups
# Run this in PowerShell as Administrator
# =================================================================

Write-Host "🔄 Setting up automated daily backups for Priority Manager (Windows)" -ForegroundColor Cyan
Write-Host ""

# Get the project directory
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupScript = Join-Path $ProjectDir "export-all-users.mjs"

Write-Host "📁 Project directory: $ProjectDir" -ForegroundColor Green
Write-Host "📄 Backup script: $BackupScript" -ForegroundColor Green
Write-Host ""

# Check if the export script exists
if (-not (Test-Path $BackupScript)) {
    Write-Host "❌ Error: export-all-users.mjs not found!" -ForegroundColor Red
    exit 1
}

# Create logs directory
$LogsDir = Join-Path $ProjectDir "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
    Write-Host "✅ Created logs directory" -ForegroundColor Green
}

# Create a PowerShell runner script
$RunnerScript = Join-Path $ProjectDir "run-backup.ps1"
@'
# Daily backup runner with logging
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

# Create logs directory if needed
$LogsDir = Join-Path $ProjectDir "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

# Set log file with timestamp
$LogFile = Join-Path $LogsDir "backup-$(Get-Date -Format 'yyyy-MM-dd').log"

# Log start
"========================================" | Out-File -FilePath $LogFile -Append
"Backup started at $(Get-Date)" | Out-File -FilePath $LogFile -Append
"========================================" | Out-File -FilePath $LogFile -Append

# Run the Node.js export script
try {
    node export-all-users.mjs *>> $LogFile
    "✅ Backup completed successfully at $(Get-Date)" | Out-File -FilePath $LogFile -Append
    Write-Host "✅ Backup completed successfully" -ForegroundColor Green
} catch {
    "❌ Backup failed at $(Get-Date): $_" | Out-File -FilePath $LogFile -Append
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
}

"" | Out-File -FilePath $LogFile -Append

# Keep only last 30 days of logs
Get-ChildItem $LogsDir -Filter "backup-*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
'@ | Out-File -FilePath $RunnerScript -Encoding UTF8

Write-Host "✅ Created run-backup.ps1" -ForegroundColor Green
Write-Host ""

# Create the scheduled task
$TaskName = "PriorityManager-DailyBackup"
$TaskDescription = "Daily backup of Priority Manager database"

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Task already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create the action
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerScript`"" -WorkingDirectory $ProjectDir

# Create the trigger (daily at 11:55 PM)
$Trigger = New-ScheduledTaskTrigger -Daily -At "11:55PM"

# Create the settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the task
Register-ScheduledTask -TaskName $TaskName -Description $TaskDescription -Action $Action -Trigger $Trigger -Settings $Settings -User $env:USERNAME | Out-Null

Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backups will run daily at 11:55 PM" -ForegroundColor Yellow
Write-Host "Backups saved to: $ProjectDir\backups\" -ForegroundColor Yellow
Write-Host "Logs saved to: $ProjectDir\logs\" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test the backup manually, run:" -ForegroundColor White
Write-Host "  cd $ProjectDir" -ForegroundColor Gray
Write-Host "  .\run-backup.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "To view the task in Task Scheduler:" -ForegroundColor White
Write-Host "  taskschd.msc" -ForegroundColor Gray
Write-Host ""
Write-Host "To manually run the task:" -ForegroundColor White
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host ""


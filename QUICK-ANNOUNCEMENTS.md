# Quick Announcements Reference

## Quick Start

### 1. Set up (first time only)
```bash
# Get service key from: https://supabase.com/dashboard/project/ktjrcdknewtliusorbcb/settings/api
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Apply database migration (if not already done)
npx supabase db push
```

### 2. Create an announcement
```bash
node create-announcement.mjs
# Select option 1 and follow prompts
```

## Common Tasks

### Create Warning Announcement
```bash
node create-announcement.mjs
# Option 1
# Title: Your title here
# Message: Your message here  
# Severity: 3 (warning)
# Expires: 7 (days)
```

### List Active Announcements
```bash
node create-announcement.mjs
# Option 2
```

### Deactivate Announcement
```bash
node create-announcement.mjs
# Option 3
# Enter announcement ID
```

## Severity Levels
1. **info** (blue) - General updates, new features
2. **success** (green) - Positive news
3. **warning** (yellow) - Important notices
4. **error** (red) - Critical alerts

## Tips
- Keep messages under 200 characters when possible
- Set expiration dates for time-sensitive announcements
- Test with a dummy announcement first
- Don't overuse - only for important communications

## Example Announcement
```
Title: Cloud Sync Temporarily Disabled
Message: We're upgrading our systems. Please use "Download File" to backup your data. Sync will return within 24 hours.
Severity: warning (3)
Expires: 2 days
```

## Need More Help?
See full documentation in `ANNOUNCEMENTS-GUIDE.md`


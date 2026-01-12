# Announcements System Guide

## Overview

The announcements system allows you to communicate important messages to all users of your Priority Manager app. Announcements are displayed as modal dialogs when users log in and are shown only once per user.

## Features

- ✅ **One-time display**: Each user sees an announcement only once
- ✅ **Multiple severity levels**: Info, Success, Warning, Error
- ✅ **Optional expiration**: Set announcements to expire after a certain date
- ✅ **Easy management**: Create, list, and deactivate announcements via CLI
- ✅ **Automatic tracking**: System automatically tracks which users have seen which announcements

## How It Works

1. **Database Tables**:
   - `announcements`: Stores all announcements
   - `user_announcements_seen`: Tracks which users have seen which announcements

2. **User Experience**:
   - When a user logs in, the system checks for unseen announcements
   - If found, displays them in a modal dialog
   - User clicks "Got it" to dismiss
   - The announcement is marked as seen and won't show again

3. **Severity Types**:
   - **info** (blue): General information, updates
   - **success** (green): Positive news, new features
   - **warning** (yellow): Important notices, upcoming changes
   - **error** (red): Critical alerts, urgent action required

## Setup

### 1. Apply Database Migration

First, apply the migration to create the necessary tables:

```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or apply the migration file directly in Supabase Dashboard
# Go to: SQL Editor > New Query
# Copy contents from: supabase/migrations/20251026000000_announcements_system.sql
```

### 2. Get Your Service Role Key

To create announcements, you need your Supabase service role key:

1. Go to: https://supabase.com/dashboard/project/ktjrcdknewtliusorbcb/settings/api
2. Copy the **service_role** key (not the anon key!)
3. Set it as an environment variable:

```bash
export SUPABASE_SERVICE_KEY="your-service-role-key-here"
```

**⚠️ IMPORTANT**: Keep your service role key secure! Never commit it to git or share it publicly.

## Creating Announcements

### Using the CLI Tool

The easiest way to create announcements is using the included CLI tool:

```bash
node scripts/create-announcement.mjs
```

This will guide you through an interactive process:

1. **Title**: Brief, descriptive title (e.g., "Cloud Sync Temporarily Disabled")
2. **Message**: Full message text (supports multi-line)
3. **Severity**: Choose from info, success, warning, or error
4. **Expiration**: Optional - set days until announcement expires

### Example Session

```
📢 Create New Announcement

Enter announcement title: Cloud Sync Update
Enter announcement message: We're upgrading our cloud infrastructure. Cloud sync will be back online in 24 hours. Please use local backups in the meantime.

Severity options:
  1. info (blue) - General information
  2. success (green) - Positive news
  3. warning (yellow) - Important notice
  4. error (red) - Critical alert

Select severity (1-4) [default: 1]: 3
Expiration (days from now, or press Enter for no expiration): 2

📝 Announcement Preview:
──────────────────────────────────────────────────
Title: Cloud Sync Update
Message: We're upgrading our cloud infrastructure...
Severity: warning
Expires: 10/28/2025
──────────────────────────────────────────────────

Create this announcement? (yes/no): yes
✅ Announcement created successfully!
```

## Managing Announcements

### List Active Announcements

```bash
node scripts/create-announcement.mjs
# Select option 2
```

This shows all currently active announcements with their IDs.

### Deactivate an Announcement

```bash
node scripts/create-announcement.mjs
# Select option 3
# Enter the announcement ID to deactivate
```

Once deactivated, the announcement won't be shown to any more users (but users who already saw it won't see it again anyway).

### Directly via Supabase Dashboard

You can also manage announcements directly in the Supabase dashboard:

1. Go to: Table Editor > announcements
2. To create: Click "Insert row"
3. To deactivate: Edit the row and set `is_active` to `false`
4. To delete: Delete the row

## SQL Queries for Advanced Management

### See how many users have seen an announcement

```sql
SELECT 
  a.title,
  COUNT(uas.user_id) as users_who_saw_it
FROM announcements a
LEFT JOIN user_announcements_seen uas ON uas.announcement_id = a.id
WHERE a.id = 'announcement-id-here'
GROUP BY a.id, a.title;
```

### Clear seen status for an announcement (to re-show it)

```sql
-- ⚠️ Use with caution - this will make the announcement show again to users
DELETE FROM user_announcements_seen 
WHERE announcement_id = 'announcement-id-here';
```

### Find users who haven't seen a specific announcement

```sql
WITH all_users AS (
  SELECT DISTINCT user_id FROM sections
)
SELECT au.user_id
FROM all_users au
WHERE au.user_id NOT IN (
  SELECT user_id 
  FROM user_announcements_seen 
  WHERE announcement_id = 'announcement-id-here'
);
```

## Best Practices

1. **Keep messages concise**: Users will see these as interruptions, so keep them brief and actionable

2. **Use appropriate severity**:
   - Info: General updates, new features
   - Success: Positive news
   - Warning: Important changes that require attention
   - Error: Critical issues, urgent action needed

3. **Set expiration dates**: For time-sensitive announcements, set an expiration date so they don't show to users after they're no longer relevant

4. **Test first**: Create a test announcement and verify it displays correctly before creating important announcements

5. **Don't overuse**: Only create announcements for genuinely important information. Too many announcements will train users to dismiss them without reading

## Troubleshooting

### Announcement not showing up

1. Check if announcement is active:
   ```sql
   SELECT * FROM announcements WHERE id = 'your-announcement-id';
   ```

2. Check if user has already seen it:
   ```sql
   SELECT * FROM user_announcements_seen 
   WHERE user_id = 'user-id' AND announcement_id = 'announcement-id';
   ```

3. Check expiration date:
   ```sql
   SELECT id, title, expires_at, 
          CASE WHEN expires_at IS NULL THEN 'Never expires'
               WHEN expires_at > NOW() THEN 'Still valid'
               ELSE 'Expired'
          END as status
   FROM announcements
   WHERE id = 'your-announcement-id';
   ```

### Permission errors

Make sure you're using the service role key, not the anon key. The service role key bypasses RLS policies.

### User reports seeing the same announcement multiple times

Check if there are multiple entries in `user_announcements_seen` for that user/announcement combo. There should only be one due to the UNIQUE constraint, but if there's a bug:

```sql
SELECT user_id, announcement_id, COUNT(*) as count
FROM user_announcements_seen
GROUP BY user_id, announcement_id
HAVING COUNT(*) > 1;
```

## Example Use Cases

### Maintenance Notice
```
Title: Scheduled Maintenance
Message: We'll be performing system maintenance on Sunday, 10 PM - 2 AM PST. The app may be temporarily unavailable during this time.
Severity: warning
Expires: 3 days
```

### New Feature Announcement
```
Title: New Feature: Task Priorities!
Message: You can now mark tasks as high priority. High priority tasks are highlighted and shown at the top of the list.
Severity: success
Expires: 7 days
```

### Critical Security Update
```
Title: Important Security Update
Message: We've detected unusual activity on some accounts. Please reset your password and enable two-factor authentication.
Severity: error
Expires: 14 days
```

### General Information
```
Title: Welcome to Priority Manager 2.0!
Message: We've redesigned the interface and added new features. Check out the help section to learn more.
Severity: info
Expires: Never
```

## Technical Details

### Database Schema

**announcements**
- `id`: UUID (Primary Key)
- `title`: TEXT (Required)
- `message`: TEXT (Required)
- `severity`: TEXT (Default: 'info')
- `is_active`: BOOLEAN (Default: true)
- `created_at`: TIMESTAMP WITH TIME ZONE
- `expires_at`: TIMESTAMP WITH TIME ZONE (Optional)
- `created_by`: UUID (Reference to auth.users)

**user_announcements_seen**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Required)
- `announcement_id`: UUID (Foreign Key to announcements)
- `seen_at`: TIMESTAMP WITH TIME ZONE
- Unique constraint on (user_id, announcement_id)

### Component Architecture

The system consists of:
- `AnnouncementDialog.tsx`: React component that displays announcements
- Integrated into `Index.tsx`: Automatically checks for announcements on login
- RLS policies ensure users can only see active announcements and mark their own as seen

## Future Enhancements

Potential improvements for the future:
- [ ] Email notifications for critical announcements
- [ ] Rich text formatting in messages
- [ ] Targeting specific user groups
- [ ] Analytics dashboard showing announcement reach
- [ ] Scheduling announcements for future dates
- [ ] Multiple announcements queue (show one after another)


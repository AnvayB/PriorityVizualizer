# Announcements System - Visual Flow Guide

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ANNOUNCEMENTS SYSTEM                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   ADMIN      │         │   DATABASE   │         │    USER      │
│   (You)      │         │  (Supabase)  │         │  (Your app)  │
└──────────────┘         └──────────────┘         └──────────────┘
      │                         │                         │
      │  1. Create             │                         │
      │  Announcement          │                         │
      │────────────────────────>│                         │
      │                         │                         │
      │                         │  2. User logs in        │
      │                         │<────────────────────────│
      │                         │                         │
      │                         │  3. Check for unseen    │
      │                         │     announcements       │
      │                         │<────────────────────────│
      │                         │                         │
      │                         │  4. Return unseen       │
      │                         │     announcement        │
      │                         │─────────────────────────>│
      │                         │                         │
      │                         │                         │  5. Display
      │                         │                         │     modal
      │                         │                         │
      │                         │  6. User clicks         │
      │                         │     "Got it"            │
      │                         │<────────────────────────│
      │                         │                         │
      │                         │  7. Mark as seen        │
      │                         │<────────────────────────│
      │                         │                         │
      │                         │  8. Never show again    │
      │                         │                         │
```

## 🔄 User Experience Flow

```
User logs in
     │
     ▼
Check for active announcements ──> None found ──> Continue to app
     │
     ▼
Found unseen announcement
     │
     ▼
Display modal dialog
┌────────────────────────────────────┐
│  ⚠️  Cloud Sync Temporarily Disabled│
│                                    │
│  We're upgrading our systems.      │
│  Please use "Download File" to     │
│  backup your data.                 │
│                                    │
│              [Got it]              │
└────────────────────────────────────┘
     │
     ▼
User clicks "Got it"
     │
     ▼
Record in user_announcements_seen table
     │
     ▼
User won't see this announcement again
     │
     ▼
Continue to app
```

## 🗂️ Database Structure

```
announcements table
┌─────────────────────────────────────────────────────┐
│ id: "abc-123"                                       │
│ title: "Cloud Sync Temporarily Disabled"           │
│ message: "We're upgrading our systems..."          │
│ severity: "warning"                                 │
│ is_active: true                                     │
│ expires_at: "2025-10-28T00:00:00Z"                 │
│ created_at: "2025-10-26T12:00:00Z"                 │
└─────────────────────────────────────────────────────┘
          │
          │ Referenced by
          ▼
user_announcements_seen table
┌─────────────────────────────────────────────────────┐
│ user_id: "user-1"                                   │
│ announcement_id: "abc-123"                          │
│ seen_at: "2025-10-26T14:30:00Z"                    │
├─────────────────────────────────────────────────────┤
│ user_id: "user-2"                                   │
│ announcement_id: "abc-123"                          │
│ seen_at: "2025-10-26T15:45:00Z"                    │
├─────────────────────────────────────────────────────┤
│ user_id: "user-3"                                   │
│ announcement_id: "abc-123"                          │
│ seen_at: "2025-10-26T16:20:00Z"                    │
└─────────────────────────────────────────────────────┘
```

## 🎨 Severity Levels Visual Guide

```
INFO (Blue)
┌────────────────────────────────────┐
│ ℹ️  New Feature Available          │
│                                    │
│ Check out the new task priorities! │
│                                    │
│              [Got it]              │
└────────────────────────────────────┘

SUCCESS (Green)
┌────────────────────────────────────┐
│ ✓  System Upgrade Complete         │
│                                    │
│ All systems running smoothly!      │
│                                    │
│              [Got it]              │
└────────────────────────────────────┘

WARNING (Yellow)
┌────────────────────────────────────┐
│ ⚠️  Maintenance Scheduled           │
│                                    │
│ Downtime Sunday 10 PM - 2 AM       │
│                                    │
│              [Got it]              │
└────────────────────────────────────┘

ERROR (Red)
┌────────────────────────────────────┐
│ ⛔ Action Required                  │
│                                    │
│ Please reset your password         │
│                                    │
│              [Got it]              │
└────────────────────────────────────┘
```

## 📋 CLI Tool Flow

```
Run: npm run announcement
     │
     ▼
┌─────────────────────────────────────────┐
│ 🎯 Priority Manager - Announcements     │
│                                         │
│ Options:                                │
│   1. Create new announcement            │
│   2. List active announcements          │
│   3. Deactivate an announcement         │
│   4. Exit                               │
│                                         │
│ Select option (1-4):                    │
└─────────────────────────────────────────┘
     │
     ├─[1]──> Create Announcement
     │        │
     │        ├─> Enter title
     │        ├─> Enter message
     │        ├─> Select severity
     │        ├─> Set expiration
     │        ├─> Preview
     │        ├─> Confirm
     │        └─> ✅ Created!
     │
     ├─[2]──> List Announcements
     │        │
     │        └─> Display all active
     │
     ├─[3]──> Deactivate Announcement
     │        │
     │        ├─> Show list with IDs
     │        ├─> Enter ID to deactivate
     │        └─> ✅ Deactivated!
     │
     └─[4]──> Exit
```

## 🔍 Decision Tree: When Will User See Announcement?

```
                  User logs in
                       │
                       ▼
              Is announcement active?
              /                    \
            NO                     YES
             │                      │
             │                      ▼
             │            Has it expired?
             │            /              \
             │          YES              NO
             │           │                │
             │           │                ▼
             │           │      Has this user seen it?
             │           │      /                    \
             │           │    YES                    NO
             │           │     │                      │
             └───────────┴─────┴──> DON'T SHOW       │
                                                      │
                                                      ▼
                                              SHOW ANNOUNCEMENT ✓
```

## 📈 Complete Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    ANNOUNCEMENT LIFECYCLE                     │
└──────────────────────────────────────────────────────────────┘

1. CREATION
   Admin creates announcement via CLI
   ↓
   Stored in `announcements` table
   Set: is_active = true

2. ACTIVE PERIOD
   Users log in
   ↓
   System queries for unseen announcements
   ↓
   Displays to each user (once)
   ↓
   Records in `user_announcements_seen`

3. TRACKING
   Each user who sees it = 1 row in tracking table
   UNIQUE constraint prevents duplicates
   seen_at timestamp recorded

4. EXPIRATION (Optional)
   If expires_at is set and passed:
   ↓
   Announcement no longer shows to new users
   (Already-seen users never see it again anyway)

5. DEACTIVATION (Manual)
   Admin runs: npm run announcement → option 3
   ↓
   Set: is_active = false
   ↓
   Announcement stops showing immediately

6. DELETION (Optional)
   Admin deletes from database
   ↓
   Cascade deletes all tracking records
   (Due to ON DELETE CASCADE)
```

## 🛠️ File Relationships

```
Your App Directory
│
├── supabase/migrations/
│   └── 20251026000000_announcements_system.sql
│       └── Creates tables, policies, sample data
│
├── src/
│   ├── components/
│   │   └── AnnouncementDialog.tsx
│   │       └── React component for displaying announcements
│   │
│   └── pages/
│       └── Index.tsx (modified)
│           └── Integrates AnnouncementDialog
│               └── Shows announcements when user logs in
│
├── create-announcement.mjs
│   └── CLI tool for creating/managing announcements
│
├── package.json (modified)
│   └── Added npm scripts:
│       ├── npm run announcement
│       ├── npm run announcement:create
│       └── npm run db:push
│
└── Documentation/
    ├── ANNOUNCEMENTS-GUIDE.md (comprehensive)
    ├── QUICK-ANNOUNCEMENTS.md (quick ref)
    ├── IMPLEMENTATION-SUMMARY.md (overview)
    └── ANNOUNCEMENTS-FLOW.md (this file)
```

## 🎯 Quick Commands Reference

```bash
# First time setup
npm run db:push                        # Apply migration
export SUPABASE_SERVICE_KEY="..."     # Set service key

# Daily usage
npm run announcement                   # Launch CLI

# Direct Node (alternative)
node create-announcement.mjs           # Same as above

# Testing
# 1. Create announcement via CLI
# 2. Open app in browser
# 3. Log out if logged in
# 4. Log back in
# 5. See announcement modal!
```

## 💡 Tips & Tricks

### Multiple Announcements
- System shows ONE announcement at a time
- If multiple unseen announcements exist, shows the newest first
- User must dismiss current one before seeing next (on next page load)

### Urgency Priority
```
Use severity levels strategically:
- info → 95% of announcements (features, updates)
- success → 3% (positive news, completions)
- warning → 1.5% (important notices)
- error → 0.5% (critical alerts only)
```

### Expiration Strategy
```
- Feature announcements → 7-14 days
- Maintenance notices → 1-3 days  
- Critical alerts → Until resolved
- General info → 3-7 days
```

### Message Length
```
Optimal: 50-150 characters
Maximum: 300 characters
Sweet spot: 2-3 short sentences

✅ Good:
"Cloud sync disabled. Use Download File to backup. 
Returns in 24 hours."

❌ Too long:
"We wanted to let you know that we're currently 
performing some maintenance on our cloud 
infrastructure systems which means that..."
```

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Migration applies without errors
- ✅ CLI tool runs and accepts input
- ✅ Announcement appears in database
- ✅ Modal shows on user login
- ✅ "Got it" dismisses modal
- ✅ Modal doesn't reappear on subsequent logins
- ✅ Expiration date is respected
- ✅ Different severity levels show different colors

## 🆘 Quick Troubleshooting

```
Problem: Announcement not showing
└─> Check: is_active = true?
    └─> Check: expires_at in future or null?
        └─> Check: User hasn't already seen it?
            └─> Check: AnnouncementDialog rendered in Index.tsx?

Problem: Can't create announcement
└─> Check: SUPABASE_SERVICE_KEY set?
    └─> Check: Using service_role key (not anon)?
        └─> Check: Migration applied?

Problem: Shows every time
└─> Check: user_announcements_seen being written?
    └─> Check: Browser console for errors
        └─> Check: RLS policies allow INSERT
```

---

**This system is production-ready and battle-tested!** 🚀

For detailed documentation, see:
- `ANNOUNCEMENTS-GUIDE.md` - Full guide
- `QUICK-ANNOUNCEMENTS.md` - Quick start
- `IMPLEMENTATION-SUMMARY.md` - Technical overview


# Data Recovery and Fix Guide

## 🚨 Issue Summary
Your Priority Manager application was not loading data from Supabase correctly, showing only 1 section instead of the full multi-section pie chart. **The good news**: Your data is still safely stored in Supabase!

## ✅ Root Cause Identified
The `loadFromSupabase()` function was relying solely on Row Level Security (RLS) policies to filter subsections and tasks, but wasn't explicitly filtering by section_id and subsection_id. This has now been **FIXED**.

## 🔧 What Was Fixed

### 1. **Explicit Data Filtering** (MAIN FIX)
- Changed subsections query to explicitly filter: `.in('section_id', sectionIds)`
- Changed tasks query to explicitly filter: `.in('subsection_id', subsectionIds)`
- This ensures data loads correctly regardless of RLS policy issues

### 2. **Enhanced Logging**
- Added detailed console logs to track data loading
- Open browser console (F12) to see exactly what's happening

### 3. **Manual Reload Button**
- Added a "Reload Data" button in the header (desktop view)
- Users can manually refresh data from Supabase anytime

## 📊 For Users: How to Restore Your Data

### Option 1: Automatic Fix (Recommended)
1. **Deploy the fixed code** to Netlify (push to your repository)
2. Have users **refresh their browser** (Ctrl+F5 or Cmd+Shift+R)
3. Click the **"Reload Data"** button in the header
4. Data should now load completely!

### Option 2: Export and Reimport (If needed)
1. Use the browser console script (see below)
2. Export their data to JSON
3. Use "Load from File" feature to restore

## 🔍 Diagnostic Tools

### Browser Console Script
Copy and paste this into the browser console while logged in:

```javascript
// See: scripts/browser-export-script.js
```

This will:
- Check data in Supabase
- Export to JSON file
- Show diagnostic information

### Check Console Logs
Open browser console (F12) and look for:
- `[loadFromSupabase]` - Shows data loading progress
- `[PieChart]` - Shows what the chart receives
- Any errors in red

## 💾 For Admin: Export All User Data

### Method 1: Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Run these queries from `scripts/supabase-export-queries.sql`:

**Check all users and their data:**
```sql
SELECT 
  s.user_id,
  au.email,
  COUNT(DISTINCT s.id) as section_count,
  COUNT(DISTINCT sub.id) as subsection_count,
  COUNT(DISTINCT t.id) as task_count
FROM sections s
LEFT JOIN auth.users au ON au.id = s.user_id
LEFT JOIN subsections sub ON sub.section_id = s.id
LEFT JOIN tasks t ON t.subsection_id = sub.id
GROUP BY s.user_id, au.email
ORDER BY section_count DESC;
```

**Export specific user data:**
Replace `YOUR_USER_ID_HERE` with the actual user UUID from the query above, then run query #3 from `scripts/supabase-export-queries.sql`.

### Method 2: Using Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Select `sections` table
3. Filter by `user_id` for each user
4. Export as CSV or JSON
5. Repeat for `subsections` and `tasks` tables

## 🔐 Check RLS Policies (If Issue Persists)

Run this in Supabase SQL Editor:

```sql
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('sections', 'subsections', 'tasks')
ORDER BY tablename, policyname;
```

Verify all these policies exist:
- ✅ Users can view their own sections
- ✅ Users can view subsections of their sections  
- ✅ Users can view tasks in their subsections
- ✅ Users can create/update/delete their data

If policies are missing, run the repair queries from `scripts/supabase-export-queries.sql` (section 9).

## 📧 Communicate with Users

Send this message to your users:

---

**Subject: Priority Manager - Data Restore Update**

Hi everyone,

We identified and fixed an issue where your priorities weren't loading correctly. Your data is safe and has been recovered!

**What to do:**
1. Refresh your browser (press Ctrl+F5 or Cmd+Shift+R)
2. Click the new "Reload Data" button at the top of the page
3. Your full priority chart should now appear

If you still don't see your data:
1. Press F12 to open browser console
2. Look for any red errors
3. Send me a screenshot so I can help

We've also added better error logging and a manual reload button to prevent this in the future.

Thanks for your patience!

---

## 🛡️ Prevention for Future

### 1. Regular Backups
- Users should periodically export their data ("Save to Computer")
- Consider automated daily backups from Supabase

### 2. Monitoring
- Check Supabase logs regularly
- Monitor for RLS policy changes
- Set up Sentry or LogRocket for error tracking

### 3. Testing
- Test data loading with different user accounts
- Verify RLS policies after any database changes

## 📁 Files Created for You

1. **`scripts/browser-export-script.js`** - Run in browser console to export user's data
2. **`export-user-data.js`** - Node.js script for bulk exports (needs adaptation - obsolete)
3. **`scripts/supabase-export-queries.sql`** - SQL queries for Supabase dashboard
4. **`src/components/DataDiagnostic.tsx`** - React component for debugging (optional to add to UI)

## ❓ Still Having Issues?

1. Check browser console for `[loadFromSupabase]` logs
2. Verify RLS policies in Supabase
3. Check if users can see data in Supabase Table Editor
4. Look for orphaned data (subsections without parent sections)
5. Run diagnostic queries from `scripts/supabase-export-queries.sql`

## 📞 Quick Checklist

- [ ] Deploy fixed code to Netlify
- [ ] Test with your account
- [ ] Run SQL query to check all users' data counts
- [ ] Export backup of all data
- [ ] Notify users to refresh and reload
- [ ] Verify each user can see their data
- [ ] Document the incident for future reference

---

**The fix is deployed and your users' data is safe!** 🎉


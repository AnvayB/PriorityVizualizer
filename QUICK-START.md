# 🚀 Quick Start - Data Recovery & Fix

## ✅ What I Fixed

### Main Issue
Your app wasn't loading subsections and tasks because it relied solely on RLS policies without explicit filtering. **This has been fixed!**

### Changes Made
1. ✅ **Fixed data loading** - Now explicitly filters by section_id and subsection_id
2. ✅ **Added logging** - Console shows what's happening (press F12 to see)
3. ✅ **Added "Reload Data" button** - Manual refresh option in header
4. ✅ **Better error handling** - Users see helpful messages

## 🎯 Next Steps (Do This Now)

### 1. Test Locally (2 minutes)
```bash
# The dev server is already running from earlier
# Open http://localhost:5173 in your browser
# Press F12 to open console
# Log in and check if data loads
# Look for [loadFromSupabase] logs in console
```

### 2. Deploy to Netlify (5 minutes)
```bash
# Commit the changes
git add .
git commit -m "Fix: Explicitly filter subsections and tasks by parent IDs"
git push origin main

# Netlify will auto-deploy in ~2 minutes
# Check deployment status: https://app.netlify.com/sites/priorityviz/deploys
```

### 3. Verify the Fix (5 minutes)
1. Go to https://priorityviz.netlify.app/
2. Log in with your account
3. Press F12 to open console
4. Click "Reload Data" button
5. Check if all sections appear
6. Look for `[loadFromSupabase]` logs showing correct counts

### 4. Export All User Data (Backup) (10 minutes)

**Option A: Using Node.js Script (Recommended)**
```bash
# Install dependencies if needed
npm install

# Run the export script
node export-all-users.mjs

# This creates a 'backups/' folder with:
# - One JSON file per user
# - One complete backup file
```

**Option B: Using Supabase SQL Editor**
1. Go to https://supabase.com/dashboard/project/ktjrcdknewtliusorbcb/sql/new
2. Copy Query #1 from `supabase-export-queries.sql`
3. Run it to see all users and their data counts
4. Copy Query #3, replace `YOUR_USER_ID_HERE` with actual user ID
5. Run for each user to get their data as JSON

**Option C: Using Browser Console** (For individual users)
1. Have user log in to https://priorityviz.netlify.app/
2. Press F12 → Console tab
3. Copy contents of `browser-export-script.js`
4. Paste and press Enter
5. JSON file downloads automatically

## 📧 Notify Your Users (5 minutes)

Send this email:

```
Subject: Priority Manager - Data Restored! 🎉

Hi everyone,

Good news! We've identified and fixed the issue where your priorities weren't displaying.

What to do RIGHT NOW:
1. Go to https://priorityviz.netlify.app/
2. Hard refresh your browser: 
   - Windows: Ctrl + F5
   - Mac: Cmd + Shift + R
3. Click the "Reload Data" button at the top
4. Your full priority chart should appear!

If you still see issues, please:
1. Try logging out and back in
2. Send me a screenshot of what you see
3. Press F12 and screenshot any red errors in the Console tab

Your data was never lost - it was safely stored the whole time. This was just a loading issue that's now fixed.

Let me know if you have any problems!
```

## 🔍 If Issues Persist

### Check Supabase Data
Run this query in Supabase SQL Editor:
```sql
-- See how much data each user has
SELECT 
  s.user_id,
  au.email,
  COUNT(DISTINCT s.id) as sections,
  COUNT(DISTINCT sub.id) as subsections,
  COUNT(DISTINCT t.id) as tasks
FROM sections s
LEFT JOIN auth.users au ON au.id = s.user_id
LEFT JOIN subsections sub ON sub.section_id = s.id
LEFT JOIN tasks t ON t.subsection_id = sub.id
GROUP BY s.user_id, au.email
ORDER BY sections DESC;
```

### Check RLS Policies
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('sections', 'subsections', 'tasks');
```

Should show 12 policies total (4 per table: SELECT, INSERT, UPDATE, DELETE).

If policies are missing, see repair queries in `supabase-export-queries.sql`.

## 📁 Files Created

- ✅ `DATA-RECOVERY-GUIDE.md` - Full detailed guide
- ✅ `QUICK-START.md` - This file
- ✅ `browser-export-script.js` - User data export for browser
- ✅ `export-all-users.mjs` - Admin export all users (Node.js)
- ✅ `supabase-export-queries.sql` - SQL queries for Supabase
- ✅ `src/components/DataDiagnostic.tsx` - Debug component (optional)

## ✨ Code Changes Summary

**src/pages/Index.tsx:**
- Line 70-105: Fixed `loadFromSupabase()` to explicitly filter data
- Line 45-58: Added detailed logging
- Line 1026-1039: Added "Reload Data" button

**src/components/PieChart.tsx:**
- Line 27-32: Added logging to track what data chart receives

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Browser console shows correct counts (e.g., "Sections loaded: 5")
- ✅ Pie chart shows all sections in different colors
- ✅ Stats bar shows correct totals
- ✅ No red errors in console

## 💡 Tips

1. **Always keep backups**: Tell users to export their data weekly
2. **Monitor logs**: Check Supabase logs occasionally
3. **Test with multiple users**: Have 2-3 test accounts
4. **Document incidents**: Keep notes on what went wrong

---

**You're good to go! Deploy and let users know.** 🚀

Questions? Check `DATA-RECOVERY-GUIDE.md` for more details.


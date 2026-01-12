#!/usr/bin/env node

/**
 * Debug script to check announcements setup
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Try to load .env file if it exists
config();

const SUPABASE_URL = "https://ktjrcdknewtliusorbcb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAnnouncements() {
  console.log('\n🔍 Debugging Announcements System\n');
  console.log('─'.repeat(60));

  // 1. Check if tables exist
  console.log('\n1️⃣  Checking if tables exist...');
  
  try {
    const { data: announcements, error: annError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (annError) {
      console.error('❌ announcements table ERROR:', annError.message);
      console.log('   → Migration was NOT applied. Run the SQL in Supabase dashboard!');
      return;
    } else {
      console.log('✅ announcements table exists');
    }

    const { data: seen, error: seenError } = await supabase
      .from('user_announcements_seen')
      .select('*')
      .limit(1);
    
    if (seenError) {
      console.error('❌ user_announcements_seen table ERROR:', seenError.message);
      console.log('   → Migration was NOT applied. Run the SQL in Supabase dashboard!');
      return;
    } else {
      console.log('✅ user_announcements_seen table exists');
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return;
  }

  // 2. List all announcements
  console.log('\n2️⃣  Fetching all announcements...');
  
  const { data: allAnnouncements, error: fetchError } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching announcements:', fetchError.message);
    return;
  }

  if (!allAnnouncements || allAnnouncements.length === 0) {
    console.log('⚠️  No announcements found in database');
    console.log('   → Try creating one with: npm run announcement');
    return;
  }

  console.log(`✅ Found ${allAnnouncements.length} announcement(s):\n`);
  
  allAnnouncements.forEach((ann, idx) => {
    console.log(`   ${idx + 1}. ${ann.title}`);
    console.log(`      ID: ${ann.id}`);
    console.log(`      Active: ${ann.is_active}`);
    console.log(`      Severity: ${ann.severity}`);
    console.log(`      Expires: ${ann.expires_at || 'Never'}`);
    console.log(`      Created: ${new Date(ann.created_at).toLocaleString()}`);
    
    // Check if expired
    if (ann.expires_at) {
      const expired = new Date(ann.expires_at) < new Date();
      if (expired) {
        console.log(`      ⚠️  EXPIRED - won't show to users`);
      } else {
        console.log(`      ✅ Not expired - will show`);
      }
    }
    console.log('');
  });

  // 3. Check who has seen announcements
  console.log('\n3️⃣  Checking who has seen announcements...');
  
  const { data: seenRecords, error: seenError } = await supabase
    .from('user_announcements_seen')
    .select('*');

  if (seenError) {
    console.error('❌ Error fetching seen records:', seenError.message);
    return;
  }

  if (!seenRecords || seenRecords.length === 0) {
    console.log('✅ No users have seen any announcements yet');
    console.log('   → This is good! Log in to test.');
  } else {
    console.log(`📊 ${seenRecords.length} view record(s):\n`);
    seenRecords.forEach((record, idx) => {
      console.log(`   ${idx + 1}. User: ${record.user_id}`);
      console.log(`      Announcement: ${record.announcement_id}`);
      console.log(`      Seen at: ${new Date(record.seen_at).toLocaleString()}`);
      console.log('');
    });
  }

  // 4. Test active announcement query (what user would see)
  console.log('\n4️⃣  Testing active announcement query (what users see)...');
  
  const { data: activeAnnouncements, error: activeError } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false });

  if (activeError) {
    console.error('❌ Error querying active announcements:', activeError.message);
    return;
  }

  if (!activeAnnouncements || activeAnnouncements.length === 0) {
    console.log('⚠️  No active, non-expired announcements found');
    console.log('   → Users won\'t see any announcements');
  } else {
    console.log(`✅ ${activeAnnouncements.length} active announcement(s) that users will see:`);
    activeAnnouncements.forEach((ann, idx) => {
      console.log(`   ${idx + 1}. ${ann.title} (ID: ${ann.id})`);
    });
  }

  console.log('\n─'.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Open your app in a browser');
  console.log('   2. Open browser DevTools (F12)');
  console.log('   3. Go to Console tab');
  console.log('   4. Log out and log back in');
  console.log('   5. Check for errors in console');
  console.log('   6. Look for announcements being fetched');
  console.log('\n');
}

debugAnnouncements().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});


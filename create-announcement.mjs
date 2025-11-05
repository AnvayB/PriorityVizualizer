#!/usr/bin/env node

/**
 * Script to create announcements for all users
 * 
 * Usage:
 *   node create-announcement.mjs
 * 
 * Then follow the prompts to create an announcement.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import { config } from 'dotenv';

// Try to load .env file if it exists
config();

const SUPABASE_URL = "https://ktjrcdknewtliusorbcb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('   Get it from: https://supabase.com/dashboard/project/ktjrcdknewtliusorbcb/settings/api');
  console.error('   Run: export SUPABASE_SERVICE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function multilineQuestion(prompt) {
  return new Promise((resolve) => {
    console.log(prompt);
    console.log('(Press Enter twice when done)\n');
    
    let lines = [];
    let emptyLineCount = 0;
    
    const promptUser = () => {
      rl.question('', (line) => {
        if (line.trim() === '') {
          emptyLineCount++;
          if (emptyLineCount >= 2) {
            // Two empty lines = done
            resolve(lines.join('\n'));
          } else {
            lines.push('');
            promptUser();
          }
        } else {
          emptyLineCount = 0;
          lines.push(line);
          promptUser();
        }
      });
    };
    
    promptUser();
  });
}

async function createAnnouncement() {
  console.log('\n📢 Create New Announcement\n');
  console.log('This announcement will be shown to all users on their next login.\n');

  // Get announcement details
  const title = await question('Enter announcement title: ');
  if (!title.trim()) {
    console.error('❌ Title is required');
    rl.close();
    return;
  }

  const message = await multilineQuestion('Enter announcement message:');
  if (!message.trim()) {
    console.error('❌ Message is required');
    rl.close();
    return;
  }

  console.log('\nSeverity options:');
  console.log('  1. info (blue) - General information');
  console.log('  2. success (green) - Positive news');
  console.log('  3. warning (yellow) - Important notice');
  console.log('  4. error (red) - Critical alert');
  
  const severityChoice = await question('Select severity (1-4) [default: 1]: ');
  const severityMap = {
    '1': 'info',
    '2': 'success',
    '3': 'warning',
    '4': 'error',
    '': 'info'
  };
  const severity = severityMap[severityChoice] || 'info';

  const expiresInput = await question('Expiration (days from now, or press Enter for no expiration): ');
  let expiresAt = null;
  if (expiresInput.trim()) {
    const days = parseInt(expiresInput);
    if (!isNaN(days) && days > 0) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + days);
      expiresAt = expireDate.toISOString();
    }
  }

  // Confirm
  console.log('\n📝 Announcement Preview:');
  console.log('─'.repeat(50));
  console.log(`Title: ${title}`);
  console.log(`Message: ${message}`);
  console.log(`Severity: ${severity}`);
  console.log(`Expires: ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never'}`);
  console.log('─'.repeat(50));

  const confirm = await question('\nCreate this announcement? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  // Insert announcement
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: title.trim(),
      message: message.trim(),
      severity,
      is_active: true,
      expires_at: expiresAt
    })
    .select();

  if (error) {
    console.error('❌ Error creating announcement:', error);
    rl.close();
    return;
  }

  console.log('\n✅ Announcement created successfully!');
  console.log(`   ID: ${data[0].id}`);
  console.log('   All users will see this announcement on their next login.\n');

  rl.close();
}

async function listActiveAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching announcements:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('\n📭 No active announcements');
    return;
  }

  console.log('\n📢 Active Announcements:\n');
  data.forEach((announcement, idx) => {
    console.log(`${idx + 1}. [${announcement.severity.toUpperCase()}] ${announcement.title}`);
    console.log(`   Message: ${announcement.message}`);
    console.log(`   Created: ${new Date(announcement.created_at).toLocaleDateString()}`);
    console.log(`   Expires: ${announcement.expires_at ? new Date(announcement.expires_at).toLocaleDateString() : 'Never'}`);
    console.log(`   ID: ${announcement.id}`);
    console.log('');
  });
}

async function deactivateAnnouncement() {
  await listActiveAnnouncements();
  
  const announcementId = await question('Enter announcement ID to deactivate (or press Enter to cancel): ');
  if (!announcementId.trim()) {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  const { error } = await supabase
    .from('announcements')
    .update({ is_active: false })
    .eq('id', announcementId.trim());

  if (error) {
    console.error('❌ Error deactivating announcement:', error);
  } else {
    console.log('✅ Announcement deactivated successfully!');
  }

  rl.close();
}

async function main() {
  console.log('\n🎯 Priority Manager - Announcement Management\n');
  console.log('Options:');
  console.log('  1. Create new announcement');
  console.log('  2. List active announcements');
  console.log('  3. Deactivate an announcement');
  console.log('  4. Exit');

  const choice = await question('\nSelect option (1-4): ');

  switch (choice) {
    case '1':
      await createAnnouncement();
      break;
    case '2':
      await listActiveAnnouncements();
      rl.close();
      break;
    case '3':
      await deactivateAnnouncement();
      break;
    case '4':
      console.log('👋 Goodbye!');
      rl.close();
      break;
    default:
      console.log('❌ Invalid option');
      rl.close();
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});


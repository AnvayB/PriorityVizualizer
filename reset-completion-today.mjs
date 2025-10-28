#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
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

async function resetTodaysCompletions() {
  try {
    console.log('🔄 Resetting today\'s completion data in PST...\n');
    
    // Get today's date in PST
    const now = new Date();
    
    // Format date in PST timezone
    const pstFormatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayString = pstFormatter.format(now); // Format: YYYY-MM-DD
    
    console.log(`📅 Today in PST: ${todayString}\n`);
    
    // Get user ID from command line argument
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('Usage: node reset-completion-today.mjs <user-id>');
      console.log('\nTo find your user ID, check the browser console or your Supabase auth.users table.');
      console.log('\nExample: node reset-completion-today.mjs 12345678-1234-1234-1234-123456789abc');
      process.exit(1);
    }
    
    console.log(`👤 User ID: ${userId}\n`);
    
    // Delete completion_stats entries for today
    console.log('🗑️  Deleting completion_stats for today...');
    const { error: statsError, count: statsCount } = await supabase
      .from('completion_stats')
      .delete()
      .eq('user_id', userId)
      .eq('date', todayString);
    
    if (statsError) {
      throw statsError;
    }
    console.log(`✅ Deleted ${statsCount} completion_stats entries\n`);
    
    // Delete completed_tasks entries for today
    console.log('🗑️  Deleting completed_tasks for today...');
    
    // Calculate UTC boundaries for PST midnight
    const [year, month, day] = todayString.split('-').map(Number);
    
    // Calculate start of today in PST as UTC
    const PST_TZ = 'America/Los_Angeles';
    const startOfTodayPST = new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0));
    const startOfTomorrowPST = new Date(Date.UTC(year, month - 1, day + 1, 8, 0, 0, 0));
    
    const { error: tasksError, count: tasksCount } = await supabase
      .from('completed_tasks')
      .delete()
      .eq('user_id', userId)
      .gte('completed_at', startOfTodayPST.toISOString())
      .lt('completed_at', startOfTomorrowPST.toISOString());
    
    if (tasksError) {
      throw tasksError;
    }
    console.log(`✅ Deleted ${tasksCount} completed_tasks entries\n`);
    
    console.log('✨ Successfully reset today\'s completion data!');
    console.log('\nYou can now complete tasks today and the counter will start fresh.\n');
    
  } catch (error) {
    console.error('❌ Error resetting completion data:', error.message);
    process.exit(1);
  }
}

resetTodaysCompletions();


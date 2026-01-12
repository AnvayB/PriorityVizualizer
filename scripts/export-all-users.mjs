#!/usr/bin/env node

/**
 * Export all user data from Supabase to individual JSON files
 * 
 * Usage:
 *   node export-all-users.mjs
 * 
 * This will create a 'backups/' directory with one JSON file per user
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials (from your client.ts)
const SUPABASE_URL = "https://ktjrcdknewtliusorbcb.supabase.co";
// const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0anJjZGtuZXd0bGl1c29yYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjQ1NzQsImV4cCI6MjA3MzE0MDU3NH0._azPNgEv7sphuv9_kfEG8dAmAMPCgxPO__3sp_LGDRE";

// For admin access, you may need the service role key instead
// Get this from Supabase Dashboard > Settings > API > service_role key
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0anJjZGtuZXd0bGl1c29yYmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU2NDU3NCwiZXhwIjoyMDczMTQwNTc0fQ.EKyhY6jqc6cm0PyTYCqUbRdoAi8BG4wgj9rZd8keMRA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportAllUserData() {
  console.log('🚀 Starting export...\n');

  try {
    // Create backups directory
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
      console.log('📁 Created backups directory\n');
    }

    // Get all sections (this gets all users)
    console.log('📊 Fetching sections...');
    const { data: allSections, error: sectionsError } = await supabase
      .from('sections')
      .select('*');

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`✅ Found ${allSections.length} sections\n`);

    // Get all subsections
    console.log('📊 Fetching subsections...');
    const { data: allSubsections, error: subsectionsError } = await supabase
      .from('subsections')
      .select('*');

    if (subsectionsError) {
      console.error('❌ Error fetching subsections:', subsectionsError);
      return;
    }

    console.log(`✅ Found ${allSubsections.length} subsections\n`);

    // Get all tasks
    console.log('📊 Fetching tasks...');
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      return;
    }

    console.log(`✅ Found ${allTasks.length} tasks\n`);

    // Group by user
    const userDataMap = new Map();

    allSections.forEach(section => {
      const userId = section.user_id;
      if (!userDataMap.has(userId)) {
        userDataMap.set(userId, {
          userId,
          sections: [],
          subsections: [],
          tasks: []
        });
      }
      userDataMap.get(userId).sections.push(section);
    });

    // Add subsections
    allSubsections.forEach(subsection => {
      const parentSection = allSections.find(s => s.id === subsection.section_id);
      if (parentSection) {
        const userId = parentSection.user_id;
        if (userDataMap.has(userId)) {
          userDataMap.get(userId).subsections.push(subsection);
        }
      }
    });

    // Add tasks
    allTasks.forEach(task => {
      const parentSubsection = allSubsections.find(s => s.id === task.subsection_id);
      if (parentSubsection) {
        const parentSection = allSections.find(s => s.id === parentSubsection.section_id);
        if (parentSection) {
          const userId = parentSection.user_id;
          if (userDataMap.has(userId)) {
            userDataMap.get(userId).tasks.push(task);
          }
        }
      }
    });

    console.log(`👥 Found data for ${userDataMap.size} users\n`);

    // Export each user's data
    let exportCount = 0;
    for (const [userId, userData] of userDataMap) {
      const formattedSections = userData.sections.map(section => ({
        id: section.id,
        title: section.title,
        color: section.color || undefined,
        high_priority: section.high_priority || false,
        subsections: userData.subsections
          .filter(sub => sub.section_id === section.id)
          .map(subsection => ({
            id: subsection.id,
            title: subsection.title,
            high_priority: subsection.high_priority || false,
            tasks: userData.tasks
              .filter(task => task.subsection_id === subsection.id)
              .map(task => ({
                id: task.id,
                title: task.title,
                dueDate: task.due_date || '',
                high_priority: task.high_priority || false
              }))
          }))
      }));

      const exportData = {
        sections: formattedSections,
        exportDate: new Date().toISOString(),
        version: "1.0",
        userId: userId
      };

      // Calculate stats
      const stats = {
        sections: formattedSections.length,
        subsections: formattedSections.reduce((sum, s) => sum + s.subsections.length, 0),
        tasks: formattedSections.reduce((sum, s) => 
          sum + s.subsections.reduce((subSum, sub) => subSum + sub.tasks.length, 0), 0)
      };

      // Save to file
      const filename = `user-${userId.substring(0, 8)}-backup-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(backupsDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

      console.log(`✅ Exported user ${userId.substring(0, 8)}:`);
      console.log(`   Sections: ${stats.sections}, Subsections: ${stats.subsections}, Tasks: ${stats.tasks}`);
      console.log(`   Saved to: ${filename}\n`);

      exportCount++;
    }

    // Create complete backup
    const completeBackup = {
      exportDate: new Date().toISOString(),
      userCount: userDataMap.size,
      totalSections: allSections.length,
      totalSubsections: allSubsections.length,
      totalTasks: allTasks.length,
      sections: allSections,
      subsections: allSubsections,
      tasks: allTasks
    };

    const completeFilename = `complete-backup-${new Date().toISOString().split('T')[0]}.json`;
    const completeFilepath = path.join(backupsDir, completeFilename);
    fs.writeFileSync(completeFilepath, JSON.stringify(completeBackup, null, 2));

    console.log(`✅ Complete backup saved to: ${completeFilename}\n`);
    console.log(`🎉 Export complete! ${exportCount} user(s) backed up.`);
    console.log(`📁 All files saved to: ${backupsDir}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportAllUserData();


/**
 * Script to export all user data from Supabase
 * Run this in browser console on your app page (while logged in as admin)
 * or adapt it to run with Node.js
 */

import { supabase } from './src/integrations/supabase/client.js';

async function exportAllUserData() {
  console.log('Starting data export...');
  
  try {
    // Get all sections (this will get all users' data if you're admin)
    const { data: allSections, error: sectionsError } = await supabase
      .from('sections')
      .select('*');
    
    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return;
    }
    
    console.log(`Found ${allSections.length} sections`);
    
    // Get all subsections
    const { data: allSubsections, error: subsectionsError } = await supabase
      .from('subsections')
      .select('*');
    
    if (subsectionsError) {
      console.error('Error fetching subsections:', subsectionsError);
      return;
    }
    
    console.log(`Found ${allSubsections.length} subsections`);
    
    // Get all tasks
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }
    
    console.log(`Found ${allTasks.length} tasks`);
    
    // Group data by user
    const userDataMap = {};
    
    allSections.forEach(section => {
      const userId = section.user_id;
      if (!userDataMap[userId]) {
        userDataMap[userId] = {
          userId,
          sections: [],
          subsections: [],
          tasks: []
        };
      }
      userDataMap[userId].sections.push(section);
    });
    
    // Add subsections to respective users
    allSubsections.forEach(subsection => {
      const parentSection = allSections.find(s => s.id === subsection.section_id);
      if (parentSection) {
        const userId = parentSection.user_id;
        userDataMap[userId].subsections.push(subsection);
      }
    });
    
    // Add tasks to respective users
    allTasks.forEach(task => {
      const parentSubsection = allSubsections.find(s => s.id === task.subsection_id);
      if (parentSubsection) {
        const parentSection = allSections.find(s => s.id === parentSubsection.section_id);
        if (parentSection) {
          const userId = parentSection.user_id;
          userDataMap[userId].tasks.push(task);
        }
      }
    });
    
    // Create formatted JSON for each user
    const formattedUserData = {};
    
    Object.keys(userDataMap).forEach(userId => {
      const userData = userDataMap[userId];
      
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
      
      formattedUserData[userId] = {
        sections: formattedSections,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
    });
    
    console.log('Export complete!');
    console.log(`Found data for ${Object.keys(formattedUserData).length} users`);
    
    // Download each user's data as a separate file
    Object.keys(formattedUserData).forEach(userId => {
      const userData = formattedUserData[userId];
      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `priorities-backup-${userId.substring(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    // Also save a complete backup
    const completeBackup = {
      exportDate: new Date().toISOString(),
      users: formattedUserData
    };
    
    const completeStr = JSON.stringify(completeBackup, null, 2);
    const completeBlob = new Blob([completeStr], { type: 'application/json' });
    const completeUrl = URL.createObjectURL(completeBlob);
    const completeLink = document.createElement('a');
    completeLink.href = completeUrl;
    completeLink.download = `priorities-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
    completeLink.click();
    URL.revokeObjectURL(completeUrl);
    
    console.log('All files downloaded!');
    return formattedUserData;
    
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Run the export
exportAllUserData();


/**
 * BROWSER CONSOLE SCRIPT - Copy and paste this into your browser console
 * while on https://priorityviz.netlify.app/ (logged in)
 */

(async function exportAllData() {
  console.log('🔍 Starting data export from Supabase...');
  
  try {
    // Access the supabase client from the global scope
    const { supabase } = window;
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you\'re on the app page.');
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.email, user?.id);
    
    // Fetch all sections for current user
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('user_id', user.id);
    
    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }
    
    console.log(`✅ Found ${sections?.length || 0} sections in database`);
    
    if (!sections || sections.length === 0) {
      console.warn('⚠️ No sections found for this user!');
      return;
    }
    
    // Fetch all subsections
    const { data: subsections, error: subsectionsError } = await supabase
      .from('subsections')
      .select('*');
    
    if (subsectionsError) {
      console.error('❌ Error fetching subsections:', subsectionsError);
      return;
    }
    
    console.log(`✅ Found ${subsections?.length || 0} subsections in database`);
    
    // Fetch all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      return;
    }
    
    console.log(`✅ Found ${tasks?.length || 0} tasks in database`);
    
    // Transform to app format
    const formattedSections = sections.map(section => ({
      id: section.id,
      title: section.title,
      color: section.color || undefined,
      high_priority: section.high_priority || false,
      subsections: (subsections || [])
        .filter(sub => sub.section_id === section.id)
        .map(subsection => ({
          id: subsection.id,
          title: subsection.title,
          high_priority: subsection.high_priority || false,
          tasks: (tasks || [])
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
      userId: user.id,
      userEmail: user.email
    };
    
    // Log the data structure
    console.log('📊 Data structure:', {
      sections: formattedSections.length,
      subsections: formattedSections.reduce((sum, s) => sum + s.subsections.length, 0),
      tasks: formattedSections.reduce((sum, s) => 
        sum + s.subsections.reduce((subSum, sub) => subSum + sub.tasks.length, 0), 0)
    });
    
    // Download the file
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `priorities-backup-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Export complete! File downloaded.');
    console.log('💾 Backup saved as:', a.download);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
})();


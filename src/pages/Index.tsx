import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import CompletionCounter from '@/components/CompletionCounter';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, Save, Upload, ChevronDown, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


const Index = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [user, setUser] = useState(null);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);
  const [pinnedSlice, setPinnedSlice] = useState<ChartSlice | null>(null);
  const [completionCount, setCompletionCount] = useState(0);

  // Load data from Supabase
  const loadFromSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('user_id', user.id);

      if (sectionsError) throw sectionsError;

      if (!sectionsData || sectionsData.length === 0) {
        setSections([]);
        return;
      }

      // Fetch subsections
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('subsections')
        .select('*');

      if (subsectionsError) throw subsectionsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Transform data to match frontend structure
      const transformedSections = sectionsData.map(section => ({
        id: section.id,
        title: section.title,
        color: (section as any).color || undefined,
        high_priority: section.high_priority || false,
        subsections: (subsectionsData || [])
          .filter(sub => sub.section_id === section.id)
          .map(subsection => ({
            id: subsection.id,
            title: subsection.title,
            high_priority: subsection.high_priority || false,
            tasks: (tasksData || [])
              .filter(task => task.subsection_id === subsection.id)
              .map(task => ({
                id: task.id,
                title: task.title,
                dueDate: task.due_date || '',
                high_priority: task.high_priority || false
              }))
          }))
      }));

      setSections(transformedSections);
      
      toast({
        title: "Data loaded from Supabase",
        description: "Your priorities have been loaded successfully",
      });
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load data from Supabase.",
        variant: "destructive",
      });
    }
  };

  // Load completion count from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const storedData = localStorage.getItem('dailyCompletions');
    
    if (storedData) {
      const { date, count } = JSON.parse(storedData);
      if (date === today) {
        setCompletionCount(count);
      } else {
        // New day, reset counter
        setCompletionCount(0);
        localStorage.setItem('dailyCompletions', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('dailyCompletions', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  // Auth state management and data loading
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadFromSupabase();
      }
    };
    getUser();
  }, []);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleAddSection = async (title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sections')
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      const newSection: Section = {
        id: data.id,
        title: data.title,
        subsections: []
      };
      setSections(prev => [...prev, newSection]);
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: "Error",
        description: "Failed to add section. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubsection = async (sectionId: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from('subsections')
        .insert({
          section_id: sectionId,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      setSections(prev => prev.map(section => {
        if (section.id === sectionId) {
          const newSubsection: Subsection = {
            id: data.id,
            title: data.title,
            tasks: []
          };
          return {
            ...section,
            subsections: [...section.subsections, newSubsection]
          };
        }
        return section;
      }));
    } catch (error) {
      console.error('Error adding subsection:', error);
      toast({
        title: "Error",
        description: "Failed to add subsection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async (sectionId: string, subsectionId: string, title: string, dueDate: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          subsection_id: subsectionId,
          title,
          due_date: dueDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      setSections(prev => prev.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            subsections: section.subsections.map(subsection => {
              if (subsection.id === subsectionId) {
                const newTask: Task = {
                  id: data.id,
                  title: data.title,
                  dueDate: data.due_date || ''
                };
                return {
                  ...subsection,
                  tasks: [...subsection.tasks, newTask]
                };
              }
              return subsection;
            })
          };
        }
        return section;
      }));
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string) => {
    try {
      // Update database
      if (type === 'section') {
        const { error } = await supabase
          .from('sections')
          .update({ title: newTitle })
          .eq('id', id);
        if (error) throw error;
      } else if (type === 'subsection') {
        const { error } = await supabase
          .from('subsections')
          .update({ title: newTitle })
          .eq('id', id);
        if (error) throw error;
      } else if (type === 'task') {
        const { error } = await supabase
          .from('tasks')
          .update({ 
            title: newTitle,
            due_date: newDueDate || null
          })
          .eq('id', id);
        if (error) throw error;
      }

      // Update local state
      setSections(prev => prev.map(section => {
        if (type === 'section' && section.id === id) {
          return { ...section, title: newTitle };
        }
        
        return {
          ...section,
          subsections: section.subsections.map(subsection => {
            if (type === 'subsection' && subsection.id === id) {
              return { ...subsection, title: newTitle };
            }
            
            return {
              ...subsection,
              tasks: subsection.tasks.map(task => {
                if (type === 'task' && task.id === id) {
                  return { ...task, title: newTitle, dueDate: newDueDate || task.dueDate };
                }
                return task;
              })
            };
          })
        };
      }));
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => {
    try {
      // Delete from database
      if (type === 'section') {
        const { error } = await supabase
          .from('sections')
          .delete()
          .eq('id', sectionId);
        if (error) throw error;
      } else if (type === 'subsection' && subsectionId) {
        const { error } = await supabase
          .from('subsections')
          .delete()
          .eq('id', subsectionId);
        if (error) throw error;
      } else if (type === 'task' && taskId) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
        if (error) throw error;
      }

      // Update local state
      setSections(prev => {
        if (type === 'section') {
          return prev.filter(section => section.id !== sectionId);
        }
        
        return prev.map(section => {
          if (section.id === sectionId) {
            if (type === 'subsection' && subsectionId) {
              return {
                ...section,
                subsections: section.subsections.filter(sub => sub.id !== subsectionId)
              };
            }
            
            if (type === 'task' && subsectionId && taskId) {
              return {
                ...section,
                subsections: section.subsections.map(sub => {
                  if (sub.id === subsectionId) {
                    return {
                      ...sub,
                      tasks: sub.tasks.filter(task => task.id !== taskId)
                    };
                  }
                  return sub;
                })
              };
            }
          }
          return section;
        });
      });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleColorChange = async (sectionId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('sections')
        .update({ color } as any)
        .eq('id', sectionId);
      if (error) throw error;

      setSections(prev => prev.map(section => {
        if (section.id === sectionId) {
          return { ...section, color };
        }
        return section;
      }));
    } catch (error) {
      console.error('Error updating color:', error);
      toast({
        title: "Error",
        description: "Failed to update color. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePriorityChange = async (type: 'section' | 'subsection' | 'task', id: string, highPriority: boolean) => {
    try {
      // Update database
      if (type === 'section') {
        const { error } = await supabase
          .from('sections')
          .update({ high_priority: highPriority })
          .eq('id', id);
        if (error) throw error;
      } else if (type === 'subsection') {
        // Update the subsection priority
        const { error: subsectionError } = await supabase
          .from('subsections')
          .update({ high_priority: highPriority })
          .eq('id', id);
        if (subsectionError) throw subsectionError;

        // Cascade to all tasks in this subsection
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({ high_priority: highPriority })
          .eq('subsection_id', id);
        if (tasksError) throw tasksError;
      } else if (type === 'task') {
        const { error } = await supabase
          .from('tasks')
          .update({ high_priority: highPriority })
          .eq('id', id);
        if (error) throw error;
      }

      // Update local state
      setSections(prev => prev.map(section => {
        if (type === 'section' && section.id === id) {
          return { ...section, high_priority: highPriority };
        }
        
        return {
          ...section,
          subsections: section.subsections.map(subsection => {
            if (type === 'subsection' && subsection.id === id) {
              // When updating subsection priority, cascade to all its tasks
              return { 
                ...subsection, 
                high_priority: highPriority,
                tasks: subsection.tasks.map(task => ({
                  ...task,
                  high_priority: highPriority
                }))
              };
            }
            
            return {
              ...subsection,
              tasks: subsection.tasks.map(task => {
                if (type === 'task' && task.id === id) {
                  return { ...task, high_priority: highPriority };
                }
                return task;
              })
            };
          })
        };
      }));

      toast({
        title: "Priority updated",
        description: `${type} priority has been ${highPriority ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (type: 'section' | 'subsection' | 'task', id: string) => {
    let tasksCompletedCount = 0;
    
    // Calculate how many tasks are being completed
    if (type === 'task') {
      tasksCompletedCount = 1;
    } else if (type === 'subsection') {
      const subsection = sections
        .flatMap(s => s.subsections)
        .find(sub => sub.id === id);
      tasksCompletedCount = subsection?.tasks.length || 0;
    } else if (type === 'section') {
      const section = sections.find(s => s.id === id);
      tasksCompletedCount = section?.subsections.reduce((total, sub) => total + sub.tasks.length, 0) || 0;
    }
    
    // Update completion counter
    const newCount = completionCount + tasksCompletedCount;
    setCompletionCount(newCount);
    
    // Update localStorage
    const today = new Date().toDateString();
    localStorage.setItem('dailyCompletions', JSON.stringify({ date: today, count: newCount }));
    
    // Remove completed item(s) using handleDelete
    if (type === 'task') {
      // Find the task to get its parent info
      let sectionId = '';
      let subsectionId = '';
      
      sections.forEach(section => {
        section.subsections.forEach(subsection => {
          if (subsection.tasks.some(task => task.id === id)) {
            sectionId = section.id;
            subsectionId = subsection.id;
          }
        });
      });
      
      if (sectionId && subsectionId) {
        await handleDelete('task', sectionId, subsectionId, id);
      }
    } else if (type === 'subsection') {
      // Find the subsection's parent section
      const parentSection = sections.find(section => 
        section.subsections.some(sub => sub.id === id)
      );
      
      if (parentSection) {
        await handleDelete('subsection', parentSection.id, id);
      }
    } else if (type === 'section') {
      await handleDelete('section', id);
    }
    
    toast({
      title: "Completed!",
      description: `Completed ${tasksCompletedCount} task${tasksCompletedCount !== 1 ? 's' : ''}. Great job!`,
    });
  };

  const totalTasks = sections.reduce((total, section) => 
    total + section.subsections.reduce((subTotal, subsection) => 
      subTotal + subsection.tasks.length, 0), 0);

  const upcomingTasks = sections.flatMap(section => 
    section.subsections.flatMap(subsection => 
      subsection.tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        return dueDate >= today && dueDate <= threeDaysFromNow;
      })
    )
  );

  const handleSaveToDatabase = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save your priorities",
          variant: "destructive",
        });
        return;
      }

      // Clear existing data for this user
      await supabase.from('sections').delete().eq('user_id', user.id);

      // Save sections, subsections, and tasks
      for (const section of sections) {
        // Insert section
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .insert({
            user_id: user.id,
            title: section.title,
            color: section.color || null,
            high_priority: section.high_priority || false,
          } as any)
          .select()
          .single();

        if (sectionError) throw sectionError;

        // Insert subsections for this section
        for (const subsection of section.subsections) {
          const { data: subsectionData, error: subsectionError } = await supabase
            .from('subsections')
            .insert({
              section_id: sectionData.id,
              title: subsection.title,
              high_priority: subsection.high_priority || false,
            })
            .select()
            .single();

          if (subsectionError) throw subsectionError;

          // Insert tasks for this subsection
          if (subsection.tasks.length > 0) {
            const tasksToInsert = subsection.tasks.map(task => ({
              subsection_id: subsectionData.id,
              title: task.title,
              due_date: task.dueDate || null,
              high_priority: task.high_priority || false,
            }));

            const { error: tasksError } = await supabase
              .from('tasks')
              .insert(tasksToInsert);

            if (tasksError) throw tasksError;
          }
        }
      }

      toast({
        title: "Saved to Supabase!",
        description: "Your priorities have been saved to the database",
      });
    } catch (error) {
      console.error('Error saving to database:', error);
      toast({
        title: "Error",
        description: "Failed to save priorities. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createExportData = () => {
    return {
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        color: section.color,
        subsections: section.subsections.map(subsection => ({
          id: subsection.id,
          title: subsection.title,
          color: subsection.color,
          tasks: subsection.tasks.map(task => ({
            id: task.id,
            title: task.title,
            dueDate: task.dueDate
          }))
        }))
      })),
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
  };

  const handleReplaceCurrentData = () => {
    const exportData = createExportData();
    const data = JSON.stringify(exportData, null, 2);
    
    // Download the file with exact name for replacement
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'priorities.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Saved to Computer!",
      description: "JSON file downloaded successfully to your computer.",
    });
  };

  const handleSaveAsNewFile = () => {
    const exportData = createExportData();
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    a.download = `priorities-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Saved to Computer!",
      description: "JSON file downloaded successfully to your computer.",
    });
  };

  const handleLoadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Handle both old format (direct array) and new format (with metadata)
          const sectionsData = data.sections || data;
          
          if (Array.isArray(sectionsData)) {
            setSections(sectionsData);
            setPinnedSlice(null); // Clear any pinned slice
            toast({
              title: "Success!",
              description: "Priorities loaded successfully from file",
            });
          } else {
            throw new Error("Invalid file format");
          }
        } catch (error) {
          console.error('Error loading file:', error);
          toast({
            title: "Error",
            description: "Failed to load file. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-card/30 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Life Priorities Dashboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-32 md:max-w-none">{user.email}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-1 md:gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-1 md:gap-2 text-sm">
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">Save</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleSaveToDatabase}>
                    to Supabase
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReplaceCurrentData}>
                    to Computer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1 md:gap-2 text-sm">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Load</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={loadFromSupabase}>
                    from Supabase
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLoadFromFile}>
                    from Computer
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Visualize and manage your priorities across different areas of life
          </p>
        </div>
      </header>

        {/* Stats Bar */}
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 md:mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/20 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{sections.length}</p>
                  <p className="text-sm text-muted-foreground">Life Sections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/20 rounded-lg">
                  <Target className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{upcomingTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <CompletionCounter count={completionCount} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
          {/* Pie Chart */}
          <div className="xl:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-fit">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Priority Visualization</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {sections.length > 0 ? (
                  <PieChart 
                    sections={sections} 
                    onHover={setHoveredSlice}
                    onSliceClick={setPinnedSlice}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-center">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
                        <PieChartIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
                        <p className="text-muted-foreground">Add your first section to get started</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-8">
            {/* Hover Info */}
            <HoverInfo 
              slice={pinnedSlice || hoveredSlice} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onColorChange={handleColorChange}
              onPriorityChange={handlePriorityChange}
              onComplete={handleComplete}
              onClose={() => setPinnedSlice(null)}
              isPinned={!!pinnedSlice}
            />

            {/* Add Form */}
            <PriorityForm
              sections={sections}
              onAddSection={handleAddSection}
              onAddSubsection={handleAddSubsection}
              onAddTask={handleAddTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import CompletionCounter from '@/components/CompletionCounter';
import DeadlineEditor from '@/components/DeadlineEditor';
import MobileNavigation from '@/components/MobileNavigation';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, Save, Upload, ChevronDown, LogOut, User, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


const Index = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [user, setUser] = useState(null);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);
  const [pinnedSlice, setPinnedSlice] = useState<ChartSlice | null>(null);
  const [completionRefresh, setCompletionRefresh] = useState(0);
  const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
  
  // Form prefill state
  const [formPrefilledSectionId, setFormPrefilledSectionId] = useState('');
  const [formPrefilledSubsectionId, setFormPrefilledSubsectionId] = useState('');
  const [formActiveTab, setFormActiveTab] = useState<'section' | 'subsection' | 'task'>('section');
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  // Load data from Supabase
  const loadFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[loadFromSupabase] No user found');
        return;
      }

      console.log('[loadFromSupabase] Loading data for user:', user.id);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('user_id', user.id);

      if (sectionsError) {
        console.error('[loadFromSupabase] Error fetching sections:', sectionsError);
        throw sectionsError;
      }

      console.log('[loadFromSupabase] Sections loaded:', sectionsData?.length || 0);

      if (!sectionsData || sectionsData.length === 0) {
        console.log('[loadFromSupabase] No sections found, setting empty array');
        setSections([]);
        toast({
          title: "No data found",
          description: "Start by adding a section using the form on the right, or load data from a file.",
        });
        return;
      }

      // Get all section IDs for filtering
      const sectionIds = sectionsData.map(s => s.id);
      console.log('[loadFromSupabase] Section IDs:', sectionIds);

      // Fetch subsections with explicit filter by section_id
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('subsections')
        .select('*')
        .in('section_id', sectionIds);

      if (subsectionsError) {
        console.error('[loadFromSupabase] Error fetching subsections:', subsectionsError);
        throw subsectionsError;
      }

      console.log('[loadFromSupabase] Subsections loaded:', subsectionsData?.length || 0);

      // Get all subsection IDs for filtering tasks
      const subsectionIds = subsectionsData?.map(s => s.id) || [];
      console.log('[loadFromSupabase] Subsection IDs:', subsectionIds);

      // Fetch tasks with explicit filter by subsection_id
      let tasksData = [];
      if (subsectionIds.length > 0) {
        const { data: fetchedTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('subsection_id', subsectionIds);

        if (tasksError) {
          console.error('[loadFromSupabase] Error fetching tasks:', tasksError);
          throw tasksError;
        }
        
        tasksData = fetchedTasks || [];
      }

      console.log('[loadFromSupabase] Tasks loaded:', tasksData?.length || 0);

      // Transform data to match frontend structure
      const transformedSections = sectionsData.map(section => ({
        id: section.id,
        title: section.title,
        color: section.color || undefined,
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

      console.log('[loadFromSupabase] Transformed sections:', transformedSections.length);
      console.log('[loadFromSupabase] Sections detail:', transformedSections.map(s => ({
        title: s.title,
        subsections: s.subsections.length,
        tasks: s.subsections.reduce((sum, sub) => sum + sub.tasks.length, 0)
      })));

      setSections(transformedSections);
      
      toast({
        title: "Data loaded from Supabase",
        description: `Loaded ${transformedSections.length} section(s) successfully`,
      });
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load data from Supabase.",
        variant: "destructive",
      });
    }
  }, [toast]);


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
  }, [loadFromSupabase]);

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
          .update({ color })
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let tasksCompletedCount = 0;
      const completedTaskDetails: Array<{ task_title: string; section_title: string; subsection_title: string | null }> = [];
      
      // Calculate how many tasks are being completed and collect task details
      if (type === 'task') {
        tasksCompletedCount = 1;
        // Find the task details
        sections.forEach(section => {
          section.subsections.forEach(subsection => {
            const task = subsection.tasks.find(t => t.id === id);
            if (task) {
              completedTaskDetails.push({
                task_title: task.title,
                section_title: section.title,
                subsection_title: subsection.title
              });
            }
          });
        });
      } else if (type === 'subsection') {
        const subsection = sections
          .flatMap(s => s.subsections)
          .find(sub => sub.id === id);
        tasksCompletedCount = subsection?.tasks.length || 0;
        
        // Find section title for this subsection
        const section = sections.find(s => s.subsections.some(sub => sub.id === id));
        if (subsection && section) {
          subsection.tasks.forEach(task => {
            completedTaskDetails.push({
              task_title: task.title,
              section_title: section.title,
              subsection_title: subsection.title
            });
          });
        }
      } else if (type === 'section') {
        const section = sections.find(s => s.id === id);
        tasksCompletedCount = section?.subsections.reduce((total, sub) => total + sub.tasks.length, 0) || 0;
        
        if (section) {
          section.subsections.forEach(subsection => {
            subsection.tasks.forEach(task => {
              completedTaskDetails.push({
                task_title: task.title,
                section_title: section.title,
                subsection_title: subsection.title
              });
            });
          });
        }
      }
      
      // Update completion_stats in Supabase
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStat, error: fetchError } = await supabase
        .from('completion_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingStat) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('completion_stats')
          .update({ daily_count: existingStat.daily_count + tasksCompletedCount })
          .eq('id', existingStat.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('completion_stats')
          .insert({
            user_id: user.id,
            date: today,
            daily_count: tasksCompletedCount
          });
        
        if (insertError) throw insertError;
      }

      // Insert completed task details
      if (completedTaskDetails.length > 0) {
        const { error: tasksError } = await supabase
          .from('completed_tasks')
          .insert(
            completedTaskDetails.map(detail => ({
              user_id: user.id,
              task_title: detail.task_title,
              section_title: detail.section_title,
              subsection_title: detail.subsection_title
            }))
          );
        
        if (tasksError) throw tasksError;
      }

      // Trigger refresh of completion counter
      setCompletionRefresh(prev => prev + 1);
      
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
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to save completion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalTasks = sections.reduce((total, section) => 
    total + section.subsections.reduce((subTotal, subsection) => 
      subTotal + subsection.tasks.length, 0), 0);

  const upcomingTasks = sections.flatMap(section => 
    section.subsections.flatMap(subsection => 
      subsection.tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);
        return dueDate >= today && dueDate <= fiveDaysFromNow;
      }).map(task => ({
        ...task,
        sectionTitle: section.title,
        subsectionTitle: subsection.title,
        sectionId: section.id,
        subsectionId: subsection.id
      }))
    )
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
          })
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

  // Check if current user is guest user
  const isGuestUser = () => {
    return user?.email === 'guest@example.com';
  };

  // Load guest data from JSON file
  const handleLoadGuestData = async () => {
    if (!isGuestUser()) {
      toast({
        title: "Access Denied",
        description: "Guest data is only available for guest users.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Import the guest data file
      const response = await fetch('/guest_data.json');
      if (!response.ok) {
        throw new Error('Failed to load guest data file');
      }
      
      const data = await response.json();
      const sectionsData = data.sections || data;
      
      if (Array.isArray(sectionsData)) {
        setSections(sectionsData);
        setPinnedSlice(null); // Clear any pinned slice
        
        toast({
          title: "Guest Data Loaded!",
          description: "Sample priorities have been loaded for exploration and editing.",
        });
      } else {
        throw new Error("Invalid guest data format");
      }
    } catch (error) {
      console.error('Error loading guest data:', error);
      toast({
        title: "Error",
        description: "Failed to load guest data. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleSliceClickForForm = (slice: ChartSlice) => {
    // Set the pinned slice for the HoverInfo component
    setPinnedSlice(slice);
    
    // Determine form behavior based on slice level
    if (slice.level === 'section') {
      // Click on Section → Open Subsection tab with Parent Section pre-filled
      setFormPrefilledSectionId(slice.section.id);
      setFormPrefilledSubsectionId('');
      setFormActiveTab('subsection');
      setIsFormHighlighted(true);
    } else if (slice.level === 'subsection') {
      // Click on Subsection → Open Task tab with Parent Section + Subsection pre-filled
      setFormPrefilledSectionId(slice.section.id);
      setFormPrefilledSubsectionId(slice.subsection?.id || '');
      setFormActiveTab('task');
      setIsFormHighlighted(true);
    }
    // For task level, do nothing (no form interaction)
    
    // Remove highlight after 2 seconds
    if (slice.level !== 'task') {
      setTimeout(() => {
        setIsFormHighlighted(false);
      }, 2000);
    }
  };

  const handleWhiteSpaceClick = () => {
    if (pinnedSlice) {
      setPinnedSlice(null);
      setIsFormHighlighted(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="relative bg-card/30 backdrop-blur-sm border-b border-border/50">
        {/* Top bar gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: 'var(--gradient-top-bar)'
          }}
        />
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Priority Vizualizer
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-32 md:max-w-none">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {user && (
                  <Button
                    onClick={loadFromSupabase}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                    </svg>
                    Reload Data
                  </Button>
                )}
                <MobileNavigation
                  onSignOut={handleSignOut}
                  onSaveToDatabase={handleSaveToDatabase}
                  onSaveToComputer={handleReplaceCurrentData}
                  onLoadFromSupabase={loadFromSupabase}
                  onLoadFromFile={handleLoadFromFile}
                  onLoadGuestData={handleLoadGuestData}
                  user={user}
                  isGuestUser={isGuestUser}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-muted-foreground">
              <span className="sm:hidden">Visualize and manage your priorities across life</span>
              <span className="hidden sm:inline">Visualize and manage your priorities across different areas of life</span>
            </p>
            {user && (
              <div className="flex justify-start sm:justify-end">
                <DeadlineEditor userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </header>

        {/* Stats Bar */}
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6 md:mb-10">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5">
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
            <CardContent className="p-5">
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

          <Dialog open={isDueSoonModalOpen} onOpenChange={setIsDueSoonModalOpen}>
            <DialogTrigger asChild>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-warning/30 cursor-pointer hover:bg-card/70 hover:border-warning/50 hover:shadow-lg hover:shadow-warning/10 transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/20 rounded-lg group-hover:bg-warning/30 transition-colors">
                      <Calendar className="w-5 h-5 text-warning group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{upcomingTasks.length}</p>
                      <p className="text-sm text-muted-foreground group-hover:text-warning/80 transition-colors">Due Soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-warning" />
                  Due Soon ({upcomingTasks.length})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                      <Calendar className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Tasks</h3>
                    <p className="text-muted-foreground">All caught up! No tasks due in the next 5 days.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You have {upcomingTasks.length} task{upcomingTasks.length !== 1 ? 's' : ''} due within the next 5 days.
                    </p>
                    <div className="space-y-3">
                      {upcomingTasks
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((task) => {
                          const daysUntil = getDaysUntilDue(task.dueDate);
                          const overdue = isOverdue(task.dueDate);
                          
                          return (
                            <div key={`${task.sectionId}-${task.subsectionId}-${task.id}`} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border-l-4" style={{borderLeftColor: overdue ? '#ef4444' : daysUntil <= 1 ? '#f59e0b' : '#3b82f6'}}>
                              <div className="p-2 bg-background rounded-lg">
                                {overdue ? (
                                  <AlertTriangle className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Clock className="w-4 h-4 text-warning" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {task.sectionTitle} → {task.subsectionTitle}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge 
                                      variant={overdue ? 'destructive' : daysUntil <= 1 ? 'secondary' : 'outline'}
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {overdue ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                                    </Badge>
                                    {task.high_priority && (
                                      <Badge variant="destructive" className="text-xs">
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Due: {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {user && <CompletionCounter userId={user.id} refreshTrigger={completionRefresh} />}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
          {/* Pie Chart */}
          <div className="xl:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-primary">Priority Display</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-2" onClick={handleWhiteSpaceClick}>
                {(() => {
                  console.log('[Index] Rendering PieChart area, sections.length:', sections.length);
                  return sections.length > 0 ? (
                    <PieChart 
                      sections={sections} 
                      onHover={setHoveredSlice}
                      onSliceClick={handleSliceClickForForm}
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
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 md:space-y-10">
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
              prefilledSectionId={formPrefilledSectionId}
              prefilledSubsectionId={formPrefilledSubsectionId}
              activeTab={formActiveTab}
              isHighlighted={isFormHighlighted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import CompletionCounter from '@/components/CompletionCounter';
import DeadlineEditor from '@/components/DeadlineEditor';
import MobileNavigation from '@/components/MobileNavigation';
import ThemeToggle from '@/components/ThemeToggle';
import AnnouncementDialog from '@/components/AnnouncementDialog';
import AnnouncementHistory from '@/components/AnnouncementHistory';
import PurposeModeSettings from '@/components/PurposeModeSettings';
import OnboardingModal from '@/components/OnboardingModal';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, Save, Upload, ChevronDown, LogOut, User, Clock, AlertTriangle, CheckCircle, Info, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storeLocalBackup, detectDataLoss, downloadAutoBackup } from '@/utils/dataProtection';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';


const Index = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [user, setUser] = useState(null);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);
  const [pinnedSlice, setPinnedSlice] = useState<ChartSlice | null>(null);
  const [completionRefresh, setCompletionRefresh] = useState(0);
  const [effortRefresh, setEffortRefresh] = useState(0);
  const [isDueTodayModalOpen, setIsDueTodayModalOpen] = useState(false);
  const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [dontShowTutorial, setDontShowTutorial] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  
  // Purpose mode state
  const [purposeModeEnabled, setPurposeModeEnabled] = useState(false);
  const [purposeImageUrl, setPurposeImageUrl] = useState<string | null>(null);
  const [animationIcon, setAnimationIcon] = useState<'flower' | 'star' | 'sparkle'>('flower');
  const [purposeAnchorRef, setPurposeAnchorRef] = useState<HTMLDivElement | null>(null);
  const [purposeAnchorPosition, setPurposeAnchorPosition] = useState<{ x: number; y: number } | null>(null);
  const [todayEffortCount, setTodayEffortCount] = useState(0);
  const [currentEffortDate, setCurrentEffortDate] = useState<string | null>(null);
  
  // Form prefill state
  const [formPrefilledSectionId, setFormPrefilledSectionId] = useState('');
  const [formPrefilledSubsectionId, setFormPrefilledSubsectionId] = useState('');
  const [formActiveTab, setFormActiveTab] = useState<'section' | 'subsection' | 'task'>('section');
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  // Load data from Supabase
  const loadFromSupabase = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('[loadFromSupabase] No user found');
        return;
      }

      console.log('[loadFromSupabase] Loading data for user:', currentUser.id);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('user_id', currentUser.id);

      if (sectionsError) {
        console.error('[loadFromSupabase] Error fetching sections:', sectionsError);
        throw sectionsError;
      }

      console.log('[loadFromSupabase] Sections loaded:', sectionsData?.length || 0);

      if (!sectionsData || sectionsData.length === 0) {
        console.log('[loadFromSupabase] No sections found, setting empty array');
        setIsNewUser(true);
        setSections([]);
        return;
      }
      setIsNewUser(false);

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
                high_priority: task.high_priority || false,
                description: task.description || undefined,
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
      
      // DATA PROTECTION: Auto-backup after successful load
      if (currentUser) {
        storeLocalBackup(transformedSections, currentUser.id);
        console.log('[DataProtection] Auto-backup created after load');
      }
      
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


  // Load today's effort count
  const loadTodayEffortCount = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const now = new Date();
      const pstNow = toZonedTime(now, 'America/Los_Angeles');
      const today = format(pstNow, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('task_effort')
        .select('id', { count: 'exact' })
        .eq('user_id', currentUser.id)
        .eq('date', today);

      if (error) {
        console.error('Error loading today effort count:', error);
        return;
      }

      setTodayEffortCount(data?.length || 0);
      setCurrentEffortDate(today);
    } catch (error) {
      console.error('Error loading today effort count:', error);
    }
  }, []);

  // Load user settings (purpose mode)
  const loadUserSettings = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('purpose_mode_enabled, purpose_image_url, effort_animation_icon')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading user settings:', error);
        return;
      }

      if (settings) {
        setPurposeModeEnabled(settings.purpose_mode_enabled || false);
        setPurposeImageUrl(settings.purpose_image_url || null);
        setAnimationIcon((settings.effort_animation_icon as 'flower' | 'star' | 'sparkle') || 'flower');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }, []);

  // Update purpose anchor position when ref changes
  useEffect(() => {
    const updateAnchorPosition = () => {
      if (purposeAnchorRef) {
        const rect = purposeAnchorRef.getBoundingClientRect();
        setPurposeAnchorPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updateAnchorPosition();
    window.addEventListener('resize', updateAnchorPosition);
    window.addEventListener('scroll', updateAnchorPosition, true);

    return () => {
      window.removeEventListener('resize', updateAnchorPosition);
      window.removeEventListener('scroll', updateAnchorPosition, true);
    };
  }, [purposeAnchorRef, purposeModeEnabled]);

  // Auth state management and data loading
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadFromSupabase();
        await loadUserSettings();
        await loadTodayEffortCount();
      }
    };
    getUser();
  }, [loadFromSupabase, loadUserSettings, loadTodayEffortCount]);

  useEffect(() => {
    if (!user?.id) {
      setIsNewUser(null);
      setShowTutorialModal(false);
      setShowOnboardingModal(false);
      return;
    }

    if (isNewUser === true) {
      // Brand-new user: show the guided onboarding modal instead of the plain tutorial
      setShowOnboardingModal(true);
      setShowTutorialModal(false);
      return;
    }

    if (isNewUser === false) {
      setShowOnboardingModal(false);
      // Returning user: show the existing welcome tips modal (respects "Don't Show Again")
      const storageKey = `pv-hide-tutorial-${user.id}`;
      const hideTutorial = localStorage.getItem(storageKey) === 'true';
      setDontShowTutorial(false);
      setShowTutorialModal(!hideTutorial);
    }
  }, [user?.id, isNewUser]);

  // Reload effort count when effort is recorded
  useEffect(() => {
    if (user && effortRefresh > 0) {
      loadTodayEffortCount();
    }
  }, [effortRefresh, user, loadTodayEffortCount]);

  // Ensure effort-based purpose icons reset at the end of each PST day
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const pstNow = toZonedTime(now, 'America/Los_Angeles');
      const today = format(pstNow, 'yyyy-MM-dd');

      setCurrentEffortDate((prev) => {
        if (prev && prev !== today) {
          // Day has rolled over in PST; reload today's effort count so icons reset
          loadTodayEffortCount();
        }
        return today;
      });
    }, 60 * 1000); // Check once per minute

    return () => clearInterval(interval);
  }, [loadTodayEffortCount]);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleAddSection = async (title: string, color?: string): Promise<Section> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('sections')
        .insert({
          user_id: user.id,
          title,
          ...(color ? { color } : {}),
        })
        .select()
        .single();

      if (error) throw error;

      const newSection: Section = {
        id: data.id,
        title: data.title,
        color: data.color || undefined,
        subsections: []
      };
      setSections(prev => [...prev, newSection]);
      return newSection;
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: "Error",
        description: "Failed to add section. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleAddSubsection = async (sectionId: string, title: string): Promise<Subsection> => {
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

      const newSubsection: Subsection = {
        id: data.id,
        title: data.title,
        tasks: []
      };
      setSections(prev => prev.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            subsections: [...section.subsections, newSubsection]
          };
        }
        return section;
      }));
      return newSubsection;
    } catch (error) {
      console.error('Error adding subsection:', error);
      toast({
        title: "Error",
        description: "Failed to add subsection. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleAddTask = async (sectionId: string, subsectionId: string, title: string, dueDate: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          subsection_id: subsectionId,
          title,
          due_date: dueDate || null,
          description: description || null,
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
                  dueDate: data.due_date || '',
                  description: data.description || undefined,
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

  const handleEdit = async (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string, newDescription?: string) => {
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
            due_date: newDueDate || null,
            description: newDescription || null
          })
          .eq('id', id);
        if (error) throw error;
      }

      // Helper function to recreate slice with updated data
      const recreateSlice = (oldSlice: ChartSlice, updatedSections: Section[]): ChartSlice | null => {
        const section = updatedSections.find(s => s.id === oldSlice.section.id);
        if (!section) return null;
        
        const subsection = oldSlice.subsection 
          ? section.subsections.find(ss => ss.id === oldSlice.subsection?.id)
          : undefined;
        
        const task = oldSlice.task && subsection
          ? subsection.tasks.find(t => t.id === oldSlice.task?.id)
          : undefined;
        
        return {
          ...oldSlice,
          section: section,
          subsection: subsection,
          task: task
        };
      };

      // Store current slice references
      const currentHoveredSlice = hoveredSlice;
      const currentPinnedSlice = pinnedSlice;

      // Update local state
      const updatedSections = sections.map(section => {
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
                  return { 
                    ...task, 
                    title: newTitle, 
                    dueDate: newDueDate !== undefined ? (newDueDate === '' ? '' : newDueDate) : task.dueDate,
                    description: newDescription !== undefined ? newDescription : task.description
                  };
                }
                return task;
              })
            };
          })
        };
      });

      setSections(updatedSections);

      // Update hoveredSlice if it matches the item we just updated
      if (currentHoveredSlice) {
        const matchesCurrentSlice = 
          (type === 'section' && currentHoveredSlice.section.id === id) ||
          (type === 'subsection' && currentHoveredSlice.subsection?.id === id) ||
          (type === 'task' && currentHoveredSlice.task?.id === id);
        
        if (matchesCurrentSlice) {
          const recreated = recreateSlice(currentHoveredSlice, updatedSections);
          if (recreated) {
            setHoveredSlice(recreated);
          }
        }
      }
      
      // Update pinnedSlice if it matches the item we just updated
      if (currentPinnedSlice) {
        const matchesCurrentSlice = 
          (type === 'section' && currentPinnedSlice.section.id === id) ||
          (type === 'subsection' && currentPinnedSlice.subsection?.id === id) ||
          (type === 'task' && currentPinnedSlice.task?.id === id);
        
        if (matchesCurrentSlice) {
          const recreated = recreateSlice(currentPinnedSlice, updatedSections);
          if (recreated) {
            setPinnedSlice(recreated);
          }
        }
      }
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

      // Helper function to recreate a slice from updated sections data
      const recreateSlice = (oldSlice: ChartSlice, updatedSections: Section[]): ChartSlice | null => {
        if (!oldSlice) return null;
        
        const section = updatedSections.find(s => s.id === oldSlice.section.id);
        if (!section) return oldSlice;
        
        if (oldSlice.level === 'section') {
          return {
            ...oldSlice,
            section: section
          };
        }
        
        const subsection = section.subsections.find(sub => sub.id === oldSlice.subsection?.id);
        if (!subsection) return oldSlice;
        
        if (oldSlice.level === 'subsection') {
          return {
            ...oldSlice,
            section: section,
            subsection: subsection
          };
        }
        
        const task = subsection.tasks.find(t => t.id === oldSlice.task?.id);
        if (!task) return oldSlice;
        
        return {
          ...oldSlice,
          section: section,
          subsection: subsection,
          task: task
        };
      };

      // Store current slice references
      const currentHoveredSlice = hoveredSlice;
      const currentPinnedSlice = pinnedSlice;

      // Calculate updated sections
      const updatedSections = sections.map(section => {
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
      });

      // Update sections state
      setSections(updatedSections);

      // Update hoveredSlice if it matches the item we just updated
      if (currentHoveredSlice) {
        const matchesCurrentSlice = 
          (type === 'section' && currentHoveredSlice.section.id === id) ||
          (type === 'subsection' && currentHoveredSlice.subsection?.id === id) ||
          (type === 'task' && currentHoveredSlice.task?.id === id);
        
        if (matchesCurrentSlice) {
          const recreated = recreateSlice(currentHoveredSlice, updatedSections);
          if (recreated) {
            setHoveredSlice(recreated);
          }
        }
      }
      
      // Update pinnedSlice if it matches the item we just updated
      if (currentPinnedSlice) {
        const matchesCurrentSlice = 
          (type === 'section' && currentPinnedSlice.section.id === id) ||
          (type === 'subsection' && currentPinnedSlice.subsection?.id === id) ||
          (type === 'task' && currentPinnedSlice.task?.id === id);
        
        if (matchesCurrentSlice) {
          const recreated = recreateSlice(currentPinnedSlice, updatedSections);
          if (recreated) {
            setPinnedSlice(recreated);
          }
        }
      }

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

      // DATA PROTECTION: Warn about completing sections/subsections (they get deleted!)
      if (type === 'section' || type === 'subsection') {
        const itemType = type === 'section' ? 'section' : 'subsection';
        
        let itemName = 'Unknown';
        let countToDelete = 0;
        
        if (type === 'section') {
          const section = sections.find(s => s.id === id);
          itemName = section?.title || 'Unknown';
          countToDelete = section?.subsections.reduce((sum, sub) => sum + sub.tasks.length, 0) || 0;
        } else {
          const subsection = sections.flatMap(s => s.subsections).find(sub => sub.id === id);
          itemName = subsection?.title || 'Unknown';
          countToDelete = subsection?.tasks.length || 0;
        }

        const confirmed = window.confirm(
          `⚠️ PERMANENT ACTION\n\n` +
          `Completing "${itemName}" will:\n` +
          `• Mark ${countToDelete} task(s) as complete\n` +
          `• PERMANENTLY DELETE this ${itemType} and all its data\n\n` +
          `This action cannot be undone.\n\n` +
          `Continue?`
        );

        if (!confirmed) {
          return;
        }

        // Create backup before deletion
        console.log('[DataProtection] Creating backup before completing', type);
        storeLocalBackup(sections, user.id);
      }

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
      // Get today's date in PST (Pacific Time)
      const now = new Date();
      const pstNow = toZonedTime(now, 'America/Los_Angeles');
      const today = format(pstNow, 'yyyy-MM-dd');
      
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

  // Parse date string as local date (not UTC) to avoid timezone shift
  const parseLocalDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    // Split the date string (format: YYYY-MM-DD) and create a date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Tasks due today
  const dueTodayTasks = sections.flatMap(section => 
    section.subsections.flatMap(subsection => 
      subsection.tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = parseLocalDate(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        return dueDate >= today && dueDate <= endOfToday;
      }).map(task => ({
        ...task,
        sectionTitle: section.title,
        subsectionTitle: subsection.title,
        sectionId: section.id,
        subsectionId: subsection.id
      }))
    )
  );

  // Tasks due soon (1-5 days from now, excluding today)
  const upcomingTasks = sections.flatMap(section => 
    section.subsections.flatMap(subsection => 
      subsection.tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = parseLocalDate(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);
        fiveDaysFromNow.setHours(23, 59, 59, 999);
        return dueDate >= tomorrow && dueDate <= fiveDaysFromNow;
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
    if (!dateString) return 'No due date';
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false; // No due date means not overdue
    const dueDate = parseLocalDate(dateString);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysUntilDue = (dateString: string) => {
    if (!dateString) return Infinity; // No due date
    const dueDate = parseLocalDate(dateString);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Overdue tasks
  const overdueTasks = sections.flatMap(section => 
    section.subsections.flatMap(subsection => 
      subsection.tasks.filter(task => {
        if (!task.dueDate) return false;
        return isOverdue(task.dueDate);
      }).map(task => ({
        ...task,
        sectionTitle: section.title,
        subsectionTitle: subsection.title,
        sectionId: section.id,
        subsectionId: subsection.id
      }))
    )
  );
  const recentOverdueTasks = overdueTasks.filter(task => Math.abs(getDaysUntilDue(task.dueDate)) <= 30);
  const oldOverdueTasks = overdueTasks.filter(task => Math.abs(getDaysUntilDue(task.dueDate)) > 30);

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

      // DATA PROTECTION: Create automatic backup before dangerous operation
      console.log('[DataProtection] Creating safety backup before save...');
      storeLocalBackup(sections, user.id);

      // DATA PROTECTION: Check if we're about to save less data than we currently have
      // Fetch current data from database
      const { data: currentSections } = await supabase
        .from('sections')
        .select('*, subsections(*, tasks(*))')
        .eq('user_id', user.id);

      if (currentSections && currentSections.length > 0) {
        // Transform current database data to Section[] format for comparison
        const currentData = currentSections.map(section => ({
          id: section.id,
          title: section.title,
          color: section.color,
          high_priority: section.high_priority,
          subsections: (section.subsections || []).map(sub => ({
            id: sub.id,
            title: sub.title,
            high_priority: sub.high_priority,
            tasks: (sub.tasks || []).map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.due_date || '',
              high_priority: task.high_priority
            }))
          }))
        }));

        const warning = detectDataLoss(currentData, sections, 0.3); // 30% loss threshold
        
        if (warning) {
          // Download automatic backup
          downloadAutoBackup(currentData, user.id);
          
          // Show warning and get confirmation
          const confirmed = window.confirm(
            warning + 
            "\n\n⚠️ An automatic backup has been downloaded to your computer.\n" +
            "If you proceed, your current database data will be REPLACED."
          );
          
          if (!confirmed) {
            toast({
              title: "Save cancelled",
              description: "Your data was not modified. The backup has been saved to your downloads.",
            });
            return;
          }
        }
      }

      console.log('[DataProtection] Proceeding with save...');

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

  const handleTaskClick = (taskId: string, sectionId: string, subsectionId: string) => {
    // Find the section, subsection, and task from the sections state
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const subsection = section.subsections.find(sub => sub.id === subsectionId);
    if (!subsection) return;

    const task = subsection.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Create a ChartSlice object for this task
    const taskSlice: ChartSlice = {
      section: section,
      subsection: subsection,
      task: task,
      startAngle: 0,
      endAngle: 0,
      radius: 0,
      level: 'task',
      color: section.color || 'hsl(var(--chart-1))'
    };

    // Set it as the pinned slice
    setPinnedSlice(taskSlice);

    // Close all dialogs
    setIsDueTodayModalOpen(false);
    setIsDueSoonModalOpen(false);
    setIsOverdueModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Dialog
        open={showTutorialModal}
        onOpenChange={(open) => {
          if (!open && user?.id && dontShowTutorial) {
            localStorage.setItem(`pv-hide-tutorial-${user.id}`, 'true');
          }
          setShowTutorialModal(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to Priority Visualizer! 🎯</DialogTitle>
            <p className="text-sm text-muted-foreground">Here's how to get the most out of it:</p>
          </DialogHeader>

          {/* Step rows */}
          <div className="space-y-3 py-1">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
                <PieChartIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Build your hierarchy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add <span className="font-medium">Sections</span> → <span className="font-medium">Subsections</span> → <span className="font-medium">Tasks</span> using the "Add Priorities" panel on the right.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Click to explore & edit</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Click any slice in the chart to pin its details, then edit, complete, or delete it from the side panel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Track your progress</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The sunburst chart updates live. Log effort daily to grow your Purpose Anchor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Stay on top of deadlines</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The metrics cards at the top show what's overdue, due today, and coming up soon.
                </p>
              </div>
            </div>
          </div>

          {/* Tip block */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Hover over elements for tooltips. Click the <BookOpen className="inline w-3 h-3 mx-0.5 align-text-top" /> icon in the top-right corner for the full tutorial docs.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox
                checked={dontShowTutorial}
                onCheckedChange={(checked) => setDontShowTutorial(checked === true)}
              />
              Don't Show Again
            </label>
            <Button onClick={() => setShowTutorialModal(false)}>
              Let's go →
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OnboardingModal
        open={showOnboardingModal}
        onSectionAdded={handleAddSection}
        onSubsectionAdded={handleAddSubsection}
        onTaskAdded={handleAddTask}
        onComplete={() => {
          setShowOnboardingModal(false);
          setIsNewUser(false);
        }}
      />
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
                Priority Viz
              </h1>
            </div>
            
            {/* Purpose Anchor - Center of header */}
            {purposeModeEnabled && purposeImageUrl && (
              <div 
                ref={setPurposeAnchorRef}
                className="flex items-center justify-center relative ml-[10.5%]"

              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg">
                  <img 
                    src={purposeImageUrl} 
                    alt="Purpose anchor" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Effort indicators - emojis positioned around the circle, outside the bounds */}
                {todayEffortCount > 0 && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ width: '80px', height: '80px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    {Array.from({ length: Math.min(todayEffortCount, 20) }).map((_, index) => {
                      // Position emojis in a circle around the anchor
                      const angle = (index * 360) / Math.min(todayEffortCount, 20);
                      const radius = 36; // Distance from center (slightly larger to fit more icons)
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;
                      const emoji = animationIcon === 'star' ? '⭐' : animationIcon === 'sparkle' ? '✨' : '🌸';
                      
                      return (
                        <div
                          key={index}
                          className="absolute z-10"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: '0.625rem', // text-xs equivalent (10px) - making it even smaller
                          }}
                        >
                          {emoji}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-32 md:max-w-none">{user.email}</span>
                </div>
              )}
              {/* Menu button commented out - data auto-loads from Supabase, mainly for dev purposes */}
              {/* <MobileNavigation
                onSignOut={handleSignOut}
                onSaveToDatabase={handleSaveToDatabase}
                onSaveToComputer={handleReplaceCurrentData}
                onLoadFromSupabase={loadFromSupabase}
                onLoadFromFile={handleLoadFromFile}
                onLoadGuestData={handleLoadGuestData}
                user={user}
                isGuestUser={isGuestUser}
              /> */}
              
              {/* Keep Theme Toggle and Sign Out */}
              <div className="flex gap-2">
                {user && <AnnouncementHistory userId={user.id} />}
                {user && (
                  <PurposeModeSettings
                    userId={user.id}
                    purposeModeEnabled={purposeModeEnabled}
                    purposeImageUrl={purposeImageUrl}
                    animationIcon={animationIcon}
                    onSettingsUpdate={loadUserSettings}
                    onEffortCleared={() => {
                      setEffortRefresh(prev => prev + 1);
                      loadTodayEffortCount();
                    }}
                  />
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 border-gray-400 dark:border-border"
                  title="Open tutorial"
                >
                  <a
                    href="https://docsify-this.net/?basePath=https://raw.githubusercontent.com/AnvayB/PriorityVizualizer/main/docs&homepage=USER-TUTORIAL.md&edit-link=https://github.com/AnvayB/PriorityVizualizer/blob/main/docs/USER-TUTORIAL.md&sidebar=true&dark-mode=auto#/?id=table-of-contents"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BookOpen className="w-4 h-4" />
                  </a>
                </Button>
                <ThemeToggle />
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm" 
                  className="h-9 w-9 p-0 border-gray-400 dark:border-border"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6 md:mb-10">
          {/* Combined Tasks & Sections Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-2/20 rounded-lg">
                    <Target className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                    <p className="text-sm text-muted-foreground">Tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                  <PieChartIcon className="w-4 h-4 text-chart-1" />
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{sections.length}</p>
                    <p className="text-xs text-muted-foreground">Sections</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Today Card */}
          <Dialog open={isDueTodayModalOpen} onOpenChange={setIsDueTodayModalOpen}>
            <DialogTrigger asChild>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-destructive/30 cursor-pointer hover:bg-card/70 hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/10 transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/20 rounded-lg group-hover:bg-destructive/30 transition-colors">
                      <Clock className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{dueTodayTasks.length}</p>
                      <p className="text-sm text-muted-foreground group-hover:text-destructive/80 transition-colors">Due Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-destructive" />
                  Due Today ({dueTodayTasks.length})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {dueTodayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                      <Clock className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Due Today</h3>
                    <p className="text-muted-foreground">All clear! No tasks are due today.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You have {dueTodayTasks.length} task{dueTodayTasks.length !== 1 ? 's' : ''} due today.
                    </p>
                    <div className="space-y-3">
                      {dueTodayTasks
                        .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime())
                        .map((task) => {
                          const overdue = isOverdue(task.dueDate);
                          
                          return (
                            <div 
                              key={`${task.sectionId}-${task.subsectionId}-${task.id}`} 
                              className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border-l-4 border-destructive cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleTaskClick(task.id, task.sectionId, task.subsectionId)}
                            >
                              <div className="p-2 bg-background rounded-lg">
                                <Clock className="w-4 h-4 text-destructive" />
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
                                      variant="destructive"
                                      className="text-xs whitespace-nowrap"
                                    >
                                      Today
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

          {/* Overdue Card */}
          <Dialog open={isOverdueModalOpen} onOpenChange={setIsOverdueModalOpen}>
            <DialogTrigger asChild>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-purple-500/40 cursor-pointer hover:bg-card/70 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/30 rounded-lg group-hover:bg-purple-500/40 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{overdueTasks.length}</p>
                      <p className="text-sm text-muted-foreground group-hover:text-purple-500/80 transition-colors">Overdue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-purple-500" />
                  Overdue Tasks ({overdueTasks.length})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {overdueTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                      <CheckCircle className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Overdue Tasks</h3>
                    <p className="text-muted-foreground">Great job! All your tasks are up to date.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}.
                    </p>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recent (last 30 days) ({recentOverdueTasks.length})
                      </div>
                      {recentOverdueTasks.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No recent overdue tasks.</div>
                      ) : (
                        recentOverdueTasks
                          .sort((a, b) => parseLocalDate(b.dueDate).getTime() - parseLocalDate(a.dueDate).getTime())
                          .map((task) => {
                            const daysOverdue = Math.abs(getDaysUntilDue(task.dueDate));
                            
                            return (
                              <div 
                                key={`${task.sectionId}-${task.subsectionId}-${task.id}`} 
                                className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border-l-4 border-purple-500 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleTaskClick(task.id, task.sectionId, task.subsectionId)}
                              >
                                <div className="p-2 bg-background rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-purple-500" />
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
                                        variant="secondary"
                                        className="text-xs whitespace-nowrap bg-purple-500 text-white"
                                      >
                                        {daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`}
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
                          })
                      )}
                    </div>
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Old (over 30 days) ({oldOverdueTasks.length})
                      </div>
                      {oldOverdueTasks.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No old overdue tasks.</div>
                      ) : (
                        oldOverdueTasks
                          .sort((a, b) => parseLocalDate(b.dueDate).getTime() - parseLocalDate(a.dueDate).getTime())
                          .map((task) => {
                            const daysOverdue = Math.abs(getDaysUntilDue(task.dueDate));
                            
                            return (
                              <div 
                                key={`${task.sectionId}-${task.subsectionId}-${task.id}`} 
                                className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border-l-4 border-purple-500 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleTaskClick(task.id, task.sectionId, task.subsectionId)}
                              >
                                <div className="p-2 bg-background rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-purple-500" />
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
                                        variant="secondary"
                                        className="text-xs whitespace-nowrap bg-purple-500 text-white"
                                      >
                                        {daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`}
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
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Due Soon Card */}
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
                        .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime())
                        .map((task) => {
                          const daysUntil = getDaysUntilDue(task.dueDate);
                          const overdue = isOverdue(task.dueDate);
                          
                          return (
                            <div 
                              key={`${task.sectionId}-${task.subsectionId}-${task.id}`} 
                              className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors" 
                              style={{borderLeftColor: overdue ? '#ef4444' : daysUntil <= 1 ? '#f59e0b' : '#3b82f6'}}
                              onClick={() => handleTaskClick(task.id, task.sectionId, task.subsectionId)}
                            >
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

        {/* Announcement Dialog */}
        {user && <AnnouncementDialog userId={user.id} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
          {/* Pie Chart */}
          <div className="xl:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  Priority Display
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          This chart is flexible. Some people structure it as Roles → Goals → Actions (inspired by Stephen Covey) instead of priorities. Use whatever labels help you focus on what matters most.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
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
              userId={user?.id}
              purposeModeEnabled={purposeModeEnabled}
              animationIcon={animationIcon}
              onEffortRecorded={() => {
                setEffortRefresh(prev => prev + 1);
                // Effort count will be reloaded via useEffect
              }}
              purposeAnchorPosition={purposeAnchorPosition}
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

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, Save, Upload, ChevronDown, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import defaultData from '@/data/defaultData.json';

const Index = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>(defaultData.sections);
  const [user, setUser] = useState(null);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);
  const [pinnedSlice, setPinnedSlice] = useState<ChartSlice | null>(null);

  // Auth state management
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleAddSection = (title: string) => {
    const newSection: Section = {
      id: generateId(),
      title,
      subsections: []
    };
    setSections(prev => [...prev, newSection]);
  };

  const handleAddSubsection = (sectionId: string, title: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newSubsection: Subsection = {
          id: generateId(),
          title,
          tasks: []
        };
        return {
          ...section,
          subsections: [...section.subsections, newSubsection]
        };
      }
      return section;
    }));
  };

  const handleAddTask = (sectionId: string, subsectionId: string, title: string, dueDate: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          subsections: section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              const newTask: Task = {
                id: generateId(),
                title,
                dueDate
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
  };

  const handleEdit = (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string) => {
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
  };

  const handleDelete = (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => {
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
  };

  const handleColorChange = (sectionId: string, color: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, color };
      }
      return section;
    }));
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
            }));

            const { error: tasksError } = await supabase
              .from('tasks')
              .insert(tasksToInsert);

            if (tasksError) throw tasksError;
          }
        }
      }

      toast({
        title: "Success!",
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
    a.download = 'defaultData.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Replacement File Downloaded!",
      description: "Delete the current src/data/defaultData.json file and replace it with the downloaded file. Then refresh your browser.",
      duration: 8000,
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
      title: "Success!",
      description: "New priorities file saved. Add it to your /src/data/ folder if you want to keep it in the project.",
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
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Life Priorities Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                  <User className="w-4 h-4" />
                  {user.email}
                </div>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Data
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { handleSaveToDatabase(); handleReplaceCurrentData(); }}>
                    Replace Current Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { handleSaveToDatabase(); handleSaveAsNewFile(); }}>
                    Save as New File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleLoadFromFile} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Load
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Visualize and manage your priorities across different areas of life
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pie Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-fit">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Priority Visualization</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
          <div className="space-y-8">
            {/* Hover Info */}
            <HoverInfo 
              slice={pinnedSlice || hoveredSlice} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onColorChange={handleColorChange}
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

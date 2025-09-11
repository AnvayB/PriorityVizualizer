import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      title: 'MSADI',
      subsections: [
        {
          id: '1-1',
          title: 'DATA 255',
          tasks: [
            { id: '1-1-1', title: 'Project Proposal', dueDate: '2024-09-11' }
          ]
        },
        {
          id: '1-2',
          title: 'DATA 266',
          tasks: [
            { id: '1-2-1', title: 'HW 2', dueDate: '2024-09-15' },
            { id: '1-2-2', title: 'Quiz 1', dueDate: '2024-09-15' }
          ]
        },
        {
          id: '1-3',
          title: 'DATA 298A',
          tasks: []
        }
      ]
    },
    {
      id: '2',
      title: 'Job Applications',
      subsections: [
        {
          id: '2-1',
          title: 'sent by Aai',
          tasks: [
            { id: '2-1-1', title: 'job app 1', dueDate: '2024-09-20' },
            { id: '2-1-2', title: 'job app 2', dueDate: '2024-09-22' },
            { id: '2-1-3', title: 'job app 3', dueDate: '2024-09-25' }
          ]
        },
        {
          id: '2-2',
          title: 'send resume to Pradeep Kaka',
          tasks: [
            { id: '2-2-1', title: 'DA resume', dueDate: '2024-09-18' },
            { id: '2-2-2', title: 'DE resume', dueDate: '2024-09-18' },
            { id: '2-2-3', title: 'DS resume', dueDate: '2024-09-18' }
          ]
        }
      ]
    }
  ]);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);

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
            <Button onClick={handleSaveToDatabase} className="gap-2">
              <Save className="w-4 h-4" />
              Save Data
            </Button>
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
                  <PieChart sections={sections} onHover={setHoveredSlice} />
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
            <HoverInfo slice={hoveredSlice} />

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

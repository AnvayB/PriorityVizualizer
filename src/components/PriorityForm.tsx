import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Section, Subsection, Task } from '@/types/priorities';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PriorityFormProps {
  sections: Section[];
  onAddSection: (title: string) => void;
  onAddSubsection: (sectionId: string, title: string) => void;
  onAddTask: (sectionId: string, subsectionId: string, title: string, dueDate: string) => void;
  prefilledSectionId?: string;
  prefilledSubsectionId?: string;
  activeTab?: 'section' | 'subsection' | 'task';
  isHighlighted?: boolean;
}

const PriorityForm: React.FC<PriorityFormProps> = ({
  sections,
  onAddSection,
  onAddSubsection,
  onAddTask,
  prefilledSectionId = '',
  prefilledSubsectionId = '',
  activeTab = 'section',
  isHighlighted = false,
}) => {
  const [sectionTitle, setSectionTitle] = useState('');
  const [subsectionTitle, setSubsectionTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState(prefilledSectionId);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState(prefilledSubsectionId);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (sectionTitle.trim()) {
      onAddSection(sectionTitle.trim());
      setSectionTitle('');
    }
  };

  const handleAddSubsection = (e: React.FormEvent) => {
    e.preventDefault();
    if (subsectionTitle.trim() && selectedSectionId) {
      onAddSubsection(selectedSectionId, subsectionTitle.trim());
      setSubsectionTitle('');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim() && taskDueDate && selectedSectionId && selectedSubsectionId) {
      const formattedDate = format(taskDueDate, 'yyyy-MM-dd');
      onAddTask(selectedSectionId, selectedSubsectionId, taskTitle.trim(), formattedDate);
      setTaskTitle('');
      setTaskDueDate(undefined);
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Update local state when prefilled values change
  React.useEffect(() => {
    setSelectedSectionId(prefilledSectionId);
    setSelectedSubsectionId(prefilledSubsectionId);
    setCurrentTab(activeTab);
  }, [prefilledSectionId, prefilledSubsectionId, activeTab]);

  return (
    <Card className={`w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 ${isHighlighted ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Priorities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'section' | 'subsection' | 'task')} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="section">Section</TabsTrigger>
            <TabsTrigger value="subsection">Subsection</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
          </TabsList>

          <TabsContent value="section" className="space-y-4">
            <form onSubmit={handleAddSection} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  placeholder="e.g., Work, Personal, School"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                Add Section
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="subsection" className="space-y-4">
            <form onSubmit={handleAddSubsection} className="space-y-4">
              <div className="space-y-2">
                <Label>Parent Section</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger className="bg-background/80">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subsection-title">Subsection Title</Label>
                <Input
                  id="subsection-title"
                  placeholder="e.g., Payroll, Class Project, Chores"
                  value={subsectionTitle}
                  onChange={(e) => setSubsectionTitle(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={!selectedSectionId}
              >
                Add Subsection
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="task" className="space-y-4">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label>Parent Section</Label>
                <Select value={selectedSectionId} onValueChange={(value) => {
                  setSelectedSectionId(value);
                  setSelectedSubsectionId('');
                }}>
                  <SelectTrigger className="bg-background/80">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSection && (
                <div className="space-y-2">
                  <Label>Parent Subsection</Label>
                  <Select value={selectedSubsectionId} onValueChange={setSelectedSubsectionId}>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue placeholder="Select a subsection" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSection.subsections.map((subsection) => (
                        <SelectItem key={subsection.id} value={subsection.id}>
                          {subsection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Finish Part 1, 2 Job Apps"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/80",
                        !taskDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskDueDate}
                      onSelect={setTaskDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={!selectedSectionId || !selectedSubsectionId}
              >
                Add Task
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PriorityForm;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Section, Subsection, Task } from '@/types/priorities';
import { Plus, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PriorityFormProps {
  sections: Section[];
  onAddSection: (title: string) => void;
  onAddSubsection: (sectionId: string, title: string) => void;
  onAddTask: (sectionId: string, subsectionId: string, title: string, dueDate: string, description?: string) => void;
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
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState(prefilledSubsectionId);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const lastPrefilledSectionId = React.useRef(prefilledSectionId);
  const lastPrefilledSubsectionId = React.useRef(prefilledSubsectionId);

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
    if (taskTitle.trim() && selectedSectionId && selectedSubsectionId) {
      const formattedDate = taskDueDate ? format(taskDueDate, 'yyyy-MM-dd') : '';
      onAddTask(selectedSectionId, selectedSubsectionId, taskTitle.trim(), formattedDate, taskDescription.trim() || undefined);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate(undefined);
    }
  };

  // Update local state when prefilled values change
  React.useEffect(() => {
    // Only update if props actually changed
    if (prefilledSectionId !== lastPrefilledSectionId.current || 
        prefilledSubsectionId !== lastPrefilledSubsectionId.current) {
      lastPrefilledSectionId.current = prefilledSectionId;
      lastPrefilledSubsectionId.current = prefilledSubsectionId;
      
      // Update both values together - React will batch these
    setSelectedSectionId(prefilledSectionId);
    setSelectedSubsectionId(prefilledSubsectionId);
    }
    setCurrentTab(activeTab);
  }, [prefilledSectionId, prefilledSubsectionId, activeTab]);
  
  // Ensure subsection is set when section matches prefilled and subsection is provided
  // This handles the case where onValueChange might have cleared it
  React.useEffect(() => {
    if (selectedSectionId === prefilledSectionId && 
        prefilledSubsectionId && 
        selectedSubsectionId !== prefilledSubsectionId) {
      // Check if the prefilled subsection actually exists in the current section
      const section = sections.find(s => s.id === selectedSectionId);
      const subsectionExists = section?.subsections.some(sub => sub.id === prefilledSubsectionId);
      if (subsectionExists) {
        setSelectedSubsectionId(prefilledSubsectionId);
      }
    }
  }, [selectedSectionId, prefilledSectionId, prefilledSubsectionId, selectedSubsectionId, sections]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubsection = selectedSection?.subsections.find(s => s.id === selectedSubsectionId);

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
          <TabsList className="grid w-full grid-cols-3 p-0 gap-0 bg-muted/30">
            {/* Section Tab - Dynamic Dropdown */}
            {sections.length > 0 ? (
              <Select 
                value={selectedSectionId || ''} 
                onValueChange={(value) => {
                  // If this matches the prefilled section AND we have a prefilled subsection,
                  // this is a prop update - set both and don't clear
                  if (value === prefilledSectionId && prefilledSubsectionId) {
                    setSelectedSectionId(value);
                    setSelectedSubsectionId(prefilledSubsectionId);
                    setCurrentTab('task');
                    return;
                  }
                  
                  // Otherwise, this is a user-initiated change
                  setSelectedSectionId(value);
                  setSelectedSubsectionId('');
                  setCurrentTab('subsection');
                }}
              >
                <SelectTrigger 
                  className={cn(
                    "h-9 rounded-none border-r border-border/50 bg-background shadow-none",
                    "hover:bg-muted/50 data-[state=open]:bg-muted/50",
                    currentTab === 'section' 
                      ? "text-foreground font-semibold" 
                      : "text-muted-foreground",
                    "first:rounded-l-md"
                  )}
                  onClick={() => {
                    // Switch to section tab when clicking the trigger
                    if (currentTab !== 'section') {
                      setCurrentTab('section');
                    }
                  }}
                >
                  <SelectValue>
                    {selectedSectionId && selectedSection ? (
                      <span className="font-medium">{selectedSection.title}</span>
                    ) : (
                      <span className="font-semibold">Section</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <TabsTrigger 
                value="section" 
                className={cn(
                  "rounded-none first:rounded-l-md border-r border-border/50",
                  currentTab === 'section' && "font-semibold"
                )}
              >
                Section
              </TabsTrigger>
            )}

            {/* Subsection Tab - Dynamic Dropdown */}
            {selectedSection && selectedSection.subsections.length > 0 ? (
              <Select 
                value={selectedSubsectionId || ''} 
                onValueChange={(value) => {
                  setSelectedSubsectionId(value);
                  setCurrentTab('task');
                }}
              >
                <SelectTrigger 
                  className={cn(
                    "h-9 rounded-none border-r border-border/50 bg-background shadow-none",
                    "hover:bg-muted/50 data-[state=open]:bg-muted/50",
                    currentTab === 'subsection' 
                      ? "text-foreground font-semibold" 
                      : "text-muted-foreground",
                    !selectedSectionId && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!selectedSectionId}
                  onClick={() => {
                    // Switch to subsection tab when clicking the trigger
                    if (currentTab !== 'subsection' && selectedSectionId) {
                      setCurrentTab('subsection');
                    }
                  }}
                >
                  <SelectValue>
                    {selectedSubsectionId && selectedSubsection ? (
                      <span className="font-medium">{selectedSubsection.title}</span>
                    ) : (
                      <span className="font-semibold">Subsection</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {selectedSection.subsections.map((subsection) => (
                    <SelectItem key={subsection.id} value={subsection.id}>
                      {subsection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <TabsTrigger 
                value="subsection" 
                disabled={!selectedSectionId} 
                className={cn(
                  "rounded-none border-r border-border/50",
                  currentTab === 'subsection' && "font-semibold"
                )}
              >
                Subsection
              </TabsTrigger>
            )}

            {/* Task Tab - Regular Tab */}
            <TabsTrigger 
              value="task" 
              className={cn(
                "rounded-none last:rounded-r-md bg-background",
                currentTab === 'task' && "font-semibold"
              )}
            >
              Task
            </TabsTrigger>
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
                <Label htmlFor="task-description">
                  Description <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="task-description"
                  placeholder="Add more details about this task..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="bg-background/80 min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Due Date <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/80 border-gray-400 dark:border-border",
                        !taskDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date (optional)</span>}
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
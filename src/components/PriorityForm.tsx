import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Section } from '@/types/priorities';
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
  const [mode, setMode] = useState<'section' | 'subsection' | 'task'>(activeTab);
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

  const handleSectionChange = (value: string) => {
    if (value === '__new__') {
      setSelectedSectionId('');
      setSelectedSubsectionId('');
      setMode('section');
      return;
    }
    if (value === prefilledSectionId && prefilledSubsectionId) {
      setSelectedSectionId(value);
      setSelectedSubsectionId(prefilledSubsectionId);
      setMode('task');
      return;
    }
    setSelectedSectionId(value);
    setSelectedSubsectionId('');
    setMode('subsection');
  };

  const handleSubsectionChange = (value: string) => {
    setSelectedSubsectionId(value);
    setMode('task');
  };

  // Update local state when prefilled values change (from pie chart clicks)
  React.useEffect(() => {
    if (prefilledSectionId !== lastPrefilledSectionId.current ||
        prefilledSubsectionId !== lastPrefilledSubsectionId.current) {
      lastPrefilledSectionId.current = prefilledSectionId;
      lastPrefilledSubsectionId.current = prefilledSubsectionId;
      setSelectedSectionId(prefilledSectionId);
      setSelectedSubsectionId(prefilledSubsectionId);
    }
    setMode(activeTab);
  }, [prefilledSectionId, prefilledSubsectionId, activeTab]);

  // Ensure subsection stays set when section matches prefilled
  React.useEffect(() => {
    if (selectedSectionId === prefilledSectionId &&
        prefilledSubsectionId &&
        selectedSubsectionId !== prefilledSubsectionId) {
      const section = sections.find(s => s.id === selectedSectionId);
      const subsectionExists = section?.subsections.some(sub => sub.id === prefilledSubsectionId);
      if (subsectionExists) {
        setSelectedSubsectionId(prefilledSubsectionId);
      }
    }
  }, [selectedSectionId, prefilledSectionId, prefilledSubsectionId, selectedSubsectionId, sections]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubsection = selectedSection?.subsections.find(s => s.id === selectedSubsectionId);

  const pillClass = (active: boolean, disabled = false) =>
    cn(
      'flex-1 px-3 py-1.5 rounded-md text-sm transition-colors text-center whitespace-nowrap',
      active
        ? 'bg-background text-foreground font-semibold shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
    );

  return (
    <Card className={`w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 ${isHighlighted ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Priorities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Tab bar */}
        <div className="flex items-center bg-muted/30 rounded-lg p-1 gap-0.5">
          {/* Section: dropdown if sections exist, else plain pill */}
          {sections.length > 0 ? (
            <Select value={selectedSectionId || ''} onValueChange={handleSectionChange}>
              <SelectTrigger
                className={cn(
                  pillClass(mode === 'section'),
                  'h-auto border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent',
                  mode === 'section' && 'bg-background shadow-sm'
                )}
              >
                <SelectValue>
                  {selectedSection ? selectedSection.title : mode === 'section' ? '+ New Section' : 'Section'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Plus className="w-3.5 h-3.5" />
                    New Section
                  </span>
                </SelectItem>
                <div className="my-1 border-t border-border/50" />
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              type="button"
              onClick={() => setMode('section')}
              className={pillClass(mode === 'section')}
            >
              Section
            </button>
          )}

          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />

          {/* Subsection: dropdown if subsections exist in selected section, else plain pill */}
          {selectedSection && selectedSection.subsections.length > 0 ? (
            <Select value={selectedSubsectionId || ''} onValueChange={handleSubsectionChange}>
              <SelectTrigger
                className={cn(
                  pillClass(mode === 'subsection'),
                  'h-auto border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent',
                  mode === 'subsection' && 'bg-background shadow-sm'
                )}
              >
                <SelectValue>
                  {selectedSubsection ? selectedSubsection.title : 'Subsection'}
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
            <button
              type="button"
              onClick={() => selectedSectionId && setMode('subsection')}
              className={pillClass(mode === 'subsection', !selectedSectionId)}
            >
              Subsection
            </button>
          )}

          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />

          {/* Task: always a plain pill */}
          <button
            type="button"
            onClick={() => selectedSectionId && selectedSubsectionId && setMode('task')}
            className={pillClass(mode === 'task', !selectedSubsectionId)}
          >
            Task
          </button>
        </div>

        {/* Section form */}
        {mode === 'section' && (
          <form onSubmit={handleAddSection} className="space-y-2">
            <div className="space-y-1">
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
        )}

        {/* Subsection form */}
        {mode === 'subsection' && (
          <form onSubmit={handleAddSubsection} className="space-y-2">
            <div className="space-y-1">
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
        )}

        {/* Task form */}
        {mode === 'task' && (
          <form onSubmit={handleAddTask} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Finish Part 1, 2 Job Apps"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="bg-background/80"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description">
                Description <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="task-description"
                placeholder="Add more details about this task..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={1}
                className="bg-background/80 min-h-[36px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Due Date <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-background/80 border-gray-400 dark:border-border',
                      !taskDueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskDueDate ? format(taskDueDate, 'PPP') : <span>Pick a date (optional)</span>}
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
        )}
      </CardContent>
    </Card>
  );
};

export default PriorityForm;

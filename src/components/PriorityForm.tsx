import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Section, Subsection, Task } from '@/types/priorities';
import { Plus, Calendar } from 'lucide-react';

interface PriorityFormProps {
  sections: Section[];
  onAddSection: (title: string) => void;
  onAddSubsection: (sectionId: string, title: string) => void;
  onAddTask: (sectionId: string, subsectionId: string, title: string, dueDate: string) => void;
}

const PriorityForm: React.FC<PriorityFormProps> = ({
  sections,
  onAddSection,
  onAddSubsection,
  onAddTask,
}) => {
  const [sectionTitle, setSectionTitle] = useState('');
  const [subsectionTitle, setSubsectionTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [selectedSubsectionId, setSelectedSubsectionId] = useState('');

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
      onAddTask(selectedSectionId, selectedSubsectionId, taskTitle.trim(), taskDueDate);
      setTaskTitle('');
      setTaskDueDate('');
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Priorities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="section" className="space-y-4">
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
                  placeholder="e.g., MSADI, Job Applications"
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
                  placeholder="e.g., DATA 255, sent by Aai"
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
                  placeholder="e.g., Project Proposal, job app 1"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-due-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="bg-background/80"
                />
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
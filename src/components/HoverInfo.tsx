import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartSlice } from '@/types/priorities';
import { Calendar, CheckCircle, Clock, Edit, Trash2, Palette, X, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface HoverInfoProps {
  slice: ChartSlice | null;
  onEdit?: (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string) => void;
  onDelete?: (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => void;
  onColorChange?: (sectionId: string, color: string) => void;
  onPriorityChange?: (type: 'section' | 'subsection' | 'task', id: string, highPriority: boolean) => void;
  onComplete?: (type: 'section' | 'subsection' | 'task', id: string) => void;
  onClose?: () => void;
  isPinned?: boolean;
}

const HoverInfo: React.FC<HoverInfoProps> = ({ slice, onEdit, onDelete, onColorChange, onPriorityChange, onComplete, onClose, isPinned }) => {
  const { theme } = useTheme();
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  const colors = [
    '#1338BE', '#ef4444', '#10b981', '#f59e0b', 
    '#0ea5e9', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Reset tasks dropdown when slice changes
  React.useEffect(() => {
    setIsTasksOpen(false);
  }, [slice]);

  const handleEdit = () => {
    if (!slice || !onEdit) return;
    
    let id = '';
    let currentTitle = '';
    let currentDueDate = '';
    
    if (slice.level === 'section') {
      id = slice.section.id;
      currentTitle = slice.section.title;
    } else if (slice.level === 'subsection' && slice.subsection) {
      id = slice.subsection.id;
      currentTitle = slice.subsection.title;
    } else if (slice.level === 'task' && slice.task) {
      id = slice.task.id;
      currentTitle = slice.task.title;
      currentDueDate = slice.task.dueDate;
    }
    
    setEditTitle(currentTitle);
    setEditDueDate(currentDueDate);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!slice || !onEdit) return;
    
    let id = '';
    if (slice.level === 'section') {
      id = slice.section.id;
    } else if (slice.level === 'subsection' && slice.subsection) {
      id = slice.subsection.id;
    } else if (slice.level === 'task' && slice.task) {
      id = slice.task.id;
    }
    
    onEdit(slice.level, id, editTitle, editDueDate || undefined);
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!slice || !onDelete) return;
    
    const sectionId = slice.section.id;
    const subsectionId = slice.subsection?.id;
    const taskId = slice.task?.id;
    
    onDelete(slice.level, sectionId, subsectionId, taskId);
  };

  const handleColorChange = (color: string) => {
    if (!slice || !onColorChange) return;
    onColorChange(slice.section.id, color);
    setIsColorOpen(false);
  };

  const handlePriorityChange = (checked: boolean) => {
    if (!slice || !onPriorityChange) return;
    
    let id = '';
    if (slice.level === 'section') {
      id = slice.section.id;
    } else if (slice.level === 'subsection' && slice.subsection) {
      id = slice.subsection.id;
    } else if (slice.level === 'task' && slice.task) {
      id = slice.task.id;
    }
    
    onPriorityChange(slice.level, id, checked);
  };

  const handleComplete = () => {
    if (!slice || !onComplete) return;
    
    let id = '';
    if (slice.level === 'section') {
      id = slice.section.id;
    } else if (slice.level === 'subsection' && slice.subsection) {
      id = slice.subsection.id;
    } else if (slice.level === 'task' && slice.task) {
      id = slice.task.id;
    }
    
    onComplete(slice.level, id);
  };

  const getCurrentPriority = () => {
    if (!slice) return false;
    if (slice.level === 'section') return slice.section.high_priority || false;
    if (slice.level === 'subsection') return slice.subsection?.high_priority || false;
    if (slice.level === 'task') return slice.task?.high_priority || false;
    return false;
  };
  if (!slice) {
    return (
      <Card className="w-full max-w-md h-64 bg-card/30 backdrop-blur-sm border-border/30">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            {isPinned ? 'Click on a pie chart section to pin details here' : 'Hover over the pie chart to see details'}
          </p>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card className={`w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 animate-scale-in ${isPinned ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-primary">
            {slice.level === 'section' && slice.section.title}
            {slice.level === 'subsection' && slice.subsection?.title}
            {slice.level === 'task' && slice.task?.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={slice.level === 'section' ? 'default' : slice.level === 'subsection' ? 'secondary' : 'outline'}
              className="capitalize"
            >
              {slice.level}
            </Badge>
            {isPinned && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {slice.level}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter title"
                  />
                </div>
                {slice.level === 'task' && (
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {slice.level === 'section' && (
            <Dialog open={isColorOpen} onOpenChange={setIsColorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Palette className="w-3 h-3 mr-1" />
                  Color
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Choose Section Color</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-3 p-4">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline" size="sm" onClick={handleComplete}>
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="px-2" title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this {slice.level} and all its contents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {slice.level === 'section' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {slice.section.subsections.length} subsection{slice.section.subsections.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {slice.section.subsections.reduce((total, sub) => total + sub.tasks.length, 0)} total task{slice.section.subsections.reduce((total, sub) => total + sub.tasks.length, 0) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {slice.level === 'subsection' && slice.subsection && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Parent: <span className="text-foreground font-medium">{slice.section.title}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {slice.subsection.tasks.length} task{slice.subsection.tasks.length !== 1 ? 's' : ''}
            </p>
            {slice.subsection.tasks.length > 0 && (
              <Collapsible open={isTasksOpen} onOpenChange={setIsTasksOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between mt-2"
                  >
                    <span className="text-xs">View Tasks</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${isTasksOpen ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {slice.subsection.tasks.map((task) => {
                    const daysUntil = getDaysUntilDue(task.dueDate);
                    const overdue = isOverdue(task.dueDate);
                    
                    return (
                      <div key={task.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md">
                        <span className="truncate flex-1">{task.title}</span>
                        <Badge 
                          variant={overdue ? 'destructive' : daysUntil <= 3 ? 'secondary' : 'outline'}
                          className="ml-2 text-xs"
                        >
                          {overdue ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                        </Badge>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {slice.level === 'task' && slice.task && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Section: <span className="text-foreground font-medium">{slice.section.title}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Subsection: <span className="text-foreground font-medium">{slice.subsection?.title}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-xs text-muted-foreground">{formatDate(slice.task.dueDate)}</p>
              </div>
              {(() => {
                const daysUntil = getDaysUntilDue(slice.task.dueDate);
                const overdue = isOverdue(slice.task.dueDate);
                
                return (
                  <Badge 
                    variant={overdue ? 'destructive' : daysUntil <= 3 ? 'secondary' : 'outline'}
                    className="flex items-center gap-1"
                  >
                    {overdue ? (
                      <>
                        <Clock className="w-3 h-3" />
                        Overdue
                      </>
                    ) : daysUntil === 0 ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Today
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                      </>
                    )}
                  </Badge>
                );
              })()}
            </div>
          </div>
        )}
        
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="high-priority"
              checked={getCurrentPriority()}
              onCheckedChange={handlePriorityChange}
            />
            <label
              htmlFor="high-priority"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              High Priority
            </label>
          </div>
          {getCurrentPriority() && (
            <p className="text-xs text-muted-foreground ml-6">
              This {slice.level} will display with a {theme === 'dark' ? 'white' : 'black'} border in the chart
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HoverInfo;
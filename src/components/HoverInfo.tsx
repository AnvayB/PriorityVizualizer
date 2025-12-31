import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ChartSlice } from '@/types/priorities';
import { Calendar, CheckCircle, Clock, Edit, Trash2, Palette, X, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EffortButton from '@/components/EffortButton';
import EffortAnimation from '@/components/EffortAnimation';

interface HoverInfoProps {
  slice: ChartSlice | null;
  onEdit?: (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string, newDescription?: string) => void;
  onDelete?: (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => void;
  onColorChange?: (sectionId: string, color: string) => void;
  onPriorityChange?: (type: 'section' | 'subsection' | 'task', id: string, highPriority: boolean) => void;
  onComplete?: (type: 'section' | 'subsection' | 'task', id: string) => void;
  onClose?: () => void;
  isPinned?: boolean;
  userId?: string;
  purposeModeEnabled?: boolean;
  animationIcon?: 'flower' | 'star' | 'sparkle';
  onEffortRecorded?: () => void;
  purposeAnchorPosition?: { x: number; y: number } | null;
}

const HoverInfo: React.FC<HoverInfoProps> = ({ 
  slice, 
  onEdit, 
  onDelete, 
  onColorChange, 
  onPriorityChange, 
  onComplete, 
  onClose, 
  isPinned,
  userId,
  purposeModeEnabled = false,
  animationIcon = 'flower',
  onEffortRecorded,
  purposeAnchorPosition,
}) => {
  const { theme } = useTheme();
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editDescription, setEditDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [animationState, setAnimationState] = useState<{ start: { x: number; y: number } | null; show: boolean }>({ start: null, show: false });
  

  const colors = [
    // Column 1 (cool blues/teals)
    '#0ea5e9', // Sky blue
    '#06b6d4', // Cyan
    '#6366f1', // Indigo/violet-blue
    '#8b5cf6', // Light purple/blue

    // Column 2 (greens & yellowy greens)
    '#10b981', // Emerald/green
    '#14b8a6', // Teal-green
    '#22c55e', // Green
    '#84cc16', // Lime green

    // Column 3 (yellows/oranges)
    '#eab308', // Yellow/gold
    '#f59e0b', // Amber/orange
    '#fb923c', // Orange
    '#f97316', // Deep orange

    // Column 4 (pinks/reds/berry)
    '#ef4444', // Red
    '#cc6e6e', // Dusty rose
    '#ec4899', // Pink
    '#a855f7', // Violet
  ];

  // Reset tasks dropdown when slice changes
  React.useEffect(() => {
    setIsTasksOpen(false);
  }, [slice]);

  const handleEdit = () => {
    if (!slice || !onEdit) return;
    
    let id = '';
    let currentTitle = '';
    let currentDueDate: Date | undefined = undefined;
    let currentDescription = '';
    
    if (slice.level === 'section') {
      id = slice.section.id;
      currentTitle = slice.section.title;
    } else if (slice.level === 'subsection' && slice.subsection) {
      id = slice.subsection.id;
      currentTitle = slice.subsection.title;
    } else if (slice.level === 'task' && slice.task) {
      id = slice.task.id;
      currentTitle = slice.task.title;
      currentDescription = slice.task.description || '';
      // Convert date string to Date object
      if (slice.task.dueDate) {
        const [year, month, day] = slice.task.dueDate.split('-').map(Number);
        currentDueDate = new Date(year, month - 1, day);
      }
    }
    
    setEditTitle(currentTitle);
    setEditDueDate(currentDueDate);
    setEditDescription(currentDescription);
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
    
    // Convert Date object back to string format (YYYY-MM-DD) if it exists
    const formattedDate = editDueDate ? format(editDueDate, 'yyyy-MM-dd') : undefined;
    const description = slice.level === 'task' ? editDescription : undefined;
    onEdit(slice.level, id, editTitle, formattedDate, description);
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
          <div className="text-muted-foreground text-center space-y-1">
            {isPinned ? (
              <p>
                <span className="sm:hidden">Tap on a pie chart section</span>
                <span className="hidden sm:inline">Click on a pie chart section</span>
                {' to pin details here'}
              </p>
            ) : (
              <>
                <p className="hidden sm:block">Hover over the pie chart to see details</p>
                <p className="hidden sm:block text-s">Click to select a slice</p>
                <p className="sm:hidden">Tap on the pie chart to see details</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse date string as local date (not UTC) to avoid timezone shift
  const parseLocalDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    // Split the date string (format: YYYY-MM-DD) and create a date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

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

  return (
    <Card 
      className={`w-full max-w-md bg-card/50 backdrop-blur-sm border-2 animate-scale-in ${isPinned ? 'ring-2 ring-primary/20' : ''}`}
      style={{ 
        borderColor: isPinned ? slice.color : 'hsl(var(--border))', 
        borderRadius: 'var(--radius)' 
      }}
    >
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
              <Button variant="outline" size="sm" onClick={handleEdit} className="border-gray-400 dark:border-border">
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
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Due Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editDueDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {editDueDate ? format(editDueDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={editDueDate}
                            onSelect={setEditDueDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Enter task description (optional)"
                        className="min-h-[100px]"
                      />
                    </div>
                  </>
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
                <Button variant="outline" size="sm" className="border-gray-400 dark:border-border">
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
                      className="w-12 h-12 rounded-lg border-2 border-black dark:border-white hover:opacity-80 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline" size="sm" onClick={handleComplete} className="border-gray-400 dark:border-border">
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="px-2 border-gray-400 dark:border-border" title="Delete">
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
                <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-md">Delete</AlertDialogAction>
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
                    className="w-full justify-between mt-2 border-gray-400 dark:border-border"
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
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  Section: <span className="text-foreground font-medium">{slice.section.title}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Subsection: <span className="text-foreground font-medium">{slice.subsection?.title}</span>
                </p>
              </div>
              
              {slice.task.description && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0 border-gray-400 dark:border-border">
                      View Description
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Task Description</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{slice.task.description}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {slice.task.dueDate && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-xs text-muted-foreground">{formatDate(slice.task.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2">
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
                        ) : daysUntil === 1 ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Tomorrow
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            {`${daysUntil} days`}
                          </>
                        )}
                      </Badge>
                    );
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (onEdit && slice.task) {
                        onEdit('task', slice.task.id, slice.task.title, '', slice.task.description);
                      }
                    }}
                    title="Remove due date"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            
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
          
          {/* Effort Button - only for tasks */}
          {slice?.level === 'task' && slice.task && userId && (
            <div className="flex items-center space-x-2 mt-3">
              <EffortButton
                taskId={slice.task.id}
                userId={userId}
                animationIcon={animationIcon}
                onEffortRecorded={onEffortRecorded}
                onAnimationTrigger={(startPos) => {
                  if (purposeModeEnabled && purposeAnchorPosition) {
                    setAnimationState({ start: startPos, show: true });
                  }
                }}
              />
            </div>
          )}
        </div>
        
        {/* Effort Animation */}
        {animationState.show && animationState.start && purposeAnchorPosition && (
          <EffortAnimation
            startPosition={animationState.start}
            endPosition={purposeAnchorPosition}
            icon={animationIcon}
            onComplete={() => {
              setAnimationState({ start: null, show: false });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default HoverInfo;
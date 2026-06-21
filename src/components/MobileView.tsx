import React, { useState, useMemo } from 'react';
import { Section, Subsection, Task } from '@/types/priorities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import PriorityForm from '@/components/PriorityForm';
import VoiceInputModal from '@/components/VoiceInputModal';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// ── Types ────────────────────────────────────────────────────────────────────

interface FlatTask {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  high_priority?: boolean;
  sectionId: string;
  subsectionId: string;
  sectionTitle: string;
  subsectionTitle: string;
  sectionColor?: string;
}

type StatusFilter = 'overdue' | 'today' | 'soon' | null;

interface MobileViewProps {
  sections: Section[];
  onComplete: (type: 'section' | 'subsection' | 'task', id: string) => void;
  onDelete: (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => void;
  onEdit: (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string, newDescription?: string) => void;
  onPriorityChange: (type: 'section' | 'subsection' | 'task', id: string, highPriority: boolean) => void;
  onAddSection: (title: string, color?: string) => Promise<Section>;
  onAddSubsection: (sectionId: string, title: string) => Promise<Subsection>;
  onAddTask: (sectionId: string, subsectionId: string, title: string, dueDate: string, description?: string) => Promise<void>;
  user: { id: string; email?: string } | null;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const d = parseLocalDate(dateString);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isDueToday(dateString: string): boolean {
  if (!dateString) return false;
  const d = parseLocalDate(dateString);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function isDueSoon(dateString: string): boolean {
  if (!dateString) return false;
  const d = parseLocalDate(dateString);
  d.setHours(0, 0, 0, 0);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const fiveDays = new Date();
  fiveDays.setDate(fiveDays.getDate() + 5);
  fiveDays.setHours(23, 59, 59, 999);
  return d >= tomorrow && d <= fiveDays;
}

function getDaysUntilDue(dateString: string): number {
  if (!dateString) return Infinity;
  const d = parseLocalDate(dateString);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  return parseLocalDate(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TaskEditDialogProps {
  task: { id: string; title: string; dueDate: string; description?: string } | null;
  open: boolean;
  onClose: () => void;
  onSave: (title: string, dueDate: string, description: string) => void;
}

function TaskEditDialog({ task, open, onClose, onSave }: TaskEditDialogProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? parseLocalDate(task.dueDate) : undefined
  );
  const [calOpen, setCalOpen] = useState(false);

  // Sync when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setDueDate(task.dueDate ? parseLocalDate(task.dueDate) : undefined);
    }
  }, [task]);

  const handleSave = () => {
    const formatted = dueDate ? format(dueDate, 'yyyy-MM-dd') : '';
    onSave(title.trim() || (task?.title ?? ''), formatted, description);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" /> Due Date
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => { setDueDate(d); setCalOpen(false); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-1 h-6 px-0" onClick={() => setDueDate(undefined)}>
                Clear date
              </Button>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: FlatTask;
  showPath?: boolean;
  onComplete: () => void;
  onEdit: (t: FlatTask) => void;
  onDelete: () => void;
  onPriorityToggle: () => void;
}

function TaskRow({ task, showPath = false, onComplete, onEdit, onDelete, onPriorityToggle }: TaskRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const overdue = isOverdue(task.dueDate);
  const today = isDueToday(task.dueDate);
  const daysUntil = getDaysUntilDue(task.dueDate);

  const dueBadgeColor = overdue
    ? 'bg-purple-500 text-white'
    : today
    ? 'bg-destructive text-white'
    : daysUntil <= 1
    ? 'bg-amber-500 text-white'
    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400';

  const dueLabel = overdue
    ? `${Math.abs(daysUntil)}d overdue`
    : today
    ? 'Today'
    : daysUntil === 1
    ? 'Tomorrow'
    : task.dueDate
    ? formatShortDate(task.dueDate)
    : '';

  return (
    <>
      <div className="flex items-start gap-3 py-2.5 px-3">
        {/* Checkbox */}
        <button
          className="mt-0.5 shrink-0 w-5 h-5 rounded border-2 border-muted-foreground/40 flex items-center justify-center hover:border-primary transition-colors"
          onClick={onComplete}
          aria-label="Mark complete"
        >
          <Check className="w-3 h-3 text-transparent hover:text-primary" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
            {task.high_priority && (
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            )}
          </div>
          {showPath && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.sectionTitle} → {task.subsectionTitle}</p>
          )}
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}
          {dueLabel && (
            <span className={cn('inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full mt-1 font-medium', dueBadgeColor)}>
              <Calendar className="w-2.5 h-2.5" />
              {dueLabel}
            </span>
          )}
        </div>

        {/* Overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPriorityToggle}>
              <Star className="w-3.5 h-3.5 mr-2" />
              {task.high_priority ? 'Remove priority' : 'Mark high priority'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onComplete}>
              <Check className="w-3.5 h-3.5 mr-2" /> Complete
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>"{task.title}" will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const MobileView: React.FC<MobileViewProps> = ({
  sections,
  onComplete,
  onDelete,
  onEdit,
  onPriorityChange,
  onAddSection,
  onAddSubsection,
  onAddTask,
  user,
}) => {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FlatTask | null>(null);

  // Flatten all tasks with metadata
  const allFlatTasks = useMemo<FlatTask[]>(() =>
    sections.flatMap(section =>
      section.subsections.flatMap(sub =>
        sub.tasks.map(task => ({
          ...task,
          sectionId: section.id,
          subsectionId: sub.id,
          sectionTitle: section.title,
          subsectionTitle: sub.title,
          sectionColor: section.color,
        }))
      )
    ),
    [sections]
  );

  const overdueTasks = useMemo(() => allFlatTasks.filter(t => isOverdue(t.dueDate)), [allFlatTasks]);
  const dueTodayTasks = useMemo(() => allFlatTasks.filter(t => isDueToday(t.dueDate)), [allFlatTasks]);
  const dueSoonTasks = useMemo(() => allFlatTasks.filter(t => isDueSoon(t.dueDate)), [allFlatTasks]);

  // Auto-expand sections that have urgent tasks
  const urgentSectionIds = useMemo(() => {
    const ids = new Set<string>();
    [...overdueTasks, ...dueTodayTasks].forEach(t => ids.add(t.sectionId));
    return ids;
  }, [overdueTasks, dueTodayTasks]);

  // On first render, expand urgent sections
  const didInit = React.useRef(false);
  React.useEffect(() => {
    if (!didInit.current && urgentSectionIds.size > 0) {
      setExpandedSections(new Set(urgentSectionIds));
      didInit.current = true;
    }
  }, [urgentSectionIds]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleTaskComplete = (task: FlatTask) => onComplete('task', task.id);
  const handleTaskDelete = (task: FlatTask) => onDelete('task', task.sectionId, task.subsectionId, task.id);
  const handleTaskPriority = (task: FlatTask) => onPriorityChange('task', task.id, !task.high_priority);
  const handleTaskEdit = (task: FlatTask) => setEditingTask(task);
  const handleTaskSave = (title: string, dueDate: string, description: string) => {
    if (!editingTask) return;
    onEdit('task', editingTask.id, title, dueDate || undefined, description || undefined);
  };

  const activeTasks =
    activeFilter === 'overdue' ? overdueTasks :
    activeFilter === 'today' ? dueTodayTasks :
    activeFilter === 'soon' ? dueSoonTasks :
    null;

  const totalTasks = allFlatTasks.length;

  return (
    <div className="flex flex-col gap-3 px-4 py-4 pb-8">

      {/* ── Status pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <StatusPill
          label="Overdue"
          count={overdueTasks.length}
          active={activeFilter === 'overdue'}
          color="purple"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          onClick={() => setActiveFilter(f => f === 'overdue' ? null : 'overdue')}
        />
        <StatusPill
          label="Due Today"
          count={dueTodayTasks.length}
          active={activeFilter === 'today'}
          color="red"
          icon={<Clock className="w-3.5 h-3.5" />}
          onClick={() => setActiveFilter(f => f === 'today' ? null : 'today')}
        />
        <StatusPill
          label="Due Soon"
          count={dueSoonTasks.length}
          active={activeFilter === 'soon'}
          color="amber"
          icon={<Calendar className="w-3.5 h-3.5" />}
          onClick={() => setActiveFilter(f => f === 'soon' ? null : 'soon')}
        />
      </div>

      {/* ── Status task list (accordion) ── */}
      {activeFilter && activeTasks && (
        <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {activeFilter === 'overdue' ? 'No overdue tasks.' :
               activeFilter === 'today' ? 'Nothing due today.' :
               'Nothing coming up soon.'}
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {activeTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showPath
                  onComplete={() => handleTaskComplete(task)}
                  onEdit={handleTaskEdit}
                  onDelete={() => handleTaskDelete(task)}
                  onPriorityToggle={() => handleTaskPriority(task)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add bar ── */}
      <div className="flex gap-2">
        {user && (
          <VoiceInputModal
            compact
            sections={sections}
            onAddSection={onAddSection}
            onAddSubsection={onAddSubsection}
            onAddTask={onAddTask}
          />
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground border-gray-400 dark:border-border"
          onClick={() => setQuickAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Quick add
        </Button>
      </div>

      {/* ── Section cards ── */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="p-4 bg-muted/50 rounded-full">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No sections yet. Use Quick add or Talk to add to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">All tasks ({totalTasks})</p>
          </div>
          {sections.map(section => {
            const sectionTaskCount = section.subsections.reduce((n, s) => n + s.tasks.length, 0);
            const isExpanded = expandedSections.has(section.id);
            const hasUrgent = urgentSectionIds.has(section.id);

            return (
              <div key={section.id} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
                {/* Section header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  {/* Color accent dot */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: section.color ?? '#6b7280' }}
                  />
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">{section.title}</span>
                  {hasUrgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  <Badge variant="secondary" className="text-xs shrink-0">{sectionTaskCount}</Badge>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                </button>

                {/* Subsections + tasks */}
                {isExpanded && (
                  <div className="border-t border-border/40">
                    {section.subsections.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-4 py-3">No subsections yet.</p>
                    ) : (
                      section.subsections.map((sub, subIdx) => (
                        <div key={sub.id}>
                          {subIdx > 0 && <div className="h-px bg-border/30 mx-4" />}
                          {/* Subsection label */}
                          <div className="px-4 pt-2.5 pb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <ChevronRight className="w-3 h-3" />
                              {sub.title}
                              <span className="font-normal normal-case tracking-normal">({sub.tasks.length})</span>
                            </span>
                          </div>
                          {/* Tasks */}
                          {sub.tasks.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-10 pb-2.5">No tasks.</p>
                          ) : (
                            <div className="divide-y divide-border/30">
                              {sub.tasks.map(task => {
                                const flat: FlatTask = {
                                  ...task,
                                  sectionId: section.id,
                                  subsectionId: sub.id,
                                  sectionTitle: section.title,
                                  subsectionTitle: sub.title,
                                  sectionColor: section.color,
                                };
                                return (
                                  <TaskRow
                                    key={task.id}
                                    task={flat}
                                    showPath={false}
                                    onComplete={() => handleTaskComplete(flat)}
                                    onEdit={handleTaskEdit}
                                    onDelete={() => handleTaskDelete(flat)}
                                    onPriorityToggle={() => handleTaskPriority(flat)}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick add dialog ── */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Add</DialogTitle>
          </DialogHeader>
          <PriorityForm
            sections={sections}
            onAddSection={onAddSection}
            onAddSubsection={onAddSubsection}
            onAddTask={async (...args) => {
              await onAddTask(...args);
              setQuickAddOpen(false);
            }}
            activeTab="task"
          />
        </DialogContent>
      </Dialog>

      {/* ── Task edit dialog ── */}
      <TaskEditDialog
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleTaskSave}
      />
    </div>
  );
};

// ── Status Pill ───────────────────────────────────────────────────────────────

interface StatusPillProps {
  label: string;
  count: number;
  active: boolean;
  color: 'purple' | 'red' | 'amber';
  icon: React.ReactNode;
  onClick: () => void;
}

const colorMap = {
  purple: {
    base: 'border-purple-500/40 text-purple-600 dark:text-purple-400',
    active: 'bg-purple-500 text-white border-purple-500',
    badge: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  },
  red: {
    base: 'border-destructive/40 text-destructive',
    active: 'bg-destructive text-white border-destructive',
    badge: 'bg-destructive/20 text-destructive',
  },
  amber: {
    base: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    active: 'bg-amber-500 text-white border-amber-500',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
};

function StatusPill({ label, count, active, color, icon, onClick }: StatusPillProps) {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all',
        active ? c.active : cn('bg-card/50', c.base)
      )}
    >
      {icon}
      {label}
      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-semibold', active ? 'bg-white/20 text-white' : c.badge)}>
        {count}
      </span>
    </button>
  );
}

export default MobileView;

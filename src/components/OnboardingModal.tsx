import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, ChevronRight, CalendarIcon, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Section, Subsection } from '@/types/priorities';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Flow overview:
 *   Phase 'sections'  → add 3 sections (each with a color)
 *   Phase 'flexible'  → add subsections and tasks to Section 0 (the first
 *                        section created). Minimum: 1 subsection + 1 task.
 *                        After minimum met, user can add more or finish.
 *                        Sections 1 & 2 are left for the user to fill later.
 */
type OnboardingPhase =
  | { phase: 'sections' }
  | {
      phase: 'flexible';
      /** Whether we're currently collecting a subsection title or a task title */
      mode: 'subsection' | 'task';
      currentSubsectionId: string | null;
      currentSubsectionTitle: string | null;
      /** All subsections added so far under Section 0 */
      subsections: Array<{ id: string; title: string; taskCount: number }>;
    };

interface OnboardingModalProps {
  open: boolean;
  onSectionAdded: (title: string, color?: string) => Promise<Section>;
  onSubsectionAdded: (sectionId: string, title: string) => Promise<Subsection>;
  onTaskAdded: (
    sectionId: string,
    subsectionId: string,
    title: string,
    dueDate: string,
    description?: string
  ) => Promise<void>;
  onComplete: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SECTION_SUGGESTIONS    = ['Work', 'Personal', 'Health', 'School', 'Finance', 'Family', 'Growth', 'Social'];
const SUBSECTION_SUGGESTIONS = ['Goals', 'Projects', 'To-Do', 'Habits', 'Weekly Review', 'Ideas'];
const TASK_SUGGESTIONS       = ['Set a goal', 'Make a plan', 'Add a check-in', 'Start small', 'Weekly review'];

/** Labels ≥ 15 chars are hidden in PieChart.tsx — hint users to stay under this. */
const TITLE_CHAR_LIMIT = 15;

// Same 16-color palette as HoverInfo.tsx color picker
const COLOR_PALETTE = [
  '#0ea5e9', // Sky blue
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#22c55e', // Green
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f59e0b', // Amber
  '#fb923c', // Orange
  '#f97316', // Deep orange
  '#ef4444', // Red
  '#cc6e6e', // Dusty rose
  '#ec4899', // Pink
  '#a855f7', // Violet
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Pick the next auto-default color that isn't the same as the last used color. */
const pickNextAutoColor = (lastColor: string | null, usedColors: string[]): string => {
  const fresh = COLOR_PALETTE.find((c) => c !== lastColor && !usedColors.includes(c));
  if (fresh) return fresh;
  const differsFromLast = COLOR_PALETTE.find((c) => c !== lastColor);
  return differsFromLast ?? COLOR_PALETTE[1];
};

// ── SuggestionChips ────────────────────────────────────────────────────────────

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
  usedValues?: string[];
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
  usedValues = [],
}) => {
  const available = suggestions.filter(
    (s) => !usedValues.map((v) => v.toLowerCase()).includes(s.toLowerCase())
  );
  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="px-3 py-1 text-sm rounded-full border border-border/60 bg-muted/60 hover:bg-accent hover:text-accent-foreground hover:border-primary/40 transition-colors duration-150 cursor-pointer"
        >
          {s}
        </button>
      ))}
    </div>
  );
};

// ── SectionColorPicker ─────────────────────────────────────────────────────────

interface SectionColorPickerProps {
  selectedColor: string;
  adjacentColor: string | null;
  onSelect: (color: string, manual: boolean) => void;
}

const SectionColorPicker: React.FC<SectionColorPickerProps> = ({
  selectedColor,
  adjacentColor,
  onSelect,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Section Color
      </label>
      <div className="grid grid-cols-8 gap-1.5">
        {COLOR_PALETTE.map((color) => {
          const isSelected = selectedColor === color;
          const isSameAsAdjacent = adjacentColor !== null && color === adjacentColor;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelect(color, true)}
              title={isSameAsAdjacent ? 'Same as previous section' : undefined}
              className={cn(
                'w-7 h-7 rounded-full transition-all duration-150 cursor-pointer relative',
                'hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isSelected
                  ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                  : 'hover:ring-1 hover:ring-offset-1 hover:ring-foreground/40'
              )}
              style={{ backgroundColor: color }}
              aria-label={color}
            >
              {isSameAsAdjacent && !isSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 border border-background" />
              )}
            </button>
          );
        })}
      </div>
      {adjacentColor !== null && selectedColor === adjacentColor && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          This matches your previous section's color — adjacent sections will look the same in the chart.
        </p>
      )}
    </div>
  );
};

// ── SectionBreadcrumb ──────────────────────────────────────────────────────────

interface SectionBreadcrumbProps {
  addedSections: Array<{ title: string; id: string; color: string }>;
  step: OnboardingPhase;
}

const SectionBreadcrumb: React.FC<SectionBreadcrumbProps> = ({ addedSections, step }) => {
  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      {[0, 1, 2].map((i) => {
        const hasSection = addedSections.length > i;
        const isComplete = hasSection;
        const isActive =
          step.phase === 'flexible' && i === 0; // Section 0 is active during flexible phase
        const sectionColor = addedSections[i]?.color;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 max-w-[130px]',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/30'
                : isComplete
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isComplete && sectionColor ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sectionColor }}
              />
            ) : isComplete ? (
              <CheckCircle className="w-3 h-3 shrink-0" />
            ) : null}
            <span className="truncate">{addedSections[i]?.title ?? `Section ${i + 1}`}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── FlexibleItemsTree ──────────────────────────────────────────────────────────

/** Shows the nested subsection → tasks tree for the flexible phase. */
interface FlexibleItemsTreeProps {
  subsections: Array<{ id: string; title: string; taskCount: number }>;
  currentSubsectionId: string | null;
  currentTaskTitles: string[]; // tasks added to the current subsection this session
  accentColor?: string;
}

const FlexibleItemsTree: React.FC<FlexibleItemsTreeProps> = ({
  subsections,
  currentSubsectionId,
  currentTaskTitles,
  accentColor,
}) => {
  if (subsections.length === 0) return null;

  return (
    <div className="space-y-2">
      {subsections.map((sub) => {
        const isCurrent = sub.id === currentSubsectionId;
        return (
          <div key={sub.id} className="space-y-1">
            {/* Subsection row */}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: accentColor ?? undefined }}
              />
              <span className="font-medium truncate">{sub.title}</span>
              {!isCurrent && sub.taskCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({sub.taskCount} task{sub.taskCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            {/* Tasks under this subsection */}
            {isCurrent && currentTaskTitles.length > 0 && (
              <div className="ml-5 space-y-1">
                {currentTaskTitles.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle
                      className="w-3 h-3 shrink-0"
                      style={{ color: accentColor ?? undefined }}
                    />
                    <span className="truncate">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onSectionAdded,
  onSubsectionAdded,
  onTaskAdded,
  onComplete,
}) => {
  const [step, setStep] = useState<OnboardingPhase>({ phase: 'sections' });
  const [addedSections, setAddedSections] = useState<Array<{ title: string; id: string; color: string }>>([]);

  // Task titles added to the *current* subsection (reset when switching subsections)
  const [addedTaskTitles, setAddedTaskTitles] = useState<string[]>([]);

  // Shared input for section/subsection/task title
  const [inputValue, setInputValue] = useState('');

  // Section-phase: selected color
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);

  // Task-phase optional fields
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskDescription, setTaskDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived values ───────────────────────────────────────────────────────────

  const lastSectionColor = addedSections.length > 0
    ? addedSections[addedSections.length - 1].color
    : null;

  const currentSectionColor = addedSections[0]?.color; // flexible phase always works on section 0

  // canFinish: minimum 1 subsection with at least 1 task added
  const canFinish =
    step.phase === 'flexible' &&
    step.subsections.some((s) => s.taskCount >= 1);

  // Total tasks across all subsections (for progress label)
  const totalTasksAdded =
    step.phase === 'flexible'
      ? step.subsections.reduce((acc, s) => acc + s.taskCount, 0) + addedTaskTitles.length
      : 0;

  // Progress percentage
  const progressPercent =
    step.phase === 'sections'
      ? (addedSections.length / 3) * 60
      : canFinish
      ? 90
      : step.mode === 'task'
      ? 80
      : 70;

  // ── Phase-specific content ───────────────────────────────────────────────────

  const getPhaseContent = () => {
    if (step.phase === 'sections') {
      const remaining = 3 - addedSections.length;
      return {
        title: "Let's set up your priorities",
        subtitle: `Add ${remaining} more area${remaining !== 1 ? 's' : ''} of your life to organize`,
        suggestions: SECTION_SUGGESTIONS,
        usedValues: addedSections.map((s) => s.title),
        placeholder: 'e.g., Work, Health, Personal',
        buttonLabel: 'Add Section',
        progressLabel: `${addedSections.length} of 3 sections added`,
        isTask: false,
        isSubsection: false,
      };
    }

    // flexible phase
    const { mode, currentSubsectionTitle, subsections } = step;

    if (mode === 'subsection') {
      const sectionTitle = addedSections[0]?.title ?? '';
      return {
        title: subsections.length === 0
          ? `Break down "${sectionTitle}"`
          : `Add another subsection to "${sectionTitle}"`,
        subtitle: subsections.length === 0
          ? `Add a subsection to organize items within "${sectionTitle}"`
          : `You can keep adding subsections, or finish the tutorial when you're ready`,
        suggestions: SUBSECTION_SUGGESTIONS,
        usedValues: subsections.map((s) => s.title),
        placeholder: 'e.g., Goals, Projects, Habits',
        buttonLabel: 'Add Subsection',
        progressLabel: `${addedSections.length} of 3 sections · ${subsections.length} subsection${subsections.length !== 1 ? 's' : ''}`,
        isTask: false,
        isSubsection: true,
      };
    }

    // task mode
    return {
      title: `Add tasks to "${currentSubsectionTitle}"`,
      subtitle: canFinish
        ? `Keep adding tasks, or finish the tutorial when you're ready`
        : `What's one thing you want to accomplish in "${currentSubsectionTitle}"?`,
      suggestions: TASK_SUGGESTIONS,
      usedValues: addedTaskTitles,
      placeholder: 'e.g., Set a goal, Make a plan',
      buttonLabel: 'Add Task',
      progressLabel: `${addedSections.length} of 3 sections · ${step.subsections.length} subsection${step.subsections.length !== 1 ? 's' : ''} · ${totalTasksAdded} task${totalTasksAdded !== 1 ? 's' : ''}`,
      isTask: true,
      isSubsection: false,
    };
  };

  const content = getPhaseContent();

  // ── Color picker handler ─────────────────────────────────────────────────────

  const handleColorSelect = (color: string, _manual: boolean) => {
    setSelectedColor(color);
    setError(null);
  };

  // ── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // ── Sections phase ────────────────────────────────────────────────────────
      if (step.phase === 'sections') {
        const newSection = await onSectionAdded(trimmed, selectedColor);
        const updated = [
          ...addedSections,
          { title: newSection.title, id: newSection.id, color: selectedColor },
        ];
        setAddedSections(updated);
        setInputValue('');

        const justUsedColor = selectedColor;
        const usedSoFar = updated.map((s) => s.color);
        const nextAutoColor = pickNextAutoColor(justUsedColor, usedSoFar);
        setSelectedColor(nextAutoColor);

        if (updated.length >= 3) {
          setStep({
            phase: 'flexible',
            mode: 'subsection',
            currentSubsectionId: null,
            currentSubsectionTitle: null,
            subsections: [],
          });
        }

      // ── Flexible / subsection mode ────────────────────────────────────────────
      } else if (step.phase === 'flexible' && step.mode === 'subsection') {
        const sectionId = addedSections[0].id;
        const newSub = await onSubsectionAdded(sectionId, trimmed);
        setStep((prev) =>
          prev.phase === 'flexible'
            ? {
                ...prev,
                mode: 'task',
                currentSubsectionId: newSub.id,
                currentSubsectionTitle: newSub.title,
                subsections: [
                  ...prev.subsections,
                  { id: newSub.id, title: newSub.title, taskCount: 0 },
                ],
              }
            : prev
        );
        setInputValue('');
        setAddedTaskTitles([]);

      // ── Flexible / task mode ──────────────────────────────────────────────────
      } else if (step.phase === 'flexible' && step.mode === 'task') {
        const sectionId = addedSections[0].id;
        const subsectionId = step.currentSubsectionId!;
        const formattedDueDate = taskDueDate ? format(taskDueDate, 'yyyy-MM-dd') : '';

        await onTaskAdded(
          sectionId,
          subsectionId,
          trimmed,
          formattedDueDate,
          taskDescription.trim() || undefined
        );

        setStep((prev) =>
          prev.phase === 'flexible'
            ? {
                ...prev,
                subsections: prev.subsections.map((s) =>
                  s.id === subsectionId ? { ...s, taskCount: s.taskCount + 1 } : s
                ),
              }
            : prev
        );

        setTaskDueDate(undefined);
        setTaskDescription('');
        setInputValue('');
        setAddedTaskTitles((prev) => [...prev, trimmed]);
      }
    } catch (err) {
      console.error('[OnboardingModal] submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── "Add Another Subsection" handler ─────────────────────────────────────────

  const handleAddAnotherSubsection = () => {
    setStep((prev) =>
      prev.phase === 'flexible' ? { ...prev, mode: 'subsection' } : prev
    );
    setInputValue('');
    setAddedTaskTitles([]);
    setError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg [&>button:last-child]:hidden max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* ── Disclaimer banner ── */}
        <div className="flex items-start gap-2 rounded-md bg-muted/50 border border-border/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>TUTORIAL: Everything you create here can be changed or deleted from the Edit menu after completing the tutorial.</span>
        </div>

        {/* ── Progress header ── */}
        <div className="space-y-2 mb-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">Getting started</span>
            <span>{content.progressLabel}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* ── Section breadcrumb pills ── */}
        <SectionBreadcrumb addedSections={addedSections} step={step} />

        {/* ── Title / subtitle / tree — two-column when canFinish, stacked otherwise ── */}
        {canFinish ? (
          <div className="flex gap-4 items-start">
            {/* Left: title, subtitle, items tree */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="text-xl font-semibold leading-snug">{content.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{content.subtitle}</p>
              </div>
              <FlexibleItemsTree
                subsections={step.subsections}
                currentSubsectionId={step.currentSubsectionId}
                currentTaskTitles={addedTaskTitles}
                accentColor={currentSectionColor}
              />
            </div>
            {/* Right: action buttons */}
            <div className="flex flex-col gap-2 shrink-0 pt-0.5">
              <Button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                onClick={onComplete}
              >
                Finish Tutorial
                <CheckCircle className="w-4 h-4 ml-1.5 shrink-0" />
              </Button>
              <div className="flex flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleAddAnotherSubsection}
                >
                  + Subsection
                </Button>
                {step.phase === 'flexible' && step.mode === 'task' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setInputValue(''); setError(null); }}
                  >
                    + Task
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Title & subtitle (normal stacked layout) ── */}
            <DialogHeader>
              <DialogTitle className="text-xl leading-snug">{content.title}</DialogTitle>
              <DialogDescription className="text-sm">{content.subtitle}</DialogDescription>
            </DialogHeader>

            {/* ── Section checklist (sections phase only) ── */}
            {step.phase === 'sections' && addedSections.length > 0 && (
              <div className="space-y-1.5">
                {addedSections.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Flexible phase items tree ── */}
            {step.phase === 'flexible' && (
              <FlexibleItemsTree
                subsections={step.subsections}
                currentSubsectionId={step.currentSubsectionId}
                currentTaskTitles={addedTaskTitles}
                accentColor={currentSectionColor}
              />
            )}
          </>
        )}

        {/* ── Suggestion chips ── */}
        <SuggestionChips
          suggestions={content.suggestions}
          usedValues={content.usedValues}
          onSelect={(val) => {
            setInputValue(val);
            setError(null);
          }}
        />

        {/* ── Input form ── */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title input */}
          <div className="space-y-1">
            <Input
              autoFocus
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              placeholder={content.placeholder}
              className="bg-background/80"
              disabled={isSubmitting}
              style={
                step.phase === 'sections'
                  ? { borderLeftColor: selectedColor, borderLeftWidth: '3px' }
                  : currentSectionColor
                  ? { borderLeftColor: currentSectionColor, borderLeftWidth: '3px' }
                  : undefined
              }
            />
            {/* Character limit hint */}
            {!content.isTask && (
              <p className="text-xs text-muted-foreground">
                Tip: Keep titles under {TITLE_CHAR_LIMIT} characters for best display in the chart.
              </p>
            )}
            {content.isTask && (
              <p className="text-xs text-muted-foreground">
                Tip: Keep the title brief — add extra details in the description below.
              </p>
            )}
          </div>

          {/* Color picker — sections phase only */}
          {step.phase === 'sections' && (
            <SectionColorPicker
              selectedColor={selectedColor}
              adjacentColor={lastSectionColor}
              onSelect={handleColorSelect}
            />
          )}

          {/* Task-phase optional fields */}
          {step.phase === 'flexible' && step.mode === 'task' && (
            <>
              {/* Due Date picker */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Due Date <span className="font-normal">(optional)</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-background/80',
                        !taskDueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {taskDueDate ? format(taskDueDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={taskDueDate}
                      onSelect={setTaskDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description textarea */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Description <span className="font-normal">(optional)</span>
                </label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Add more details about this task..."
                  className="bg-background/80 resize-none"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* Error message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!inputValue.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : content.buttonLabel}
            {!isSubmitting && <ChevronRight className="w-4 h-4 ml-1 shrink-0" />}
          </Button>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

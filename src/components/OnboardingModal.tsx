import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, ChevronRight, CalendarIcon } from 'lucide-react';

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
 *   Phase 'sections'   → add 3 sections (each with a color)
 *   Phase 'subsection' → add subsection(s) to current section
 *                         sectionIndex 0: requires 1 subsection (then moves to task)
 *                         sectionIndex 1: requires 2 subsections (then moves to task for each)
 *                         sectionIndex 2: requires 1 subsection (then moves to task phase that needs 3 tasks)
 *   Phase 'task'       → add task(s) to the most-recently-added subsection
 *                         sectionIndex 0: requires 1 task
 *                         sectionIndex 1: requires 1 task per subsection (handled by looping back to subsection)
 *                         sectionIndex 2: requires 3 tasks in the single subsection
 */
type OnboardingPhase =
  | { phase: 'sections' }
  | {
      phase: 'subsection';
      sectionIndex: number;
      /** how many subsections have been added to this section so far */
      subsectionsAddedCount: number;
    }
  | {
      phase: 'task';
      sectionIndex: number;
      subsectionId: string;
      subsectionTitle: string;
      /** how many tasks have been added to this subsection so far */
      tasksAddedCount: number;
      /** which subsection within the section (0-based) — used for sec 1 multi-sub loop */
      subsectionIndexWithinSection: number;
      /** total subsections added to this section — needed to know when to advance */
      totalSubsectionsInSection: number;
    };

// Per-section requirements
// Section 0: 1 sub → 1 task  (simple intro)
// Section 1: sub→task→sub→task  (shows multiple subsections; 1 task each)
// Section 2: 1 sub → 3 tasks  (shows multiple tasks per subsection)
const SUBSECTION_REQUIREMENTS = [1, 2, 1]; // total subs needed per section
const TASK_REQUIREMENTS       = [1, 1, 3]; // tasks needed per subsection

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
const TASK_SUGGESTIONS       = ['Set a goal', 'Make a plan', 'Schedule a check-in', 'Start something small', 'Do a weekly review'];

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

// Total progress steps (used for the progress bar):
// 3 sections + (1 sub + 1 task) + (2 sub + 2 task) + (1 sub + 3 task) = 3+2+4+4 = 13
const TOTAL_STEPS = 13;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns a sequential step number 1–13 for the progress bar.
 *
 * Sections:          1, 2, 3
 * Section 0:         4 (sub0), 5 (task0)
 * Section 1:         6 (sub0), 7 (task0), 8 (sub1), 9 (task1)   ← interleaved sub→task→sub→task
 * Section 2:         10 (sub0), 11 (task0), 12 (task1), 13 (task2)
 */
const computeOverallStep = (step: OnboardingPhase, sectionsAdded: number): number => {
  if (step.phase === 'sections') return sectionsAdded + 1; // 1–3

  const { sectionIndex } = step;

  if (sectionIndex === 0) {
    if (step.phase === 'subsection') return 4;
    return 5 + step.tasksAddedCount; // 5
  }

  if (sectionIndex === 1) {
    // sub0=6, task0=7, sub1=8, task1=9
    if (step.phase === 'subsection') {
      return 6 + step.subsectionsAddedCount * 2; // 6 (before sub0) or 8 (before sub1)
    }
    return 7 + step.subsectionIndexWithinSection * 2 + step.tasksAddedCount; // 7 or 9
  }

  // sectionIndex === 2: sub0=10, task0=11, task1=12, task2=13
  if (step.phase === 'subsection') return 10;
  return 11 + step.tasksAddedCount; // 11, 12, 13
};

/** Pick the next auto-default color that isn't the same as the last used color. */
const pickNextAutoColor = (lastColor: string | null, usedColors: string[]): string => {
  // First try: a color that differs from lastColor AND hasn't been used yet
  const fresh = COLOR_PALETTE.find((c) => c !== lastColor && !usedColors.includes(c));
  if (fresh) return fresh;
  // Fallback: any color that just differs from lastColor
  const differsFromLast = COLOR_PALETTE.find((c) => c !== lastColor);
  return differsFromLast ?? COLOR_PALETTE[1]; // should never reach last fallback
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
  adjacentColor: string | null; /** the color of the previously added section */
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
              {/* Subtle warning dot for same-as-adjacent (manual override still allowed) */}
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
        const isComplete =
          hasSection &&
          (step.phase !== 'sections' || addedSections.length > i);
        const isActive =
          step.phase !== 'sections' &&
          ((step.phase === 'subsection' && step.sectionIndex === i) ||
           (step.phase === 'task' && step.sectionIndex === i));
        const sectionColor = addedSections[i]?.color;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 max-w-[130px]',
              isComplete
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isActive
                ? 'bg-primary/10 text-primary border border-primary/30'
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

// ── AddedItemsList ─────────────────────────────────────────────────────────────

/** Shows subsections or tasks added so far within the current phase, with checkmarks. */
interface AddedItemsListProps {
  items: string[];
  accentColor?: string;
}

const AddedItemsList: React.FC<AddedItemsListProps> = ({ items, accentColor }) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: accentColor ?? undefined }}
          />
          <span className="truncate">{item}</span>
        </div>
      ))}
    </div>
  );
};

// ── MinimumRequirementBadge ────────────────────────────────────────────────────

/** Shows "X of Y added" with a subtle progress indicator. */
interface RequirementBadgeProps {
  current: number;
  required: number;
  label: string; /** e.g. "subsection" */
}

const RequirementBadge: React.FC<RequirementBadgeProps> = ({ current, required, label }) => {
  const met = current >= required;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit',
        met
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {met ? (
        <CheckCircle className="w-3 h-3 shrink-0" />
      ) : (
        <span className="w-3 h-3 rounded-full border border-current shrink-0" />
      )}
      {current} of {required} {label}{required !== 1 ? 's' : ''} added
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

  // Subsections & tasks added within the *current* section/subsection (reset per section/subsection)
  const [addedSubsectionTitles, setAddedSubsectionTitles] = useState<string[]>([]);
  const [addedTaskTitles, setAddedTaskTitles] = useState<string[]>([]);

  // Shared input for section/subsection/task title
  const [inputValue, setInputValue] = useState('');

  // Section-phase: selected color + whether user manually picked it
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [colorManuallyChosen, setColorManuallyChosen] = useState(false);

  // Task-phase optional fields
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskDescription, setTaskDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived values ───────────────────────────────────────────────────────────

  const overallStep = computeOverallStep(step, addedSections.length);
  const progressPercent = Math.min(((overallStep - 1) / TOTAL_STEPS) * 100, 100);

  const lastSectionColor = addedSections.length > 0
    ? addedSections[addedSections.length - 1].color
    : null;

  // Current section's color for the breadcrumb accent (subsection/task phases)
  const currentSectionColor =
    step.phase !== 'sections'
      ? addedSections[step.sectionIndex]?.color
      : undefined;

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
        requiredCount: null,
        addedCount: null,
        requirementLabel: '',
      };
    }

    if (step.phase === 'subsection') {
      const { sectionIndex, subsectionsAddedCount } = step;
      const sectionTitle = addedSections[sectionIndex]?.title ?? '';
      const required = SUBSECTION_REQUIREMENTS[sectionIndex];

      // Section 1 interleaves sub→task, so subtitle varies by which sub we're on
      const isSecondSubOfSec1 = sectionIndex === 1 && subsectionsAddedCount === 1;
      const subtitle =
        sectionIndex === 0
          ? `Add a subsection to organize items within "${sectionTitle}"`
          : isSecondSubOfSec1
          ? `Great! Now add a second subsection to "${sectionTitle}" — sections can hold multiple areas`
          : `Add a subsection to "${sectionTitle}" — showing how one section holds multiple areas`; // sec1 first sub or sec2

      return {
        title: `Break down "${sectionTitle}"`,
        subtitle,
        suggestions: SUBSECTION_SUGGESTIONS,
        usedValues: addedSubsectionTitles,
        placeholder: 'e.g., Goals, Projects, Habits',
        buttonLabel: 'Add Subsection',
        progressLabel: `Section ${sectionIndex + 1} of 3 — subsection ${subsectionsAddedCount + 1}${required > 1 ? ` of ${required}` : ''}`,
        requiredCount: required,
        addedCount: subsectionsAddedCount,
        requirementLabel: 'subsection',
      };
    }

    // task phase
    const { sectionIndex, subsectionTitle, tasksAddedCount } = step;
    const required = TASK_REQUIREMENTS[sectionIndex];
    const remaining = required - tasksAddedCount;

    const subtitleMap: Record<number, string> = {
      0: `What's one thing you want to accomplish in "${subsectionTitle}"?`,
      1: `Add a task to "${subsectionTitle}"`,
      2: `Add ${required} tasks to "${subsectionTitle}" — showing how a subsection holds multiple actions`,
    };

    return {
      title: `Add task${required > 1 ? 's' : ''} to "${subsectionTitle}"`,
      subtitle: subtitleMap[sectionIndex] ?? subtitleMap[0],
      suggestions: TASK_SUGGESTIONS,
      usedValues: addedTaskTitles,
      placeholder: 'e.g., Set a goal, Make a plan',
      buttonLabel:
        tasksAddedCount >= required - 1
          ? 'Add Task & Continue'
          : `Add Task (${remaining - 1 > 0 ? `${remaining - 1} more needed` : 'last one!'})`,
      progressLabel: `Section ${sectionIndex + 1} of 3 — adding task`,
      requiredCount: required,
      addedCount: tasksAddedCount,
      requirementLabel: 'task',
    };
  };

  const content = getPhaseContent();

  // ── Color picker handler ─────────────────────────────────────────────────────

  const handleColorSelect = (color: string, manual: boolean) => {
    setSelectedColor(color);
    setColorManuallyChosen(manual);
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
        setColorManuallyChosen(false);

        // Auto-pick next color: must differ from the color just used (adjacency rule)
        const justUsedColor = selectedColor;
        const usedSoFar = updated.map((s) => s.color);
        const nextAutoColor = pickNextAutoColor(justUsedColor, usedSoFar);
        setSelectedColor(nextAutoColor);

        if (updated.length >= 3) {
          setStep({ phase: 'subsection', sectionIndex: 0, subsectionsAddedCount: 0 });
          setAddedSubsectionTitles([]);
        }

      // ── Subsection phase ──────────────────────────────────────────────────────
      } else if (step.phase === 'subsection') {
        const { sectionIndex, subsectionsAddedCount } = step;
        const sectionId = addedSections[sectionIndex].id;

        const newSub = await onSubsectionAdded(sectionId, trimmed);
        const newCount = subsectionsAddedCount + 1;
        const newTitles = [...addedSubsectionTitles, trimmed];
        setAddedSubsectionTitles(newTitles);
        setInputValue('');

        // Always move to task phase immediately after adding a subsection.
        // For section 1 (needs 2 subsections): after tasks for sub1 are done,
        // the task handler loops back to subsection phase for sub2.
        setStep({
          phase: 'task',
          sectionIndex,
          subsectionId: newSub.id,
          subsectionTitle: newSub.title,
          tasksAddedCount: 0,
          subsectionIndexWithinSection: newCount - 1, // 0-based index of this sub
          totalSubsectionsInSection: newCount,        // running total (will update if loop returns)
        });
        setAddedTaskTitles([]);

      // ── Task phase ────────────────────────────────────────────────────────────
      } else if (step.phase === 'task') {
        const {
          sectionIndex,
          subsectionId,
          tasksAddedCount,
          subsectionIndexWithinSection,
        } = step;
        const sectionId = addedSections[sectionIndex].id;
        const formattedDueDate = taskDueDate ? format(taskDueDate, 'yyyy-MM-dd') : '';
        const required = TASK_REQUIREMENTS[sectionIndex];

        await onTaskAdded(
          sectionId,
          subsectionId,
          trimmed,
          formattedDueDate,
          taskDescription.trim() || undefined
        );

        const newTaskCount = tasksAddedCount + 1;
        const newTaskTitles = [...addedTaskTitles, trimmed];

        // Reset task-specific fields
        setTaskDueDate(undefined);
        setTaskDescription('');
        setInputValue('');
        setAddedTaskTitles(newTaskTitles);

        if (newTaskCount >= required) {
          // Done with tasks for this subsection.
          // For section 1: if we've only completed sub 0's tasks, loop back to
          // add sub 1, then do sub 1's tasks, then advance to section 2.
          const subsectionsRequired = SUBSECTION_REQUIREMENTS[sectionIndex];
          const nextSubsectionIndex = subsectionIndexWithinSection + 1;

          if (nextSubsectionIndex < subsectionsRequired) {
            // More subsections needed in this section — go back to subsection phase
            setStep({
              phase: 'subsection',
              sectionIndex,
              subsectionsAddedCount: nextSubsectionIndex, // subs already added
            });
            // Keep addedSubsectionTitles so the list shows all subs added so far
            setAddedTaskTitles([]);
          } else {
            // All subsections and their tasks done — move to next section
            const nextSectionIndex = sectionIndex + 1;
            if (nextSectionIndex < 3) {
              setStep({
                phase: 'subsection',
                sectionIndex: nextSectionIndex,
                subsectionsAddedCount: 0,
              });
              setAddedSubsectionTitles([]);
              setAddedTaskTitles([]);
            } else {
              onComplete();
            }
          }
        } else {
          // More tasks needed — stay in task phase
          setStep({
            phase: 'task',
            sectionIndex,
            subsectionId,
            subsectionTitle: step.subsectionTitle,
            tasksAddedCount: newTaskCount,
            subsectionIndexWithinSection,
            totalSubsectionsInSection: step.totalSubsectionsInSection,
          });
        }
      }
    } catch (err) {
      console.error('[OnboardingModal] submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg [&>button:last-child]:hidden max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* ── Progress header ── */}
        <div className="space-y-2 mb-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">
              Step {overallStep} of {TOTAL_STEPS}
            </span>
            <span>{content.progressLabel}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* ── Section breadcrumb pills ── */}
        <SectionBreadcrumb addedSections={addedSections} step={step} />

        {/* ── Title & subtitle ── */}
        <DialogHeader>
          <DialogTitle className="text-xl leading-snug">{content.title}</DialogTitle>
          <DialogDescription className="text-sm">{content.subtitle}</DialogDescription>
        </DialogHeader>

        {/* ── Requirement badge (subsection / task phases) ── */}
        {content.requiredCount !== null && content.addedCount !== null && content.requiredCount > 1 && (
          <RequirementBadge
            current={content.addedCount}
            required={content.requiredCount}
            label={content.requirementLabel}
          />
        )}

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

        {/* ── Added subsections list (subsection phase) ── */}
        {step.phase === 'subsection' && (
          <AddedItemsList
            items={addedSubsectionTitles}
            accentColor={currentSectionColor}
          />
        )}

        {/* ── Added tasks list (task phase) ── */}
        {step.phase === 'task' && (
          <AddedItemsList
            items={addedTaskTitles}
            accentColor={currentSectionColor}
          />
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
          {/* Title input — always shown */}
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

          {/* Color picker — sections phase only */}
          {step.phase === 'sections' && (
            <SectionColorPicker
              selectedColor={selectedColor}
              adjacentColor={lastSectionColor}
              onSelect={handleColorSelect}
            />
          )}

          {/* Task-phase optional fields */}
          {step.phase === 'task' && (
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

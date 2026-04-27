import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Section, Subsection } from '@/types/priorities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Mic,
  MicOff,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  high_priority: boolean;
}

interface ParsedSubsection {
  title: string;
  tasks: ParsedTask[];
}

interface ParsedSection {
  title: string;
  matchedExistingId?: string;
  subsections: ParsedSubsection[];
}

type Stage = 'idle' | 'recording' | 'processing' | 'preview' | 'adding' | 'done';

interface VoiceInputModalProps {
  sections: Section[];
  onAddSection: (title: string) => Promise<Section>;
  onAddSubsection: (sectionId: string, title: string) => Promise<Subsection>;
  onAddTask: (
    sectionId: string,
    subsectionId: string,
    title: string,
    dueDate: string,
    description?: string
  ) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countItems(sections: ParsedSection[]) {
  return sections.reduce(
    (acc, s) => acc + s.subsections.reduce((a, sub) => a + sub.tasks.length, 0),
    0
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  sections,
  onAddSection,
  onAddSubsection,
  onAddTask,
}) => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [addingProgress, setAddingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Recording ────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(blob, mimeType);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setElapsed(0);
      setStage('recording');

      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      console.error(err);
    }
  }, [sections]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    setStage('processing');
  }, []);

  // ── Processing ───────────────────────────────────────────────────────────

  const processAudio = useCallback(async (blob: Blob, mimeType: string) => {
    setStage('processing');
    setError(null);
    try {
      const form = new FormData();
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', blob, `recording.${ext}`);
      form.append(
        'existingSections',
        JSON.stringify(sections.map((s) => ({ id: s.id, title: s.title })))
      );
      form.append('today', new Date().toISOString().split('T')[0]);

      const { data, error: fnError } = await supabase.functions.invoke('parse-voice', {
        body: form,
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setTranscript(data.transcript ?? '');
      setParsedSections(data.sections ?? []);
      setStage('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStage('idle');
    }
  }, [sections]);

  // ── Editing preview ──────────────────────────────────────────────────────

  const removeTask = (sIdx: number, subIdx: number, tIdx: number) => {
    setParsedSections((prev) => {
      const next = structuredClone(prev);
      next[sIdx].subsections[subIdx].tasks.splice(tIdx, 1);
      // Remove empty subsections
      next[sIdx].subsections = next[sIdx].subsections.filter((sub) => sub.tasks.length > 0);
      // Remove empty sections
      return next.filter((s) => s.subsections.length > 0);
    });
  };

  // ── Confirming ───────────────────────────────────────────────────────────

  const confirmAdd = useCallback(async () => {
    setStage('adding');
    const totalTasks = countItems(parsedSections);
    let done = 0;

    try {
      for (const parsedSection of parsedSections) {
        let sectionId = parsedSection.matchedExistingId;
        if (!sectionId) {
          const newSection = await onAddSection(parsedSection.title);
          sectionId = newSection.id;
        }
        for (const sub of parsedSection.subsections) {
          const newSub = await onAddSubsection(sectionId, sub.title);
          for (const task of sub.tasks) {
            await onAddTask(
              sectionId,
              newSub.id,
              task.title,
              task.dueDate ?? '',
              task.description
            );
            done++;
            setAddingProgress(Math.round((done / totalTasks) * 100));
          }
        }
      }
      setStage('done');
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add some items. Please try again.');
      setStage('preview');
    }
  }, [parsedSections, onAddSection, onAddSubsection, onAddTask]);

  const resetState = () => {
    setStage('idle');
    setElapsed(0);
    setTranscript('');
    setParsedSections([]);
    setTranscriptExpanded(false);
    setAddingProgress(0);
    setError(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && (stage === 'recording' || stage === 'adding')) return; // prevent close mid-flow
    if (!val) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      resetState();
    }
    setOpen(val);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const totalTasks = countItems(parsedSections);

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        className="w-full border-dashed border-gray-400 dark:border-border text-muted-foreground hover:text-foreground gap-2"
        onClick={() => { setOpen(true); }}
      >
        <Mic className="w-4 h-4" />
        Talk to add
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              Talk to add tasks
            </DialogTitle>
          </DialogHeader>

          {/* ── IDLE ── */}
          {stage === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-4">
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Describe your week, goals, or upcoming tasks out loud. I'll organise them into
                sections, subsections, and tasks automatically.
              </p>
              <Button onClick={startRecording} size="lg" className="gap-2 bg-gradient-primary hover:opacity-90">
                <Mic className="w-5 h-5" />
                Start recording
              </Button>
            </div>
          )}

          {/* ── RECORDING ── */}
          {stage === 'recording' && (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Pulsing mic */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
                <div className="absolute w-16 h-16 rounded-full bg-red-500/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <Mic className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-2xl font-mono font-semibold tabular-nums text-foreground">
                {formatTime(elapsed)}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Speak naturally — describe your sections, tasks, due dates, and priorities.
              </p>
              <Button onClick={stopRecording} variant="outline" size="lg" className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10">
                <MicOff className="w-5 h-5" />
                Stop recording
              </Button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {stage === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Transcribing and parsing your tasks…</p>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {stage === 'preview' && (
            <div className="flex flex-col gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              {parsedSections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks could be parsed. Try recording again.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Review the items below. Remove anything that's incorrect, then confirm.
                  </p>

                  {/* Tree view */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {parsedSections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-1.5">
                        {/* Section row */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{section.title}</span>
                          <Badge variant={section.matchedExistingId ? 'secondary' : 'outline'} className="text-xs">
                            {section.matchedExistingId ? 'Existing' : 'New'}
                          </Badge>
                        </div>

                        {section.subsections.map((sub, subIdx) => (
                          <div key={subIdx} className="ml-3 space-y-1">
                            {/* Subsection row */}
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              {sub.title}
                            </p>

                            {sub.tasks.map((task, tIdx) => (
                              <div
                                key={tIdx}
                                className="ml-4 flex items-start justify-between gap-2 p-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-foreground">{task.title}</span>
                                    {task.high_priority && (
                                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                    )}
                                    {task.dueDate && (
                                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {task.dueDate}
                                      </span>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeTask(sIdx, subIdx, tIdx)}
                                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                                  title="Remove task"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Transcript collapsible */}
                  <div className="border-t border-border/50 pt-2">
                    <button
                      onClick={() => setTranscriptExpanded((v) => !v)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn('w-3 h-3 transition-transform', transcriptExpanded && 'rotate-180')} />
                      {transcriptExpanded ? 'Hide' : 'Show'} transcript
                    </button>
                    {transcriptExpanded && (
                      <p className="mt-2 text-xs text-muted-foreground italic leading-relaxed">{transcript}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { resetState(); }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Start over
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-gradient-primary hover:opacity-90"
                      onClick={confirmAdd}
                      disabled={totalTasks === 0}
                    >
                      <Check className="w-4 h-4" />
                      Add {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ADDING ── */}
          {stage === 'adding' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Adding your tasks…</p>
              <Progress value={addingProgress} className="w-full" />
            </div>
          )}

          {/* ── DONE ── */}
          {stage === 'done' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">All done!</p>
              <p className="text-xs text-muted-foreground">Your tasks have been added to the chart.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceInputModal;

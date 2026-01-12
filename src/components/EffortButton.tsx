import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { Flower, Star, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EffortButtonProps {
  taskId: string;
  userId: string;
  animationIcon?: 'flower' | 'star' | 'sparkle';
  onEffortRecorded?: () => void;
}

const EffortButton: React.FC<EffortButtonProps> = ({
  taskId,
  userId,
  animationIcon = 'flower',
  onEffortRecorded,
}) => {
  const { toast } = useToast();
  const [hasWorkedToday, setHasWorkedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if effort already recorded today
  useEffect(() => {
    const checkEffortToday = async () => {
      try {
        const now = new Date();
        const pstNow = toZonedTime(now, 'America/Los_Angeles');
        const today = format(pstNow, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('task_effort')
          .select('id')
          .eq('task_id', taskId)
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (error) throw error;
        setHasWorkedToday(!!data);
      } catch (error) {
        console.error('Error checking effort:', error);
      } finally {
        setIsChecking(false);
      }
    };

    if (taskId && userId) {
      checkEffortToday();
    }
  }, [taskId, userId]);

  const handleRecordEffort = async () => {
    if (hasWorkedToday || isLoading) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const pstNow = toZonedTime(now, 'America/Los_Angeles');
      const today = format(pstNow, 'yyyy-MM-dd');

      // Check again to prevent race conditions
      const { data: existing } = await supabase
        .from('task_effort')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        setHasWorkedToday(true);
        toast({
          title: "Already recorded",
          description: "You've already marked effort on this task today.",
        });
        return;
      }

      // Insert effort record
      const { error } = await supabase
        .from('task_effort')
        .insert({
          task_id: taskId,
          user_id: userId,
          date: today,
        });

      if (error) throw error;

      setHasWorkedToday(true);

      toast({
        title: "Effort recorded",
        description: "Your effort has been recorded for today.",
      });

      if (onEffortRecorded) {
        onEffortRecorded();
      }
    } catch (error) {
      console.error('Error recording effort:', error);
      toast({
        title: "Error",
        description: "Failed to record effort. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (animationIcon) {
      case 'star':
        return <Star className="w-3 h-3" />;
      case 'sparkle':
        return <Sparkles className="w-3 h-3" />;
      case 'flower':
      default:
        return <Flower className="w-3 h-3" />;
    }
  };

  if (isChecking) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="border-gray-400 dark:border-border"
      >
        {getIcon()}
        <span className="ml-1 text-xs">Checking...</span>
      </Button>
    );
  }

  return (
    <Button
      id={`effort-button-${taskId}`}
      variant="outline"
      size="sm"
      onClick={handleRecordEffort}
      disabled={hasWorkedToday || isLoading}
      className="border-gray-400 dark:border-border"
      title={hasWorkedToday ? "Already worked on today" : "Mark effort for today"}
    >
      {getIcon()}
      <span className="ml-1 text-xs">
        {hasWorkedToday ? 'Worked on' : 'Worked on today'}
      </span>
    </Button>
  );
};

export default EffortButton;


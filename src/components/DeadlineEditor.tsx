import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DeadlineEditorProps {
  userId: string;
}

const DeadlineEditor: React.FC<DeadlineEditorProps> = ({ userId }) => {
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeadline();
  }, [userId]);

  const loadDeadline = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('deadline_date')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.deadline_date) {
        setDeadline(new Date(data.deadline_date));
      } else {
        // Default to December 31st of current year
        const defaultDeadline = new Date(new Date().getFullYear(), 11, 31);
        setDeadline(defaultDeadline);
      }
    } catch (error) {
      console.error('Error loading deadline:', error);
      // Set default deadline on error
      const defaultDeadline = new Date(new Date().getFullYear(), 11, 31);
      setDeadline(defaultDeadline);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDeadline = async (date: Date) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          deadline_date: format(date, 'yyyy-MM-dd'),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setDeadline(date);
      toast({
        title: 'Deadline updated',
        description: `New deadline: ${format(date, 'PPP')}`,
      });
    } catch (error) {
      console.error('Error saving deadline:', error);
      toast({
        title: 'Error',
        description: 'Failed to save deadline',
        variant: 'destructive',
      });
    }
  };

  // Calculate progress and generate month markers
  const getProgressData = () => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = deadline;
    
    // If deadline has passed, return 100% progress
    if (deadlineDate < now) {
      return { progress: 100, months: [], totalDays: 0, remainingDays: 0 };
    }

    // Calculate total days from start of January to deadline
    const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
    const endOfDeadlineMonth = endOfMonth(deadlineDate);
    const totalDays = differenceInDays(endOfDeadlineMonth, startOfYear);
    const remainingDays = differenceInDays(deadlineDate, now);
    
    // Generate dynamic month markers: Jan, Jul, current month, Dec
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const july = new Date(now.getFullYear(), 6, 1); // July (month 6)
    const december = new Date(now.getFullYear(), 11, 1); // December (month 11)
    
    const months = [
      new Date(now.getFullYear(), 0, 1), // January
      july,
      currentMonth,
      december
    ].filter((month, index, array) => {
      // Remove duplicates and ensure months are in chronological order
      return array.indexOf(month) === index;
    }).sort((a, b) => a.getTime() - b.getTime());

    const progress = Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));

    return { progress, months, totalDays, remainingDays };
  };

  const progressData = getProgressData();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Loading deadline...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto p-0 font-normal text-sm hover:bg-transparent",
              !deadline && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                <span className="sm:hidden">Deadline: </span>
                <span className="hidden sm:inline">Goal Deadline: </span>
                {deadline ? format(deadline, 'PPP') : 'Set deadline'}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={deadline}
            onSelect={(date) => date && saveDeadline(date)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      
      {/* Progress bar for desktop only */}
      {progressData && deadline && (
        <div className="hidden sm:block w-full">
          <div className="relative">
            {/* Progress bar background */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary transition-all duration-300 ease-out"
                style={{ width: `${progressData.progress}%` }}
              />
            </div>
            
            {/* Month tick markers positioned proportionally */}
            <div className="relative mt-1">
              {progressData.months.map((month, index) => {
                // Calculate the position as a percentage of the year
                const startOfYear = new Date(month.getFullYear(), 0, 1);
                const endOfYear = new Date(month.getFullYear(), 11, 31);
                const totalDaysInYear = differenceInDays(endOfYear, startOfYear);
                const daysFromStart = differenceInDays(month, startOfYear);
                const positionPercent = (daysFromStart / totalDaysInYear) * 100;
                
                return (
                  <div 
                    key={index} 
                    className="absolute flex flex-col items-center"
                    style={{ left: `${positionPercent}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-px h-1 bg-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(month, 'MMM')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlineEditor;

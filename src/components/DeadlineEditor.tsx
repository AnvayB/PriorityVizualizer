import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Loading deadline...</span>
      </div>
    );
  }

  return (
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
              Goal Deadline: {deadline ? format(deadline, 'PPP') : 'Set deadline'}
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
  );
};

export default DeadlineEditor;

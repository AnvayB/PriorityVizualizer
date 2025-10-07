import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompletionCounterProps {
  userId: string;
  refreshTrigger?: number;
}

const CompletionCounter: React.FC<CompletionCounterProps> = ({ userId, refreshTrigger = 0 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Array<{
    id: string;
    task_title: string;
    section_title: string;
    subsection_title: string;
    completed_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompletionData();
  }, [userId, refreshTrigger]);

  const loadCompletionData = async () => {
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      // Fetch daily count for today
      const { data: dailyData, error: dailyError } = await supabase
        .from('completion_stats')
        .select('daily_count')
        .eq('user_id', userId)
        .eq('date', todayString)
        .maybeSingle();

      if (dailyError) throw dailyError;

      setDailyCount(dailyData?.daily_count || 0);

      // Fetch total count (sum of all daily_count)
      const { data: totalData, error: totalError } = await supabase
        .from('completion_stats')
        .select('daily_count')
        .eq('user_id', userId);

      if (totalError) throw totalError;

      const total = totalData?.reduce((sum, record) => sum + record.daily_count, 0) || 0;
      setTotalCount(total);

      // Fetch completed tasks for today
      const { data: tasksData, error: tasksError } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false });

      if (tasksError) throw tasksError;

      setCompletedTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-2 border-success/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success animate-pulse" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-success/30 cursor-pointer hover:bg-card/70 hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all duration-200 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 rounded-lg group-hover:bg-success/30 transition-colors">
                  <CheckCircle className="w-5 h-5 text-success group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dailyCount}</p>
                  <p className="text-sm text-muted-foreground group-hover:text-success/80 transition-colors">Completed Today</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Completed Today ({dailyCount})
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Total: {totalCount}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {dailyCount === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Completed Today</h3>
              <p className="text-muted-foreground">Complete some tasks to see them here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Great job! You've completed {dailyCount} task{dailyCount !== 1 ? 's' : ''} today.
              </p>
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{task.task_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.section_title} → {task.subsection_title || 'N/A'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Completed at {formatTime(task.completed_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionCounter;
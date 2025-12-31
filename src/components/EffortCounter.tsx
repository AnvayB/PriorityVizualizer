import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, subDays, parseISO, startOfDay } from 'date-fns';
import { Flame, Target } from 'lucide-react';

interface EffortCounterProps {
  userId: string;
  refreshTrigger?: number;
}

const EffortCounter: React.FC<EffortCounterProps> = ({ userId, refreshTrigger = 0 }) => {
  const [dailyCount, setDailyCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEffortData();
  }, [userId, refreshTrigger]);

  const loadEffortData = async () => {
    try {
      setIsLoading(true);
      const PST_TZ = 'America/Los_Angeles';
      
      // Get today's date in PST
      const now = new Date();
      const pstNow = toZonedTime(now, PST_TZ);
      const todayString = format(pstNow, 'yyyy-MM-dd');
      
      // Get start of today in PST (midnight PST)
      const startOfTodayPST = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate(), 0, 0, 0);
      
      // Convert PST midnight to UTC for database queries
      const startOfTodayUTC = fromZonedTime(startOfTodayPST, PST_TZ).toISOString();
      
      // Get start of tomorrow in PST
      const startOfTomorrowPST = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate() + 1, 0, 0, 0);
      const startOfTomorrowUTC = fromZonedTime(startOfTomorrowPST, PST_TZ).toISOString();

      // Fetch today's effort count
      const { data: todayEffort, error: todayError } = await supabase
        .from('task_effort')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfTodayUTC)
        .lt('created_at', startOfTomorrowUTC);

      if (todayError) throw todayError;
      
      setDailyCount(todayEffort?.length || 0);

      // Calculate streak - fetch all effort records
      const { data: allEffort, error: allError } = await supabase
        .from('task_effort')
        .select('date, created_at')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (allError) throw allError;

      // Calculate unique dates with effort
      const dateSet = new Set<string>();
      allEffort?.forEach((effort) => {
        const effortDate = parseISO(effort.date);
        const pstDate = toZonedTime(effortDate, PST_TZ);
        dateSet.add(format(pstDate, 'yyyy-MM-dd'));
      });

      const uniqueDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

      // Calculate current streak (from today backwards)
      let streak = 0;
      let daysBack = 0;
      
      while (daysBack < 1000) { // Safety limit
        const checkDate = subDays(pstNow, daysBack);
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        
        if (dateSet.has(dateKey)) {
          streak++;
          daysBack++;
        } else {
          // Gap found, streak is broken
          if (streak === 0 && daysBack === 0) {
            daysBack++;
            continue;
          }
          break;
        }
      }

      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading effort data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-3/20 rounded-lg">
                <Target className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{isLoading ? '...' : dailyCount}</p>
                <p className="text-sm text-muted-foreground">Effort Today</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">{isLoading ? '...' : currentStreak}</p>
                <p className="text-xs text-muted-foreground">Effort Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default EffortCounter;


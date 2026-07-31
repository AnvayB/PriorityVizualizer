import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import AnalyticsDashboard from './AnalyticsDashboard';

interface CompletionCounterProps {
  userId: string;
  refreshTrigger?: number;
  activeWorkspaceId?: string | null;
}

const CompletionCounter: React.FC<CompletionCounterProps> = ({ userId, refreshTrigger = 0, activeWorkspaceId }) => {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompletionData();
  }, [userId, refreshTrigger, activeWorkspaceId]);

  const loadCompletionData = async () => {
    try {
      const PST_TZ = 'America/Los_Angeles';

      const now = new Date();
      const pstNow = toZonedTime(now, PST_TZ);
      const startOfTodayPST = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate(), 0, 0, 0);
      const startOfTodayUTC = fromZonedTime(startOfTodayPST, PST_TZ).toISOString();
      const startOfTomorrowPST = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate() + 1, 0, 0, 0);
      const startOfTomorrowUTC = fromZonedTime(startOfTomorrowPST, PST_TZ).toISOString();

      // Fetch workspace section titles for filtering (if workspace is set)
      let workspaceSectionTitles: string[] | null = null;
      if (activeWorkspaceId) {
        const { data } = await supabase
          .from('sections')
          .select('title')
          .eq('workspace_id', activeWorkspaceId);
        workspaceSectionTitles = data ? data.map(s => s.title) : null;
      }

      // Daily count from completed_tasks, filtered by workspace
      let dailyQuery = supabase
        .from('completed_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfTodayUTC)
        .lt('completed_at', startOfTomorrowUTC);
      if (workspaceSectionTitles) dailyQuery = dailyQuery.in('section_title', workspaceSectionTitles);
      const { count: dailyCount, error: dailyError } = await dailyQuery;
      if (dailyError) throw dailyError;
      setDailyCount(dailyCount ?? 0);

      // Total count from completed_tasks, filtered by workspace
      let totalQuery = supabase
        .from('completed_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (workspaceSectionTitles) totalQuery = totalQuery.in('section_title', workspaceSectionTitles);
      const { count: totalCount, error: totalError } = await totalQuery;
      if (totalError) throw totalError;
      setTotalCount(totalCount ?? 0);
    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setIsLoading(false);
    }
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
    <>
      <Card 
        className="bg-card/50 backdrop-blur-sm border-2 border-success/30 cursor-pointer hover:bg-card/70 hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all duration-200 group"
        onClick={() => setIsAnalyticsOpen(true)}
      >
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
      <AnalyticsDashboard
        userId={userId}
        isOpen={isAnalyticsOpen}
        onOpenChange={setIsAnalyticsOpen}
        activeWorkspaceId={activeWorkspaceId}
      />
    </>
  );
};

export default CompletionCounter;
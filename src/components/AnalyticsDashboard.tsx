import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import * as d3 from 'd3';
import { BarChart3, TrendingUp, Calendar, Flame, Trophy, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface AnalyticsDashboardProps {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyStats {
  date: string;
  count: number;
}

interface SectionStats {
  section: string;
  count: number;
}

interface DailySectionStats {
  date: string;
  sections: { [section: string]: number };
  total: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId, isOpen, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<'completion' | 'effort'>('completion');
  
  // Completion analytics state
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [dailySectionStats, setDailySectionStats] = useState<DailySectionStats[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [bestDay, setBestDay] = useState<{ date: string; count: number } | null>(null);
  const [momentum, setMomentum] = useState<{ value: number | null; status: 'positive' | 'negative' | 'neutral' | 'not-enough-data' | 'new-activity' }>({ value: null, status: 'not-enough-data' });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [sectionColors, setSectionColors] = useState<{ [key: string]: string }>({});
  const [supabaseSectionColors, setSupabaseSectionColors] = useState<{ [key: string]: string }>({});
  
  // Effort analytics state
  const [isEffortLoading, setIsEffortLoading] = useState(true);
  const [effortDailyStats, setEffortDailyStats] = useState<DailyStats[]>([]);
  const [effortTotalCount, setEffortTotalCount] = useState(0);
  const [effortAvgDaily, setEffortAvgDaily] = useState(0);
  const [effortCurrentStreak, setEffortCurrentStreak] = useState(0);
  const [effortLongestStreak, setEffortLongestStreak] = useState(0);
  const [effortConsistencyScore, setEffortConsistencyScore] = useState(0);
  
  const lineChartRef = useRef<SVGSVGElement>(null);
  const effortChartRef = useRef<SVGSVGElement>(null);

  const PST_TZ = 'America/Los_Angeles';

  useEffect(() => {
    if (isOpen && userId) {
      if (activeTab === 'completion') {
      loadAnalyticsData();
      } else {
        loadEffortAnalyticsData();
    }
    }
  }, [isOpen, userId, activeTab]);

  useEffect(() => {
    if (dailySectionStats.length > 0) {
      // Use a small timeout to ensure the tab content is visible and DOM is ready
      const timer = setTimeout(() => {
        if (lineChartRef.current) {
          drawStackedBarChart();
        }
      }, 100);
      
      // Handle window resize
      const handleResize = () => {
        if (lineChartRef.current) {
          drawStackedBarChart();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [dailySectionStats, sectionStats, sectionColors, supabaseSectionColors]);


  const calculateStreaks = (allDailyStats: DailyStats[]) => {
    if (allDailyStats.length === 0) {
      return { current: 0, longest: 0 };
    }

    const dateSet = new Set(allDailyStats.map(d => d.date));

    // Get today's date in PST
    const now = new Date();
    const pstNow = toZonedTime(now, PST_TZ);
    const todayString = format(pstNow, 'yyyy-MM-dd');

    // Calculate current streak (from today backwards)
    let currentStreak = 0;
    let daysBack = 0;
    
    // Start checking from today
    while (daysBack < 1000) { // Safety limit
      const checkDate = subDays(pstNow, daysBack);
      const dateKey = format(checkDate, 'yyyy-MM-dd');
      
      if (dateSet.has(dateKey)) {
        currentStreak++;
        daysBack++;
      } else {
        // Gap found, streak is broken
        // If we haven't found any streak yet and it's today, continue to yesterday
        if (currentStreak === 0 && daysBack === 0) {
          daysBack++;
          continue;
        }
        break;
      }
    }

    // Calculate longest streak (all time)
    const sortedDates = [...allDailyStats].sort((a, b) => a.date.localeCompare(b.date));
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const stat of sortedDates) {
      const currentDate = parseISO(stat.date);
      
      if (prevDate === null) {
        // First date
        tempStreak = 1;
        longestStreak = 1;
      } else {
        // Calculate days difference
        const daysDiff = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          // Gap found, reset streak
          tempStreak = 1;
        }
      }
      
      prevDate = currentDate;
    }

    return { current: currentStreak, longest: longestStreak };
  };

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      // Get date range (last 60 days for chart display)
      const now = new Date();
      const pstNow = toZonedTime(now, PST_TZ);
      const sixtyDaysAgo = subDays(pstNow, 60);
      const startDateUTC = fromZonedTime(startOfDay(sixtyDaysAgo), PST_TZ).toISOString();

      // Fetch all completed tasks for last 30 days (for charts)
      const { data: tasksData, error: tasksError } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDateUTC)
        .order('completed_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch ALL completed tasks for streak calculation
      const { data: allTasksData, error: allTasksError } = await supabase
        .from('completed_tasks')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: true });

      if (allTasksError) throw allTasksError;

      // Fetch section colors from Supabase
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('title, color')
        .eq('user_id', userId);

      if (sectionsError) {
        console.warn('Could not fetch section colors:', sectionsError);
      } else {
        // Create a map of section title to color
        const colorMap: { [key: string]: string } = {};
        sectionsData?.forEach((section) => {
          if (section.color) {
            colorMap[section.title] = section.color;
          }
        });
        setSupabaseSectionColors(colorMap);
      }

      // Process daily stats with section breakdown
      const dailyMap = new Map<string, number>();
      const sectionMap = new Map<string, number>();
      const dailySectionMap = new Map<string, { [section: string]: number }>();

      tasksData?.forEach((task) => {
        const completedAt = parseISO(task.completed_at);
        const pstDate = toZonedTime(completedAt, PST_TZ);
        const dateKey = format(pstDate, 'yyyy-MM-dd');

        // Daily stats
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);

        // Section stats
        sectionMap.set(task.section_title, (sectionMap.get(task.section_title) || 0) + 1);

        // Daily section breakdown
        if (!dailySectionMap.has(dateKey)) {
          dailySectionMap.set(dateKey, {});
        }
        const daySections = dailySectionMap.get(dateKey)!;
        daySections[task.section_title] = (daySections[task.section_title] || 0) + 1;
      });

      // Convert to arrays and sort
      const dailyArray: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const sectionArray: SectionStats[] = Array.from(sectionMap.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count);

      // Create daily section stats
      const dailySectionArray: DailySectionStats[] = Array.from(dailySectionMap.entries())
        .map(([date, sections]) => ({
          date,
          sections,
          total: Object.values(sections).reduce((sum, count) => sum + count, 0),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyStats(dailyArray);
      setSectionStats(sectionArray);
      setDailySectionStats(dailySectionArray);

      // Calculate statistics
      const total = tasksData?.length || 0;
      setTotalTasks(total);
      setAvgDaily(dailyArray.length > 0 ? total / dailyArray.length : 0);

      // Calculate consistency score: (Active Days ÷ Total Days) × 100
      // For last 60 days
      const activeDays = dailyArray.length;
      const totalDays = 60;
      const consistency = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;
      setConsistencyScore(Math.round(consistency));

      const best = dailyArray.reduce(
        (max, day) => (day.count > max.count ? day : max),
        { date: '', count: 0 }
      );
      setBestDay(best.count > 0 ? best : null);

      // Calculate Momentum
      // Reuse pstNow from earlier in function
      // Create a map of date to count for easy lookup
      const dateToCountMap = new Map<string, number>();
      dailyArray.forEach(stat => {
        dateToCountMap.set(stat.date, stat.count);
      });
      
      // Calculate last 7 days (A) and previous 7 days (B)
      let totalLast7Days = 0;
      let totalPrevious7Days = 0;
      
      // Count tasks in last 7 days (days 0-6)
      for (let i = 0; i < 7; i++) {
        const checkDate = subDays(pstNow, i);
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        const count = dateToCountMap.get(dateKey) || 0;
        totalLast7Days += count;
      }
      
      // Count tasks in previous 7 days (days 7-13)
      for (let i = 7; i < 14; i++) {
        const checkDate = subDays(pstNow, i);
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        const count = dateToCountMap.get(dateKey) || 0;
        totalPrevious7Days += count;
      }
      
      // Calculate averages (always divide by 7, even if some days have 0 tasks)
      const A = totalLast7Days / 7; // Average over last 7 days
      const B = totalPrevious7Days / 7; // Average over previous 7 days
      
      // Check if we have fewer than 14 total days of data across all time
      if (dailyArray.length < 14) {
        // Not enough data across entire dataset
        setMomentum({ value: null, status: 'not-enough-data' });
      } else if (B === 0 && A > 0) {
        // New activity (B = 0 but A > 0)
        setMomentum({ value: null, status: 'new-activity' });
      } else {
        // Calculate momentum percentage: ((A - B) / max(B, 1)) * 100
        const momentumValue = ((A - B) / Math.max(B, 1)) * 100;
        const status = momentumValue > 0 ? 'positive' : momentumValue < 0 ? 'negative' : 'neutral';
        setMomentum({ value: momentumValue, status });
      }

      // Calculate streaks from all tasks
      if (allTasksData && allTasksData.length > 0) {
        const allDailyMap = new Map<string, number>();
        allTasksData.forEach((task) => {
          const completedAt = parseISO(task.completed_at);
          const pstDate = toZonedTime(completedAt, PST_TZ);
          const dateKey = format(pstDate, 'yyyy-MM-dd');
          allDailyMap.set(dateKey, (allDailyMap.get(dateKey) || 0) + 1);
        });

        const allDailyArray: DailyStats[] = Array.from(allDailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const streaks = calculateStreaks(allDailyArray);
        setCurrentStreak(streaks.current);
        setLongestStreak(streaks.longest);
      } else {
        setCurrentStreak(0);
        setLongestStreak(0);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEffortAnalyticsData = async () => {
    try {
      setIsEffortLoading(true);

      // Get date range (last 60 days)
      const now = new Date();
      const pstNow = toZonedTime(now, PST_TZ);
      const sixtyDaysAgo = subDays(pstNow, 60);
      const startDateUTC = fromZonedTime(startOfDay(sixtyDaysAgo), PST_TZ).toISOString();

      // Fetch effort records for last 60 days
      const { data: effortData, error: effortError } = await supabase
        .from('task_effort')
        .select('date, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDateUTC)
        .order('date', { ascending: true });

      if (effortError) throw effortError;

      // Fetch ALL effort records for streak calculation
      const { data: allEffortData, error: allEffortError } = await supabase
        .from('task_effort')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (allEffortError) throw allEffortError;

      // Process daily stats
      const dailyMap = new Map<string, number>();
      effortData?.forEach((effort) => {
        const effortDate = parseISO(effort.date);
        const pstDate = toZonedTime(effortDate, PST_TZ);
        const dateKey = format(pstDate, 'yyyy-MM-dd');
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
      });

      // Convert to array and sort
      const dailyArray: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setEffortDailyStats(dailyArray);

      // Calculate statistics
      const total = effortData?.length || 0;
      setEffortTotalCount(total);
      setEffortAvgDaily(dailyArray.length > 0 ? total / dailyArray.length : 0);

      // Calculate consistency score
      const activeDays = dailyArray.length;
      const totalDays = 60;
      const consistency = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;
      setEffortConsistencyScore(Math.round(consistency));

      // Calculate streaks from all effort records
      if (allEffortData && allEffortData.length > 0) {
        const allDailyMap = new Map<string, number>();
        allEffortData.forEach((effort) => {
          const effortDate = parseISO(effort.date);
          const pstDate = toZonedTime(effortDate, PST_TZ);
          const dateKey = format(pstDate, 'yyyy-MM-dd');
          allDailyMap.set(dateKey, (allDailyMap.get(dateKey) || 0) + 1);
        });

        const allDailyArray: DailyStats[] = Array.from(allDailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const streaks = calculateStreaks(allDailyArray);
        setEffortCurrentStreak(streaks.current);
        setEffortLongestStreak(streaks.longest);
      } else {
        setEffortCurrentStreak(0);
        setEffortLongestStreak(0);
      }
    } catch (error) {
      console.error('Error loading effort analytics data:', error);
    } finally {
      setIsEffortLoading(false);
    }
  };

  const drawStackedBarChart = () => {
    if (!lineChartRef.current || dailySectionStats.length === 0 || sectionStats.length === 0) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove();

    // Get the actual width of the SVG container
    const containerWidth = lineChartRef.current.getBoundingClientRect().width || 750;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Update SVG viewBox to be responsive
    svg.attr('viewBox', `0 0 ${containerWidth} 300`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get top 5 sections for stacking
    const topSections = sectionStats.slice(0, 5).map(s => s.section);
    const sectionKeys = [...topSections];
    
    // Default colors
    const defaultColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--muted-foreground))',
    ];
    
    // Color scale for sections (use custom colors, then Supabase colors, then defaults)
    const getColor = (section: string, index: number) => {
      // Priority: user-selected color > Supabase color > default color
      return sectionColors[section] || supabaseSectionColors[section] || defaultColors[index] || defaultColors[index];
    };

    // Create date scale for x-axis
    const xScale = d3
      .scaleBand()
      .domain(dailySectionStats.map((d) => d.date))
      .range([0, width])
      .padding(0.2);

    // Calculate max total for y-axis (+2 padding)
    const maxTotal = d3.max(dailySectionStats, (d) => d.total) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxTotal + 2])
      .nice()
      .range([height, 0]);

    // Prepare data for stacking
    interface StackedDataPoint {
      date: string;
      [key: string]: number | string;
    }
    
    const stackedDataPoints: StackedDataPoint[] = dailySectionStats.map((d) => {
      const result: StackedDataPoint = { date: d.date };
      
      topSections.forEach((section) => {
        result[section] = d.sections[section] || 0;
      });

      return result;
    });

    // Stack the data
    const stack = d3.stack<StackedDataPoint>().keys(sectionKeys);
    const stackedData = stack(stackedDataPoints);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1);

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1);

    // Create stacked bars
    const groups = g
      .selectAll('g.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer');

    groups
      .selectAll('rect')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.data.date) || 0)
      .attr('y', (d) => yScale(d[1]))
      .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('fill', (d, i, nodes) => {
        const parentData = d3.select(nodes[i].parentNode as Element).datum() as d3.Series<StackedDataPoint, string>;
        const sectionIndex = sectionKeys.indexOf(parentData.key);
        return getColor(parentData.key, sectionIndex);
      });

    // Add total value labels on top of bars
    g.selectAll('text.bar-label')
      .data(dailySectionStats)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (xScale(d.date) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.total) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--foreground))')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .text((d) => d.total);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => {
            const date = parseISO(d as string);
            return format(date, 'MMM d');
          })
      )
      .selectAll('text')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '11px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '12px');
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics <span className="text-sm text-muted-foreground font-normal">(in the last 60 days)</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'completion' | 'effort')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="effort">Effort</TabsTrigger>
          </TabsList>

          <TabsContent value="completion" className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Streak Cards - High Priority */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <span className="text-lg">🔥</span>
                    Current Streak
                  </CardTitle>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-orange-500">{currentStreak}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentStreak === 0 
                      ? 'Start today!' 
                      : currentStreak === 1 
                      ? 'day in a row' 
                      : 'days in a row'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <span className="text-lg">🏆</span>
                    Best Streak
                  </CardTitle>
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-yellow-500">{longestStreak}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {longestStreak === 0 
                      ? 'No streak yet' 
                      : longestStreak === 1 
                      ? 'day (all time)' 
                      : 'days (all time)'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-blue-500" />
                    Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-blue-500 mb-2">{consistencyScore}%</div>
                  <Progress value={consistencyScore} className="h-1.5 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {dailyStats.length} / 60 days
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">Total Tasks</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Total number of tasks completed in the last 60 days.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm font-bold">{totalTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">Avg Tasks/Day</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Average number of tasks completed per day, calculated as total tasks divided by the number of days with completed tasks.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm font-bold">{avgDaily.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">Momentum</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Momentum compares your average daily completions over the last 7 days to the previous week.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm font-bold flex items-center gap-1">
                        {momentum.status === 'not-enough-data' && (
                          <span className="text-muted-foreground">Not enough data</span>
                        )}
                        {momentum.status === 'new-activity' && (
                          <span className="text-foreground">New activity</span>
                        )}
                        {momentum.status === 'positive' && momentum.value !== null && (
                          <span className="text-foreground flex items-center gap-1">
                            <ArrowUp className="w-4 h-4" />
                            {Math.round(momentum.value)}%
                          </span>
                        )}
                        {momentum.status === 'negative' && momentum.value !== null && (
                          <span className="text-foreground flex items-center gap-1">
                            <ArrowDown className="w-4 h-4" />
                            {Math.abs(Math.round(momentum.value))}%
                          </span>
                        )}
                        {momentum.status === 'neutral' && momentum.value !== null && (
                          <span className="text-foreground">0%</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">Missed Days</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Number of days in the last 60 days where no tasks were completed.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm font-bold">{60 - dailyStats.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="w-full space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Completion Trends by Section</CardTitle>
                  {/* <CardDescription>Tasks completed over the last 60 days, broken down by section</CardDescription> */}
                </CardHeader>
                <CardContent>
                  {dailySectionStats.length > 0 && sectionStats.length > 0 ? (
                    <div className="relative">
                      <svg
                        ref={lineChartRef}
                        width="100%"
                        height={300}
                        className="w-full"
                      />
                      {/* Merged legend with color pickers */}
                      <div className="absolute right-4 top-5 space-y-2 bg-card/95 backdrop-blur-sm p-3 rounded-lg border border-border shadow-sm">
                        {(() => {
                          const topSections = sectionStats.slice(0, 5).map(s => s.section);
                          const sectionKeys = [...topSections];
                          const defaultColors = [
                            'hsl(var(--chart-1))',
                            'hsl(var(--chart-2))',
                            'hsl(var(--chart-3))',
                            'hsl(var(--chart-4))',
                            'hsl(var(--chart-5))',
                          ];
                          
                          const hslToHex = (hsl: string): string => {
                            if (hsl.startsWith('#')) return hsl;
                            const colorMap: { [key: string]: string } = {
                              'hsl(var(--chart-1))': '#3b82f6',
                              'hsl(var(--chart-2))': '#ec4899',
                              'hsl(var(--chart-3))': '#10b981',
                              'hsl(var(--chart-4))': '#f97316',
                              'hsl(var(--chart-5))': '#8b5cf6',
                            };
                            return colorMap[hsl] || '#3b82f6';
                          };
                          
                          return sectionKeys.map((section, i) => {
                            // Priority: user-selected color > Supabase color > default color
                            const currentColor = sectionColors[section] || supabaseSectionColors[section] || defaultColors[i];
                            const hexColor = currentColor.startsWith('#') ? currentColor : hslToHex(currentColor);
                            const inputId = `color-picker-${section}`;
                            return (
                              <div key={section} className="flex items-center gap-2 relative">
                                <label 
                                  htmlFor={inputId}
                                  className="w-4 h-4 rounded border border-border flex-shrink-0 cursor-pointer"
                                  style={{ backgroundColor: hexColor }}
                                  title={`Click to change color for ${section}`}
                                />
                                <input
                                  id={inputId}
                                  type="color"
                                  value={hexColor}
                                  onChange={(e) => {
                                    setSectionColors((prev) => ({
                                      ...prev,
                                      [section]: e.target.value,
                                    }));
                                  }}
                                  className="sr-only"
                                />
                                <span className="text-xs text-foreground font-medium">{section}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      No data available for the last 60 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="effort" className="space-y-6">
        {isEffortLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Effort Streak Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <span className="text-lg">🔥</span>
                    Current Streak
                  </CardTitle>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-orange-500">{effortCurrentStreak}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {effortCurrentStreak === 0 
                      ? 'Start today!' 
                      : effortCurrentStreak === 1 
                      ? 'day in a row' 
                      : 'days in a row'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <span className="text-lg">🏆</span>
                    Best Streak
                  </CardTitle>
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-yellow-500">{effortLongestStreak}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {effortLongestStreak === 0 
                      ? 'No streak yet' 
                      : effortLongestStreak === 1 
                      ? 'day (all time)' 
                      : 'days (all time)'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-blue-500" />
                    Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="text-2xl font-bold text-blue-500 mb-2">{effortConsistencyScore}%</div>
                  <Progress value={effortConsistencyScore} className="h-1.5 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {effortDailyStats.length} / 60 days
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Effort</span>
                      <span className="text-sm font-bold">{effortTotalCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Avg Effort/Day</span>
                      <span className="text-sm font-bold">{effortAvgDaily.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Missed Days</span>
                      <span className="text-sm font-bold">{60 - effortDailyStats.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Effort Chart */}
            {effortDailyStats.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Effort Trends</CardTitle>
                  <CardDescription>Effort recorded over the last 60 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    Chart visualization coming soon
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No effort data available for the last 60 days
                </CardContent>
              </Card>
            )}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsDashboard;


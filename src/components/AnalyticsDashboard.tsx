import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import * as d3 from 'd3';
import { BarChart3, TrendingUp, Calendar, Flame, Trophy, Target } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [dailySectionStats, setDailySectionStats] = useState<DailySectionStats[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [bestDay, setBestDay] = useState<{ date: string; count: number } | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [sectionColors, setSectionColors] = useState<{ [key: string]: string }>({});
  const [supabaseSectionColors, setSupabaseSectionColors] = useState<{ [key: string]: string }>({});
  
  const lineChartRef = useRef<SVGSVGElement>(null);

  const PST_TZ = 'America/Los_Angeles';

  useEffect(() => {
    if (isOpen && userId) {
      loadAnalyticsData();
    }
  }, [isOpen, userId]);

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

    // Get top 3 sections for stacking, rest go to ".etc"
    const topSections = sectionStats.slice(0, 3).map(s => s.section);
    const sectionKeys = [...topSections, '.etc'];
    
    // Default colors
    const defaultColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
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
      let otherCount = 0;
      
      topSections.forEach((section) => {
        result[section] = d.sections[section] || 0;
      });
      
      // Calculate ".etc" as everything not in top 3
      Object.keys(d.sections).forEach((section) => {
        if (!topSections.includes(section)) {
          otherCount += d.sections[section];
        }
      });
      result['.etc'] = otherCount;
      
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
            Task Completion Analytics
          </DialogTitle>
        </DialogHeader>

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
                      <span className="text-xs text-muted-foreground">Total Tasks</span>
                      <span className="text-sm font-bold">{totalTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Avg Tasks/Day</span>
                      <span className="text-sm font-bold">{avgDaily.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Max/Day</span>
                      <span className="text-sm font-bold">{bestDay?.count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Days w/ Tasks</span>
                      <span className="text-sm font-bold">{dailyStats.length}</span>
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
                  <CardDescription>Tasks completed over the last 60 days, broken down by section</CardDescription>
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
                          const topSections = sectionStats.slice(0, 3).map(s => s.section);
                          const sectionKeys = [...topSections, '.etc'];
                          const defaultColors = [
                            'hsl(var(--chart-1))',
                            'hsl(var(--chart-2))',
                            'hsl(var(--chart-3))',
                            'hsl(var(--muted-foreground))',
                          ];
                          
                          const hslToHex = (hsl: string): string => {
                            if (hsl.startsWith('#')) return hsl;
                            const colorMap: { [key: string]: string } = {
                              'hsl(var(--chart-1))': '#3b82f6',
                              'hsl(var(--chart-2))': '#ec4899',
                              'hsl(var(--chart-3))': '#10b981',
                              'hsl(var(--muted-foreground))': '#6b7280',
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
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsDashboard;


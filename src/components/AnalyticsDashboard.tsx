import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import * as d3 from 'd3';
import { BarChart3, PieChart, TrendingUp, Clock, Calendar } from 'lucide-react';

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

interface TimeStats {
  hour: number;
  count: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId, isOpen, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [bestDay, setBestDay] = useState<{ date: string; count: number } | null>(null);
  
  const lineChartRef = useRef<SVGSVGElement>(null);
  const pieChartRef = useRef<SVGSVGElement>(null);
  const barChartRef = useRef<SVGSVGElement>(null);

  const PST_TZ = 'America/Los_Angeles';

  useEffect(() => {
    if (isOpen && userId) {
      loadAnalyticsData();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (dailyStats.length > 0 && lineChartRef.current) {
      drawLineChart();
    }
  }, [dailyStats]);

  useEffect(() => {
    if (sectionStats.length > 0 && pieChartRef.current) {
      drawPieChart();
    }
  }, [sectionStats]);

  useEffect(() => {
    if (timeStats.length > 0 && barChartRef.current) {
      drawBarChart();
    }
  }, [timeStats]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      // Get date range (last 30 days)
      const now = new Date();
      const pstNow = toZonedTime(now, PST_TZ);
      const thirtyDaysAgo = subDays(pstNow, 30);
      const startDateUTC = fromZonedTime(startOfDay(thirtyDaysAgo), PST_TZ).toISOString();

      // Fetch all completed tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDateUTC)
        .order('completed_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Process daily stats
      const dailyMap = new Map<string, number>();
      const sectionMap = new Map<string, number>();
      const timeMap = new Map<number, number>();

      tasksData?.forEach((task) => {
        const completedAt = parseISO(task.completed_at);
        const pstDate = toZonedTime(completedAt, PST_TZ);
        const dateKey = format(pstDate, 'yyyy-MM-dd');
        const hour = pstDate.getHours();

        // Daily stats
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);

        // Section stats
        sectionMap.set(task.section_title, (sectionMap.get(task.section_title) || 0) + 1);

        // Time stats
        timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
      });

      // Convert to arrays and sort
      const dailyArray: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const sectionArray: SectionStats[] = Array.from(sectionMap.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count);

      // Initialize all 24 hours
      const timeArray: TimeStats[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: timeMap.get(i) || 0,
      }));

      setDailyStats(dailyArray);
      setSectionStats(sectionArray);
      setTimeStats(timeArray);

      // Calculate statistics
      const total = tasksData?.length || 0;
      setTotalTasks(total);
      setAvgDaily(dailyArray.length > 0 ? total / dailyArray.length : 0);

      const best = dailyArray.reduce(
        (max, day) => (day.count > max.count ? day : max),
        { date: '', count: 0 }
      );
      setBestDay(best.count > 0 ? best : null);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const drawLineChart = () => {
    if (!lineChartRef.current || dailyStats.length === 0) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dailyStats, (d) => parseISO(d.date)) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(dailyStats, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(7)
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

    // Add line
    const line = d3
      .line<DailyStats>()
      .x((d) => xScale(parseISO(d.date)))
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dailyStats)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--chart-1))')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('circle')
      .data(dailyStats)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(parseISO(d.date)))
      .attr('cy', (d) => yScale(d.count))
      .attr('r', 4)
      .attr('fill', 'hsl(var(--chart-1))')
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(7))
      .selectAll('text')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .style('font-size', '12px');
  };

  const drawPieChart = () => {
    if (!pieChartRef.current || sectionStats.length === 0) return;

    const svg = d3.select(pieChartRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3
      .scaleOrdinal<string>()
      .domain(sectionStats.map((d) => d.section))
      .range([
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
      ]);

    const pie = d3.pie<SectionStats>().value((d) => d.count);

    const arc = d3
      .arc<d3.PieArcDatum<SectionStats>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g
      .selectAll('arc')
      .data(pie(sectionStats))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.section))
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2);

    // Add labels
    const labelArc = d3
      .arc<d3.PieArcDatum<SectionStats>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    arcs
      .append('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--foreground))')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text((d) => d.data.count);
  };

  const drawBarChart = () => {
    if (!barChartRef.current || timeStats.length === 0) return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(timeStats.map((d) => d.hour.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(timeStats, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Add bars
    g.selectAll('rect')
      .data(timeStats)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.hour.toString()) || 0)
      .attr('y', (d) => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d.count))
      .attr('fill', 'hsl(var(--chart-1))')
      .attr('rx', 4);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => `${d}:00`))
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgDaily.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Tasks per day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Day</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bestDay?.count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {bestDay ? format(parseISO(bestDay.date), 'MMM d') : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Days</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dailyStats.length}</div>
                  <p className="text-xs text-muted-foreground">Days with completions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Daily Trends
                </TabsTrigger>
                <TabsTrigger value="sections">
                  <PieChart className="w-4 h-4 mr-2" />
                  By Section
                </TabsTrigger>
                <TabsTrigger value="time">
                  <Clock className="w-4 h-4 mr-2" />
                  Time of Day
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Completion Trends</CardTitle>
                    <CardDescription>Tasks completed over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyStats.length > 0 ? (
                      <svg
                        ref={lineChartRef}
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No data available for the last 30 days
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sections" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Completion by Section</CardTitle>
                    <CardDescription>Distribution of completed tasks across sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sectionStats.length > 0 ? (
                      <div className="flex flex-col md:flex-row gap-6">
                        <svg
                          ref={pieChartRef}
                          width={400}
                          height={400}
                          className="mx-auto"
                        />
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold mb-4">Section Breakdown</h4>
                          {sectionStats.map((stat, idx) => (
                            <div
                              key={stat.section}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            >
                              <span className="text-sm font-medium">{stat.section}</span>
                              <span className="text-sm font-bold">{stat.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No section data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Completion by Time of Day</CardTitle>
                    <CardDescription>When you complete tasks (PST timezone)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timeStats.length > 0 ? (
                      <svg
                        ref={barChartRef}
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        No time data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsDashboard;


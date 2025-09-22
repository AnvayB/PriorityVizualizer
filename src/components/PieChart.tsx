import React, { useState, useMemo } from 'react';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';

interface PieChartProps {
  sections: Section[];
  onHover?: (slice: ChartSlice | null) => void;
  onSliceClick?: (slice: ChartSlice) => void;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

const PieChart: React.FC<PieChartProps> = ({ sections, onHover, onSliceClick }) => {
  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);

  const chartData = useMemo(() => {
    const slices: ChartSlice[] = [];
    
    if (sections.length === 0) return [];

    // Calculate dynamic scaling based on text content
    const maxTitleLength = Math.max(
      ...sections.map(s => s.title.length),
      ...sections.flatMap(s => s.subsections.map(sub => sub.title.length)),
      ...sections.flatMap(s => s.subsections.flatMap(sub => sub.tasks.map(task => task.title.length)))
    );
    
    // Scale factor based on content - minimum 1.0, increases with longer titles
    const scaleFactor = Math.max(1.0, 1 + (maxTitleLength - 10) * 0.05);
    
    let currentAngle = 0;
    const baseRadius = 80 * scaleFactor;
    const subsectionRadius = 140 * scaleFactor;
    const taskRadius = 200 * scaleFactor;
    
    // Each section gets equal portion of 360 degrees
    const sectionAngle = 360 / sections.length;

    sections.forEach((section, sectionIndex) => {
      const sectionColor = section.color || CHART_COLORS[sectionIndex % CHART_COLORS.length];
      const sectionStartAngle = currentAngle;
      const sectionEndAngle = currentAngle + sectionAngle;

      // Add section slice
      slices.push({
        section,
        startAngle: sectionStartAngle,
        endAngle: sectionEndAngle,
        radius: baseRadius,
        level: 'section',
        color: sectionColor,
      });

      // Calculate subsection angles within this section
      const subsectionCount = Math.max(section.subsections.length, 1);
      const subsectionAngleSize = sectionAngle / subsectionCount;
      let subsectionCurrentAngle = sectionStartAngle;

      if (section.subsections.length > 0) {
        section.subsections.forEach((subsection, subIndex) => {
          const subsectionStartAngle = subsectionCurrentAngle;
          const subsectionEndAngle = subsectionCurrentAngle + subsectionAngleSize;
          const subsectionColor = sectionColor.replace(')', ', 0.7)').replace('hsl(', 'hsla(');

          slices.push({
            section,
            subsection,
            startAngle: subsectionStartAngle,
            endAngle: subsectionEndAngle,
            radius: subsectionRadius,
            level: 'subsection',
            color: subsectionColor,
          });

          // Calculate task angles within this subsection
          const taskCount = Math.max(subsection.tasks.length, 1);
          const taskAngleSize = subsectionAngleSize / taskCount;
          let taskCurrentAngle = subsectionStartAngle;

          if (subsection.tasks.length > 0) {
            subsection.tasks.forEach((task, taskIndex) => {
              const taskStartAngle = taskCurrentAngle;
              const taskEndAngle = taskCurrentAngle + taskAngleSize;
              const taskColor = subsectionColor.replace('0.7', '0.5');

              slices.push({
                section,
                subsection,
                task,
                startAngle: taskStartAngle,
                endAngle: taskEndAngle,
                radius: taskRadius,
                level: 'task',
                color: taskColor,
              });

              taskCurrentAngle += taskAngleSize;
            });
          }

          subsectionCurrentAngle += subsectionAngleSize;
        });
      }

      currentAngle += sectionAngle;
    });

    return slices;
  }, [sections]);

  // Calculate dynamic dimensions based on content
  const maxTitleLength = sections.length > 0 ? Math.max(
    ...sections.map(s => s.title.length),
    ...sections.flatMap(s => s.subsections.map(sub => sub.title.length)),
    ...sections.flatMap(s => s.subsections.flatMap(sub => sub.tasks.map(task => task.title.length)))
  ) : 10;
  
  const scaleFactor = Math.max(1.0, 1 + (maxTitleLength - 10) * 0.05);
  const chartSize = 500 * scaleFactor;
  const centerPoint = chartSize / 2;

  const createPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number, centerX: number, centerY: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + innerRadius * Math.cos(startAngleRad);
    const y1 = centerY + innerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(startAngleRad);
    const y2 = centerY + outerRadius * Math.sin(startAngleRad);
    
    const x3 = centerX + outerRadius * Math.cos(endAngleRad);
    const y3 = centerY + outerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(endAngleRad);
    const y4 = centerY + innerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", x1, y1,
      "L", x2, y2,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 1, x3, y3,
      "L", x4, y4,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 0, x1, y1,
      "Z"
    ].join(" ");
  };

  const handleMouseEnter = (slice: ChartSlice) => {
    setHoveredSlice(slice);
    onHover?.(slice);
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
    onHover?.(null);
  };

  const handleSliceClick = (slice: ChartSlice) => {
    onSliceClick?.(slice);
  };

  const getInnerRadius = (level: string, scaleFactor: number) => {
    switch (level) {
      case 'section': return 0;
      case 'subsection': return 90 * scaleFactor;
      case 'task': return 150 * scaleFactor;
      default: return 0;
    }
  };

  const getTextPosition = (slice: ChartSlice, centerX: number, centerY: number, scaleFactor: number) => {
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const midAngleRad = (midAngle * Math.PI) / 180;
    const innerRadius = getInnerRadius(slice.level, scaleFactor);
    const textRadius = (innerRadius + slice.radius) / 2;
    
    const x = centerX + textRadius * Math.cos(midAngleRad);
    const y = centerY + textRadius * Math.sin(midAngleRad);
    
    const angle = midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle;
    return { x, y, angle };
  };

  const getSliceText = (slice: ChartSlice) => {
    switch (slice.level) {
      case 'section':
        return slice.section.title;
      case 'subsection':
        return slice.subsection?.title || '';
      case 'task':
        return slice.task?.title || '';
      default:
        return '';
    }
  };

  const shouldShowText = (slice: ChartSlice) => {
    // Only show text if the slice is large enough
    const angleDiff = slice.endAngle - slice.startAngle;
    return angleDiff > 15; // Show text only if slice is larger than 15 degrees
  };

  const getIsHighPriority = (slice: ChartSlice) => {
    if (slice.level === 'section') return slice.section.high_priority || false;
    if (slice.level === 'subsection') return slice.subsection?.high_priority || false;
    if (slice.level === 'task') return slice.task?.high_priority || false;
    return false;
  };

  return (
    <div className="flex justify-center items-center w-full">
      <svg 
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        className="drop-shadow-soft w-full h-auto max-w-md md:max-w-lg"
        style={{ aspectRatio: '1/1' }}
      >
        {chartData.map((slice, index) => (
          <g key={index}>
            <path
              d={createPath(
                slice.startAngle,
                slice.endAngle,
                getInnerRadius(slice.level, scaleFactor),
                slice.radius,
                centerPoint,
                centerPoint
              )}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-300 cursor-pointer hover:brightness-110"
              style={{
                filter: hoveredSlice === slice ? 'brightness(1.2) drop-shadow(0 0 10px rgba(0,0,0,0.3))' : undefined,
              }}
              onMouseEnter={() => handleMouseEnter(slice)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleSliceClick(slice)}
            />
            {getIsHighPriority(slice) && (
              <path
                d={createPath(
                  slice.startAngle,
                  slice.endAngle,
                  getInnerRadius(slice.level, scaleFactor),
                  slice.radius,
                  centerPoint,
                  centerPoint
                )}
                fill="none"
                stroke="#000000"
                strokeWidth="6"
                className="pointer-events-none"
              />
            )}
            {shouldShowText(slice) && (
              <text
                x={getTextPosition(slice, centerPoint, centerPoint, scaleFactor).x}
                y={getTextPosition(slice, centerPoint, centerPoint, scaleFactor).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-xs font-medium pointer-events-none"
                style={{
                  fontSize: slice.level === 'section' ? '14px' : slice.level === 'subsection' ? '12px' : '10px',
                }}
              >
                {getSliceText(slice)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default PieChart;
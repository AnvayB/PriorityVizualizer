import React, { useState, useMemo } from 'react';
import { Section, Subsection, Task, ChartSlice } from '@/types/priorities';

interface PieChartProps {
  sections: Section[];
  onHover?: (slice: ChartSlice | null) => void;
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

const PieChart: React.FC<PieChartProps> = ({ sections, onHover }) => {
  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);

  const chartData = useMemo(() => {
    const slices: ChartSlice[] = [];
    const totalItems = sections.reduce((total, section) => {
      const subsectionCount = section.subsections.length || 1;
      const taskCount = section.subsections.reduce((sum, sub) => sum + (sub.tasks.length || 1), 0);
      return total + subsectionCount + taskCount;
    }, 0);

    let currentAngle = 0;
    const baseRadius = 80;
    const subsectionRadius = 140;
    const taskRadius = 200;

    sections.forEach((section, sectionIndex) => {
      const sectionColor = CHART_COLORS[sectionIndex % CHART_COLORS.length];
      const subsectionCount = section.subsections.length || 1;
      const totalSectionTasks = section.subsections.reduce((sum, sub) => sum + (sub.tasks.length || 1), 0);
      const sectionAngle = (360 * (subsectionCount + totalSectionTasks)) / totalItems;

      // Add section slice
      slices.push({
        section,
        startAngle: currentAngle,
        endAngle: currentAngle + sectionAngle,
        radius: baseRadius,
        level: 'section',
        color: sectionColor,
      });

      // Add subsection slices
      section.subsections.forEach((subsection, subIndex) => {
        const taskCount = subsection.tasks.length || 1;
        const subsectionAngle = (360 * (1 + taskCount)) / totalItems;
        const subsectionColor = sectionColor.replace(')', ', 0.7)').replace('hsl(', 'hsla(');

        slices.push({
          section,
          subsection,
          startAngle: currentAngle,
          endAngle: currentAngle + subsectionAngle,
          radius: subsectionRadius,
          level: 'subsection',
          color: subsectionColor,
        });

        // Add task slices
        subsection.tasks.forEach((task, taskIndex) => {
          const taskAngle = (360 * 1) / totalItems;
          const taskColor = subsectionColor.replace('0.7', '0.5');

          slices.push({
            section,
            subsection,
            task,
            startAngle: currentAngle,
            endAngle: currentAngle + taskAngle,
            radius: taskRadius,
            level: 'task',
            color: taskColor,
          });

          currentAngle += taskAngle;
        });

        if (subsection.tasks.length === 0) {
          currentAngle += subsectionAngle;
        }
      });

      if (section.subsections.length === 0) {
        currentAngle += sectionAngle;
      }
    });

    return slices;
  }, [sections]);

  const createPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = 250 + innerRadius * Math.cos(startAngleRad);
    const y1 = 250 + innerRadius * Math.sin(startAngleRad);
    const x2 = 250 + outerRadius * Math.cos(startAngleRad);
    const y2 = 250 + outerRadius * Math.sin(startAngleRad);
    
    const x3 = 250 + outerRadius * Math.cos(endAngleRad);
    const y3 = 250 + outerRadius * Math.sin(endAngleRad);
    const x4 = 250 + innerRadius * Math.cos(endAngleRad);
    const y4 = 250 + innerRadius * Math.sin(endAngleRad);
    
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

  const getInnerRadius = (level: string) => {
    switch (level) {
      case 'section': return 0;
      case 'subsection': return 90;
      case 'task': return 150;
      default: return 0;
    }
  };

  return (
    <div className="flex justify-center items-center">
      <svg width="500" height="500" className="drop-shadow-soft">
        {chartData.map((slice, index) => (
          <path
            key={index}
            d={createPath(
              slice.startAngle,
              slice.endAngle,
              getInnerRadius(slice.level),
              slice.radius
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
          />
        ))}
      </svg>
    </div>
  );
};

export default PieChart;
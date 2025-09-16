export interface Task {
  id: string;
  title: string;
  dueDate: string;
  high_priority?: boolean;
}

export interface Subsection {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
  high_priority?: boolean;
}

export interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
  color?: string;
  high_priority?: boolean;
}

export interface PriorityData {
  sections: Section[];
}

export interface ChartSlice {
  section: Section;
  subsection?: Subsection;
  task?: Task;
  startAngle: number;
  endAngle: number;
  radius: number;
  level: 'section' | 'subsection' | 'task';
  color: string;
}
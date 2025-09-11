export interface Task {
  id: string;
  title: string;
  dueDate: string;
}

export interface Subsection {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

export interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
  color?: string;
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
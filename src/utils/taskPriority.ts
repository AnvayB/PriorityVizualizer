// Parse a YYYY-MM-DD date string as a local date (not UTC) to avoid timezone shift
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const d = parseLocalDate(dueDate);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

// A task is treated as high priority if it was explicitly marked so, or if it's due today.
export function isEffectivelyHighPriority(task: { high_priority?: boolean; dueDate?: string }): boolean {
  return !!task.high_priority || isDueToday(task.dueDate);
}

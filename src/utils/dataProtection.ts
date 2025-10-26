/**
 * Data Protection Utilities
 * Prevents accidental data loss
 */

import { Section } from '@/types/priorities';

export interface BackupMetadata {
  timestamp: string;
  sectionCount: number;
  subsectionCount: number;
  taskCount: number;
}

/**
 * Create backup metadata from sections
 */
export function createBackupMetadata(sections: Section[]): BackupMetadata {
  const subsectionCount = sections.reduce((sum, s) => sum + s.subsections.length, 0);
  const taskCount = sections.reduce((sum, s) => 
    sum + s.subsections.reduce((subSum, sub) => subSum + sub.tasks.length, 0), 0
  );

  return {
    timestamp: new Date().toISOString(),
    sectionCount: sections.length,
    subsectionCount,
    taskCount
  };
}

/**
 * Check if saving new data would result in significant data loss
 * Returns warning message if data loss detected, null if safe
 */
export function detectDataLoss(
  currentData: Section[],
  newData: Section[],
  threshold: number = 0.5 // 50% data loss threshold
): string | null {
  const current = createBackupMetadata(currentData);
  const newMeta = createBackupMetadata(newData);

  // Calculate loss percentage
  const sectionLoss = current.sectionCount > 0 
    ? 1 - (newMeta.sectionCount / current.sectionCount) 
    : 0;
  
  const subsectionLoss = current.subsectionCount > 0 
    ? 1 - (newMeta.subsectionCount / current.subsectionCount) 
    : 0;
  
  const taskLoss = current.taskCount > 0 
    ? 1 - (newMeta.taskCount / current.taskCount) 
    : 0;

  // Check if any metric shows significant loss
  if (sectionLoss > threshold || subsectionLoss > threshold || taskLoss > threshold) {
    const losses = [];
    if (sectionLoss > threshold) {
      losses.push(`${Math.round(sectionLoss * 100)}% of sections`);
    }
    if (subsectionLoss > threshold) {
      losses.push(`${Math.round(subsectionLoss * 100)}% of subsections`);
    }
    if (taskLoss > threshold) {
      losses.push(`${Math.round(taskLoss * 100)}% of tasks`);
    }

    return `⚠️ WARNING: This action would delete ${losses.join(', ')}!\n\n` +
      `Current: ${current.sectionCount} sections, ${current.subsectionCount} subsections, ${current.taskCount} tasks\n` +
      `New: ${newMeta.sectionCount} sections, ${newMeta.subsectionCount} subsections, ${newMeta.taskCount} tasks\n\n` +
      `Are you sure you want to continue?`;
  }

  return null;
}

/**
 * Store backup in localStorage before dangerous operations
 */
export function storeLocalBackup(sections: Section[], userId: string): void {
  const backup = {
    sections,
    metadata: createBackupMetadata(sections),
    userId,
    timestamp: new Date().toISOString()
  };

  try {
    // Keep last 5 backups in localStorage
    const backups = getLocalBackups(userId);
    backups.unshift(backup);
    
    // Keep only last 5
    if (backups.length > 5) {
      backups.splice(5);
    }

    localStorage.setItem(`priorityManager_backups_${userId}`, JSON.stringify(backups));
    console.log('[DataProtection] Backup stored in localStorage');
  } catch (error) {
    console.error('[DataProtection] Failed to store backup:', error);
  }
}

/**
 * Get local backups from localStorage
 */
export function getLocalBackups(userId: string): any[] {
  try {
    const stored = localStorage.getItem(`priorityManager_backups_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[DataProtection] Failed to get backups:', error);
    return [];
  }
}

/**
 * Restore from local backup
 */
export function restoreFromLocalBackup(userId: string, index: number = 0): Section[] | null {
  try {
    const backups = getLocalBackups(userId);
    if (backups.length > index) {
      console.log('[DataProtection] Restoring backup from:', backups[index].timestamp);
      return backups[index].sections;
    }
    return null;
  } catch (error) {
    console.error('[DataProtection] Failed to restore backup:', error);
    return null;
  }
}

/**
 * Download automatic backup file
 */
export function downloadAutoBackup(sections: Section[], userId: string): void {
  const exportData = {
    sections,
    exportDate: new Date().toISOString(),
    version: "1.0",
    userId,
    metadata: createBackupMetadata(sections),
    note: "Automatic safety backup"
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auto-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('[DataProtection] Auto backup downloaded');
}


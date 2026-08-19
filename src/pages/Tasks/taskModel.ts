import type { ImportPreviewRow, PlatformTask } from '@/services/platform';

export function summarizeImportRows(rows: ImportPreviewRow[]) {
  return rows.reduce<Record<ImportPreviewRow['action'], number>>(
    (summary, row) => {
      summary[row.action] += 1;
      return summary;
    },
    { create: 0, update: 0, skip: 0, error: 0 },
  );
}

export function getTaskActions(task: PlatformTask) {
  return {
    canRetry: task.status === 'failed',
    canCancel: ['pending', 'processing'].includes(task.status),
    hasErrorFile: Boolean(task.failed && task.errorFile),
  };
}

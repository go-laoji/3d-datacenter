import type { AuditRecord } from '@/services/platform';

export interface AuditDiffRow {
  field: string;
  before: string;
  after: string;
  changed: boolean;
}

function displayValue(value: unknown) {
  if (value === undefined) return '--';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function buildAuditDiff(record: AuditRecord): AuditDiffRow[] {
  const fields = new Set([
    ...Object.keys(record.before ?? {}),
    ...Object.keys(record.after ?? {}),
  ]);
  return [...fields].map((field) => {
    const before = displayValue(record.before?.[field]);
    const after = displayValue(record.after?.[field]);
    return { field, before, after, changed: before !== after };
  });
}

export function serializeAuditCsv(records: AuditRecord[]) {
  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = records.map((record) =>
    [
      record.occurredAt,
      record.operator,
      record.actionLabel,
      record.objectName,
      record.result,
      record.traceId,
    ]
      .map((value) => escapeCsv(value))
      .join(','),
  );
  return ['时间,操作人,动作,对象,结果,追踪号', ...rows].join('\n');
}

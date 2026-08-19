import { describe, expect, it } from 'vitest';
import type { AuditRecord } from '@/services/platform';
import { buildAuditDiff, serializeAuditCsv } from './auditModel';

const record: AuditRecord = {
  id: 'a1',
  occurredAt: '2026-08-20T00:00:00Z',
  operator: 'A',
  operatorId: 'u1',
  action: 'update',
  actionLabel: '更新',
  objectType: 'device',
  objectId: 'd1',
  objectName: '设备,01',
  result: 'success',
  ipAddress: '127.0.0.1',
  traceId: 't1',
  summary: '测试',
  before: { status: 'offline', owner: 'A' },
  after: { status: 'online', owner: 'A' },
};

describe('audit presentation model', () => {
  it('builds field-level before and after changes', () => {
    expect(buildAuditDiff(record)).toEqual([
      { field: 'status', before: 'offline', after: 'online', changed: true },
      { field: 'owner', before: 'A', after: 'A', changed: false },
    ]);
  });
  it('escapes audit CSV values', () => {
    expect(serializeAuditCsv([record])).toContain('"设备,01"');
  });
});

import { describe, expect, it } from 'vitest';
import { getTaskActions, summarizeImportRows } from './taskModel';

describe('task model', () => {
  it('summarizes import differences', () => {
    expect(
      summarizeImportRows([
        {
          rowNumber: 1,
          key: 'a',
          name: 'A',
          action: 'create',
          differences: [],
        },
        {
          rowNumber: 2,
          key: 'b',
          name: 'B',
          action: 'error',
          differences: [],
          error: 'bad',
        },
      ]),
    ).toEqual({ create: 1, update: 0, skip: 0, error: 1 });
  });
  it('only allows retry for failed tasks', () => {
    expect(
      getTaskActions({
        status: 'failed',
        failed: 2,
        errorFile: 'errors.csv',
      } as never),
    ).toEqual({ canRetry: true, canCancel: false, hasErrorFile: true });
  });
});

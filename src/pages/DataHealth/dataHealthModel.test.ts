import { describe, expect, it } from 'vitest';
import { getOverallDataHealth, summarizeDataHealth } from './dataHealthModel';

describe('data health model', () => {
  const workspace = {
    sources: [{ quality: 'good' }, { quality: 'interrupted' }],
    issues: [
      { status: 'pending', severity: 'error' },
      { status: 'acknowledged', severity: 'warning' },
    ],
    system: [],
  } as never;
  it('counts source and issue health', () => {
    expect(summarizeDataHealth(workspace)).toEqual({
      healthySources: 1,
      degradedSources: 1,
      openIssues: 1,
      criticalIssues: 1,
    });
  });
  it('raises overall error for an interrupted source', () => {
    expect(getOverallDataHealth(workspace)).toBe('error');
  });
});

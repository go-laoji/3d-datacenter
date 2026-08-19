import { describe, expect, it } from 'vitest';
import { validateConnectionSelection } from './connectionRules';

const selection = {
  sourceDeviceId: 'dev-1',
  sourcePortId: 'port-sfp-1',
  targetDeviceId: 'dev-2',
  targetPortId: 'port-sfp-2',
  cableType: 'SingleModeFiber' as const,
};

describe('connection validation', () => {
  it('allows compatible free endpoints', () =>
    expect(validateConnectionSelection(selection, new Set())).toEqual({
      valid: true,
      blockers: [],
      warnings: [],
    }));
  it('blocks occupied endpoints and device loops', () => {
    const result = validateConnectionSelection(
      { ...selection, targetDeviceId: 'dev-1' },
      new Set(['port-sfp-1']),
    );
    expect(result.valid).toBe(false);
    expect(result.blockers).toHaveLength(2);
  });
  it('warns when fiber media is paired with non-optical ports', () => {
    const result = validateConnectionSelection(
      { ...selection, targetPortId: 'eth-1' },
      new Set(),
    );
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });
});

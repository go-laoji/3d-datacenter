import { describe, expect, it } from 'vitest';
import access from './access';

describe('frontend access policy', () => {
  it('grants governance and export capabilities to administrators', () => {
    expect(access({ currentUser: { access: 'admin' } }).canManageSystem).toBe(
      true,
    );
    expect(access({ currentUser: { access: 'admin' } }).canExport).toBe(true);
  });
  it('keeps operators out of system governance', () => {
    const policy = access({ currentUser: { access: 'user' } });
    expect(policy.canOperate).toBe(true);
    expect(policy.canManageSystem).toBe(false);
  });
});

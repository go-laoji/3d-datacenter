import { describe, expect, it } from 'vitest';
import { getEffectiveAccess, getOrganizationPath } from './accessModel';

describe('access model', () => {
  it('builds a readable organization path', () => {
    expect(
      getOrganizationPath('child', [
        { id: 'root', name: '运维部', memberCount: 2 },
        { id: 'child', name: '值班组', parentId: 'root', memberCount: 1 },
      ]),
    ).toBe('运维部 / 值班组');
  });

  it('merges permissions and data scopes from assigned roles', () => {
    const result = getEffectiveAccess(
      {
        id: 'u1',
        name: 'A',
        username: 'a',
        email: '',
        phone: '',
        organizationId: 'o1',
        roleIds: ['r1', 'r2'],
        status: 'enabled',
      },
      [
        {
          id: 'r1',
          name: 'R1',
          description: '',
          permissionKeys: ['read'],
          datacenterIds: ['dc1'],
          memberCount: 1,
        },
        {
          id: 'r2',
          name: 'R2',
          description: '',
          permissionKeys: ['write'],
          datacenterIds: ['dc2'],
          memberCount: 1,
        },
      ],
      [
        { key: 'read', name: '查看', group: '资产' },
        { key: 'write', name: '维护', group: '资产' },
      ],
    );
    expect(result.permissions.map((item) => item.key)).toEqual([
      'read',
      'write',
    ]);
    expect(result.datacenterIds).toEqual(['dc1', 'dc2']);
  });
});

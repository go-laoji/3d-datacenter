import type { Request, Response } from 'express';
import type {
  AccessOrganization,
  AccessPermission,
  AccessRole,
  AccessUser,
} from '../src/services/platform/access';

const organizations: AccessOrganization[] = [
  { id: 'org-ops', name: '基础设施运维部', memberCount: 8 },
  {
    id: 'org-noc',
    name: 'NOC 值班组',
    parentId: 'org-ops',
    memberCount: 4,
  },
  {
    id: 'org-power',
    name: '动力环境组',
    parentId: 'org-ops',
    memberCount: 3,
  },
  { id: 'org-audit', name: '信息安全与审计', memberCount: 2 },
];

const permissions: AccessPermission[] = [
  { key: 'assets.read', name: '查看资产', group: '空间与资产' },
  { key: 'assets.write', name: '维护资产', group: '空间与资产' },
  { key: 'network.write', name: '维护网络连接', group: '网络与连接' },
  { key: 'power.write', name: '维护电力配置', group: '电力与环境' },
  { key: 'alerts.handle', name: '处置告警', group: '事件与协作' },
  { key: 'changes.approve', name: '审批变更', group: '事件与协作' },
  { key: 'reports.export', name: '导出报表', group: '报表与分析' },
  { key: 'system.manage', name: '管理系统配置', group: '系统治理' },
];

let roles: AccessRole[] = [
  {
    id: 'role-admin',
    name: '系统管理员',
    description: '全局配置、权限和数据治理',
    permissionKeys: permissions.map((permission) => permission.key),
    datacenterIds: ['*'],
    memberCount: 2,
    builtIn: true,
  },
  {
    id: 'role-noc',
    name: 'NOC 值班员',
    description: '查看全局运行态并处置告警',
    permissionKeys: ['assets.read', 'alerts.handle', 'reports.export'],
    datacenterIds: ['dc-001', 'dc-002'],
    memberCount: 4,
  },
  {
    id: 'role-engineer',
    name: '基础设施工程师',
    description: '维护资产、连接、电力与变更',
    permissionKeys: [
      'assets.read',
      'assets.write',
      'network.write',
      'power.write',
    ],
    datacenterIds: ['dc-001'],
    memberCount: 3,
  },
  {
    id: 'role-auditor',
    name: '审计只读',
    description: '跨站点只读与报表导出',
    permissionKeys: ['assets.read', 'reports.export'],
    datacenterIds: ['*'],
    memberCount: 2,
  },
];

let users: AccessUser[] = [
  {
    id: 'user-001',
    name: '张运维',
    username: 'zhang.ops',
    email: 'zhang.ops@example.com',
    phone: '13800138001',
    organizationId: 'org-noc',
    roleIds: ['role-noc'],
    status: 'enabled',
    lastActiveAt: '2026-08-20T02:41:00+08:00',
  },
  {
    id: 'user-002',
    name: '李工程师',
    username: 'li.engineer',
    email: 'li.engineer@example.com',
    phone: '13900139002',
    organizationId: 'org-ops',
    roleIds: ['role-engineer'],
    status: 'enabled',
    lastActiveAt: '2026-08-20T01:18:00+08:00',
  },
  {
    id: 'user-003',
    name: '周审计',
    username: 'zhou.audit',
    email: 'zhou.audit@example.com',
    phone: '13700137003',
    organizationId: 'org-audit',
    roleIds: ['role-auditor'],
    status: 'disabled',
    lastActiveAt: '2026-08-18T17:22:00+08:00',
  },
];

const wait = () => new Promise((resolve) => setTimeout(resolve, 220));

export default {
  'GET /api/platform/access': async (_req: Request, res: Response) => {
    await wait();
    res.json({
      success: true,
      data: {
        users,
        roles,
        organizations,
        permissions,
        datacenters: [
          { id: 'dc-001', name: '北京亦庄数据中心' },
          { id: 'dc-002', name: '上海嘉定数据中心' },
          { id: 'dc-003', name: '深圳坪山数据中心' },
        ],
      },
    });
  },
  'POST /api/platform/users': async (req: Request, res: Response) => {
    await wait();
    const input = req.body as Omit<AccessUser, 'id'>;
    const user = {
      ...input,
      id: `user-${String(users.length + 1).padStart(3, '0')}`,
    };
    users = [user, ...users];
    res.json({ success: true, data: user });
  },
  'PUT /api/platform/users': async (req: Request, res: Response) => {
    await wait();
    const input = req.body as AccessUser;
    users = users.map((user) => (user.id === input.id ? { ...user, ...input } : user));
    res.json({ success: true, data: users.find((user) => user.id === input.id) });
  },
  'PUT /api/platform/users/:id/status': async (req: Request, res: Response) => {
    await wait();
    users = users.map((user) =>
      user.id === req.params.id ? { ...user, status: req.body.status } : user,
    );
    res.json({ success: true, data: users.find((user) => user.id === req.params.id) });
  },
  'PUT /api/platform/roles': async (req: Request, res: Response) => {
    await wait();
    const input = req.body as AccessRole;
    roles = roles.map((role) => (role.id === input.id ? { ...role, ...input } : role));
    res.json({ success: true, data: roles.find((role) => role.id === input.id) });
  },
};

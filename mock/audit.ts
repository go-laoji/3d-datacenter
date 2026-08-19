import type { Request, Response } from 'express';
import type { AuditRecord } from '../src/services/platform/audit';

const auditRecords: AuditRecord[] = [
  {
    id: 'audit-0008',
    occurredAt: '2026-08-20T02:46:18+08:00',
    operator: '张运维', operatorId: 'user-001', action: 'alert.resolve', actionLabel: '解决告警',
    objectType: 'alert', objectId: 'alert-001', objectName: 'A1-03 柜温度过高', result: 'success',
    ipAddress: '10.20.8.17', traceId: 'trace-bj-8f93d2', summary: '确认制冷恢复后关闭告警',
    before: { status: 'acknowledged', assignee: '张运维', temperature: 30.8 },
    after: { status: 'resolved', resolution: '调整冷通道送风', temperature: 26.1 },
  },
  {
    id: 'audit-0007',
    occurredAt: '2026-08-20T02:21:03+08:00',
    operator: '李工程师', operatorId: 'user-002', action: 'device.update', actionLabel: '更新设备',
    objectType: 'device', objectId: 'dev-bj-003', objectName: '核心交换机 SW-03', result: 'success',
    ipAddress: '10.20.9.24', traceId: 'trace-bj-a061bc', summary: '更新设备责任人和管理 IP',
    before: { owner: '网络组', managementIp: '10.10.1.20' },
    after: { owner: '李工程师', managementIp: '10.10.1.23' },
  },
  {
    id: 'audit-0006',
    occurredAt: '2026-08-20T01:52:44+08:00',
    operator: '李工程师', operatorId: 'user-002', action: 'connection.create', actionLabel: '创建连线',
    objectType: 'connection', objectId: 'conn-014', objectName: 'CAB-A03/SW03 ↔ CAB-A04/SRV12', result: 'failed',
    ipAddress: '10.20.9.24', traceId: 'trace-bj-c910e8', summary: '创建物理连接失败',
    after: { sourcePort: 'Gi0/12', targetPort: 'eth0', cableNumber: 'CAB-20260820-014' },
    errorMessage: '目标端口已被连接占用',
  },
  {
    id: 'audit-0005',
    occurredAt: '2026-08-19T23:34:11+08:00',
    operator: '系统任务', operatorId: 'system', action: 'source.sync', actionLabel: '同步采集源',
    objectType: 'source', objectId: 'source-snmp-bj', objectName: '北京 SNMP 采集器', result: 'success',
    ipAddress: '127.0.0.1', traceId: 'trace-sync-03d7e1', summary: '同步 168 个设备和 2,430 个指标',
    before: { cursor: 8351 }, after: { cursor: 8519, durationMs: 4821 },
  },
  {
    id: 'audit-0004',
    occurredAt: '2026-08-19T19:06:32+08:00',
    operator: '管理员', operatorId: 'admin', action: 'role.update', actionLabel: '修改角色',
    objectType: 'role', objectId: 'role-engineer', objectName: '基础设施工程师', result: 'success',
    ipAddress: '10.20.1.8', traceId: 'trace-iam-770ab1', summary: '增加北京数据中心电力配置权限',
    before: { permissionKeys: ['assets.read', 'assets.write', 'network.write'] },
    after: { permissionKeys: ['assets.read', 'assets.write', 'network.write', 'power.write'] },
  },
];

export default {
  'GET /api/platform/audits': async (req: Request, res: Response) => {
    await new Promise((resolve) => setTimeout(resolve, 240));
    const { keyword, operator, action, result } = req.query;
    const normalized = String(keyword ?? '').toLowerCase();
    const data = auditRecords.filter((record) => {
      const keywordMatched = !normalized || [record.objectName, record.summary, record.traceId]
        .some((value) => value.toLowerCase().includes(normalized));
      return keywordMatched
        && (!operator || record.operator === operator)
        && (!action || record.action === action)
        && (!result || record.result === result);
    });
    res.json({ success: true, data });
  },
};

import type { Request, Response } from 'express';
import type { DataQualityIssue, DataSourceHealth, SystemHealthItem } from '../src/services/platform/dataHealth';

let sources: DataSourceHealth[] = [
  { id: 'source-snmp-bj', name: '北京 SNMP 采集器', type: 'snmp', endpoint: 'collector-bj-01:161', quality: 'good', lastSyncedAt: '2026-08-20T03:24:18+08:00', nextSyncAt: '2026-08-20T03:29:18+08:00', records: 2430, lagSeconds: 42, successRate: 99.8 },
  { id: 'source-redfish-bj', name: '北京 Redfish 网关', type: 'redfish', endpoint: 'redfish-gateway-bj', quality: 'delayed', lastSyncedAt: '2026-08-20T03:12:01+08:00', nextSyncAt: '2026-08-20T03:27:01+08:00', records: 168, lagSeconds: 738, successRate: 96.4 },
  { id: 'source-cmdb', name: '企业 CMDB', type: 'cmdb', endpoint: 'cmdb-api.internal/v2', quality: 'interrupted', lastSyncedAt: '2026-08-19T22:05:42+08:00', records: 436, lagSeconds: 19238, successRate: 88.7 },
  { id: 'source-manual', name: '人工维护数据', type: 'manual', endpoint: '前端 Mock 数据集', quality: 'estimated', lastSyncedAt: '2026-08-20T02:00:00+08:00', records: 54, lagSeconds: 4800, successRate: 100 },
];

let issues: DataQualityIssue[] = [
  { id: 'dq-018', severity: 'error', rule: '物理位置完整性', objectType: 'device', objectId: 'dev-bj-021', objectName: '应用服务器 APP-21', detail: '机柜编码 CAB-A99 无法映射到现有机柜', status: 'pending', detectedAt: '2026-08-20T03:14:02+08:00' },
  { id: 'dq-017', severity: 'warning', rule: '责任人完整性', objectType: 'device', objectId: 'dev-sh-014', objectName: '存储节点 ST-14', detail: '设备责任人与部门均为空', status: 'pending', detectedAt: '2026-08-20T02:58:17+08:00' },
  { id: 'dq-016', severity: 'warning', rule: '连接双向一致性', objectType: 'connection', objectId: 'conn-014', objectName: 'SW-03 ↔ Core-01', detail: 'CMDB 只存在源端口关系，等待目标端口核对', status: 'acknowledged', detectedAt: '2026-08-20T01:44:30+08:00' },
];

const system: SystemHealthItem[] = [
  { key: 'web', name: '前端应用', status: 'normal', latencyMs: 32, detail: '静态资源与路由正常' },
  { key: 'mock', name: 'Mock API', status: 'normal', latencyMs: 86, detail: '演示接口可用' },
  { key: 'events', name: '事件流', status: 'warning', latencyMs: 1240, detail: '当前由轮询模拟，未连接消息总线' },
  { key: 'storage', name: '指标存储', status: 'warning', latencyMs: 0, detail: '当前为内存 Mock，重启后恢复初始数据' },
];

const pause = () => new Promise((resolve) => setTimeout(resolve, 300));

export default {
  'GET /api/platform/data-health': async (_req: Request, res: Response) => {
    await pause(); res.json({ success: true, data: { sources, issues, system } });
  },
  'POST /api/platform/data-sources/:id/retry': async (req: Request, res: Response) => {
    await pause();
    sources = sources.map((source) => source.id === req.params.id ? { ...source, quality: 'good', lastSyncedAt: new Date().toISOString(), lagSeconds: 0, successRate: Math.min(100, source.successRate + 0.5) } : source);
    res.json({ success: true, data: sources.find((source) => source.id === req.params.id) });
  },
  'POST /api/platform/data-quality/:id/acknowledge': async (req: Request, res: Response) => {
    await pause();
    issues = issues.map((issue) => issue.id === req.params.id ? { ...issue, status: 'acknowledged' } : issue);
    res.json({ success: true, data: issues.find((issue) => issue.id === req.params.id) });
  },
};

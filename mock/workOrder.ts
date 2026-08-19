import type { Request, Response } from 'express';
import type { ChangePlan, WorkOrder, WorkOrderInput } from '../src/services/platform/workOrder';

let workOrders: WorkOrder[] = [
  {
    id: 'wo-20260820-018', title: '处理 A1-03 机柜温度过高', category: 'incident', priority: 'P1', status: 'processing', assignee: '张运维',
    alertId: 'alert-001', objectType: 'cabinet', objectId: 'cab-bj-003', objectName: 'A区1排3号机柜', slaDueAt: '2026-08-20T03:30:00+08:00', createdAt: '2026-08-20T02:38:00+08:00',
    timeline: [
      { id: 'tl-1', at: '2026-08-20T02:38:00+08:00', actor: '告警中心', action: '创建工单', detail: '由严重告警 ALERT-001 自动关联创建' },
      { id: 'tl-2', at: '2026-08-20T02:42:00+08:00', actor: '张运维', action: '开始处理', detail: '到场检查冷通道送风与机柜前门' },
    ],
  },
  {
    id: 'wo-20260820-017', title: '巡检北京机房 A 区 PDU', category: 'inspection', priority: 'P3', status: 'pending', assignee: '赵动力',
    objectType: 'pdu', objectId: 'pdu-bj-001', objectName: 'A 区主路 PDU-A01', slaDueAt: '2026-08-20T16:00:00+08:00', createdAt: '2026-08-20T00:10:00+08:00',
    timeline: [{ id: 'tl-3', at: '2026-08-20T00:10:00+08:00', actor: '巡检计划', action: '创建工单', detail: '日常动力巡检' }],
  },
  {
    id: 'wo-20260819-042', title: '更换核心交换机风扇模块', category: 'maintenance', priority: 'P2', status: 'resolved', assignee: '李工程师',
    objectType: 'device', objectId: 'dev-bj-003', objectName: '核心交换机 SW-03', slaDueAt: '2026-08-20T00:00:00+08:00', createdAt: '2026-08-19T14:20:00+08:00',
    timeline: [
      { id: 'tl-4', at: '2026-08-19T14:20:00+08:00', actor: '李工程师', action: '创建工单', detail: '维护窗口更换冗余风扇模块' },
      { id: 'tl-5', at: '2026-08-19T22:41:00+08:00', actor: '李工程师', action: '解决', detail: '更换完成，温度和转速已恢复' },
    ],
  },
];

let changes: ChangePlan[] = [
  {
    id: 'chg-20260820-006', title: '核心交换机 SW-03 上联链路切换', risk: 'high', status: 'pending',
    windowStart: '2026-08-21T01:00:00+08:00', windowEnd: '2026-08-21T02:00:00+08:00', approver: '基础设施主管',
    affectedObjects: [
      { type: 'device', id: 'dev-bj-003', name: '核心交换机 SW-03' },
      { type: 'connection', id: 'conn-014', name: 'SW-03 ↔ Core-01' },
    ],
    steps: [
      { id: 'cs-1', name: '检查备用链路与配置备份', owner: '李工程师', status: 'pending', rollback: '恢复原配置快照' },
      { id: 'cs-2', name: '切换 B 路上联并验证路由', owner: '李工程师', status: 'pending', rollback: '将流量切回 A 路' },
      { id: 'cs-3', name: '观察 15 分钟并关闭维护窗口', owner: '张运维', status: 'pending' },
    ],
  },
  {
    id: 'chg-20260819-011', title: 'A 区机柜温度阈值调整', risk: 'medium', status: 'completed',
    windowStart: '2026-08-19T18:00:00+08:00', windowEnd: '2026-08-19T18:30:00+08:00', approver: '动力环境主管',
    affectedObjects: [{ type: 'cabinet', id: 'cab-bj-003', name: 'A 区 1 排机柜组' }],
    steps: [
      { id: 'cs-4', name: '确认传感器校准结果', owner: '赵动力', status: 'completed' },
      { id: 'cs-5', name: '更新阈值并验证告警', owner: '赵动力', status: 'completed', rollback: '恢复原阈值' },
    ],
  },
];

const pause = () => new Promise((resolve) => setTimeout(resolve, 260));

export default {
  'GET /api/platform/work-orders': async (_req: Request, res: Response) => {
    await pause();
    res.json({ success: true, data: { workOrders, changes, assignees: ['张运维', '李工程师', '王运维', '赵动力'] } });
  },
  'POST /api/platform/work-orders': async (req: Request, res: Response) => {
    await pause();
    const input = req.body as WorkOrderInput;
    const now = new Date();
    const item: WorkOrder = {
      ...input, id: `wo-20260820-${String(workOrders.length + 19).padStart(3, '0')}`, status: 'pending',
      createdAt: now.toISOString(), slaDueAt: new Date(now.getTime() + (input.priority === 'P1' ? 60 : 240) * 60_000).toISOString(),
      timeline: [{ id: `tl-${Date.now()}`, at: now.toISOString(), actor: '当前用户', action: '创建工单', detail: input.alertId ? `由告警 ${input.alertId} 转入` : '手动创建' }],
    };
    workOrders = [item, ...workOrders]; res.json({ success: true, data: item });
  },
  'POST /api/platform/work-orders/:id/transition': async (req: Request, res: Response) => {
    await pause();
    const statusMap: Record<string, WorkOrder['status']> = { start: 'processing', resolve: 'resolved', close: 'closed' };
    workOrders = workOrders.map((item) => item.id === req.params.id ? {
      ...item, status: statusMap[req.body.action] ?? item.status,
      timeline: [...item.timeline, { id: `tl-${Date.now()}`, at: new Date().toISOString(), actor: '当前用户', action: req.body.action === 'start' ? '开始处理' : req.body.action === 'resolve' ? '解决' : '关闭', detail: '状态已由演示操作更新' }],
    } : item);
    res.json({ success: true, data: workOrders.find((item) => item.id === req.params.id) });
  },
  'POST /api/platform/changes/:id/transition': async (req: Request, res: Response) => {
    await pause();
    const statusMap: Record<string, ChangePlan['status']> = { approve: 'approved', execute: 'processing', complete: 'completed' };
    changes = changes.map((item) => item.id === req.params.id ? {
      ...item, status: statusMap[req.body.action] ?? item.status,
      steps: req.body.action === 'execute' ? item.steps.map((step, index) => ({ ...step, status: index === 0 ? 'processing' as const : step.status })) : item.steps,
    } : item);
    res.json({ success: true, data: changes.find((item) => item.id === req.params.id) });
  },
};

import type { Request, Response } from 'express';
import type {
  EscalationStep,
  NotificationChannel,
  OnCallShift,
} from '../src/services/platform/notification';

let channels: NotificationChannel[] = [
  { id: 'channel-wecom', name: '企业微信告警群', type: 'webhook', target: '基础设施 NOC 群', status: 'enabled', lastTestAt: '2026-08-20T02:32:00+08:00', deliveryRate: 99.7 },
  { id: 'channel-email', name: '运维邮件组', type: 'email', target: 'dc-ops@example.com', status: 'enabled', lastTestAt: '2026-08-19T16:02:00+08:00', deliveryRate: 98.4 },
  { id: 'channel-sms', name: '严重告警短信', type: 'sms', target: 'NOC 值班号码池', status: 'error', lastTestAt: '2026-08-20T01:14:00+08:00', deliveryRate: 91.2 },
];

let shifts: OnCallShift[] = [
  { id: 'shift-current', startsAt: '2026-08-20T00:00:00+08:00', endsAt: '2026-08-20T08:00:00+08:00', primary: '张运维', backup: '李工程师', status: 'active' },
  { id: 'shift-next', startsAt: '2026-08-20T08:00:00+08:00', endsAt: '2026-08-20T16:00:00+08:00', primary: '王运维', backup: '赵动力', status: 'upcoming' },
  { id: 'shift-later', startsAt: '2026-08-20T16:00:00+08:00', endsAt: '2026-08-21T00:00:00+08:00', primary: '李工程师', backup: '张运维', status: 'upcoming' },
];

let escalationSteps: EscalationStep[] = [
  { id: 'step-1', delayMinutes: 0, target: '当班主值', channelIds: ['channel-wecom'] },
  { id: 'step-2', delayMinutes: 10, target: '当班备值', channelIds: ['channel-wecom', 'channel-sms'] },
  { id: 'step-3', delayMinutes: 30, target: '运维主管', channelIds: ['channel-email', 'channel-sms'] },
];

const pause = () => new Promise((resolve) => setTimeout(resolve, 260));

export default {
  'GET /api/platform/notifications': async (_req: Request, res: Response) => {
    await pause();
    res.json({ success: true, data: { channels, shifts, escalationSteps, responders: ['张运维', '李工程师', '王运维', '赵动力'] } });
  },
  'PUT /api/platform/notification-channels/:id': async (req: Request, res: Response) => {
    await pause();
    channels = channels.map((channel) => channel.id === req.params.id ? { ...channel, status: req.body.status } : channel);
    res.json({ success: true, data: channels.find((channel) => channel.id === req.params.id) });
  },
  'POST /api/platform/notification-channels/:id/test': async (req: Request, res: Response) => {
    await pause();
    const channel = channels.find((item) => item.id === req.params.id);
    const delivered = channel?.status === 'enabled';
    channels = channels.map((item) => item.id === req.params.id ? { ...item, lastTestAt: new Date().toISOString() } : item);
    res.json({ success: true, data: { delivered, detail: delivered ? '测试消息已送达并收到回执' : '渠道未启用或供应商连接异常' } });
  },
  'POST /api/platform/on-call/:id/handoff': async (req: Request, res: Response) => {
    await pause();
    shifts = shifts.map((shift) => shift.id === req.params.id ? { ...shift, primary: req.body.primary } : shift);
    res.json({ success: true, data: shifts.find((shift) => shift.id === req.params.id) });
  },
  'PUT /api/platform/escalation-policy': async (req: Request, res: Response) => {
    await pause();
    escalationSteps = req.body.steps;
    res.json({ success: true, data: escalationSteps });
  },
};

import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// 模拟告警数据
const mockAlerts: IDC.AlertDetail[] = [
    {
        id: 'alert-001',
        level: 'critical',
        type: 'temperature',
        source: 'rule',
        ruleId: 'rule-001',
        ruleName: '高温告警',
        deviceId: 'dev-003',
        deviceName: '应用服务器-A1-1',
        cabinetId: 'cab-bj-003',
        cabinetName: 'A区1排3号',
        datacenterId: 'dc-001',
        datacenterName: '北京亦庄',
        message: '机柜温度超过28℃阈值，当前温度29.8℃',
        value: 29.8,
        threshold: 28,
        createdAt: '2026-01-17T09:30:00Z',
        acknowledged: false,
    },
    {
        id: 'alert-002',
        level: 'warning',
        type: 'port_status',
        source: 'system',
        deviceId: 'dev-010',
        deviceName: '核心交换机-B1',
        cabinetId: 'cab-bj-001',
        cabinetName: 'A区1排1号',
        datacenterId: 'dc-001',
        datacenterName: '北京亦庄',
        message: '端口利用率超过80%',
        value: 85,
        threshold: 80,
        createdAt: '2026-01-17T09:00:00Z',
        acknowledged: false,
    },
    {
        id: 'alert-003',
        level: 'warning',
        type: 'power',
        source: 'rule',
        ruleId: 'rule-003',
        ruleName: '功率告警',
        cabinetId: 'cab-sz-001',
        cabinetName: 'C区1排1号',
        datacenterId: 'dc-003',
        datacenterName: '深圳坪山',
        message: '机柜功率超过额定的85%',
        value: 6.8,
        threshold: 6.5,
        createdAt: '2026-01-17T08:45:00Z',
        acknowledged: true,
        acknowledgedAt: '2026-01-17T09:10:00Z',
        acknowledgedBy: '张运维',
        notes: '已通知设备负责人，计划迁移部分负载',
    },
    {
        id: 'alert-004',
        level: 'error',
        type: 'device_status',
        source: 'system',
        deviceId: 'dev-005',
        deviceName: '数据库服务器-A1-1',
        cabinetId: 'cab-bj-002',
        cabinetName: 'A区1排2号',
        datacenterId: 'dc-001',
        datacenterName: '北京亦庄',
        message: '设备心跳超时，疑似离线',
        createdAt: '2026-01-17T07:30:00Z',
        acknowledged: true,
        acknowledgedAt: '2026-01-17T07:35:00Z',
        acknowledgedBy: '李运维',
        resolvedAt: '2026-01-17T08:00:00Z',
        resolvedBy: '李运维',
        notes: '网络闪断导致，已恢复',
    },
    {
        id: 'alert-005',
        level: 'info',
        type: 'capacity',
        source: 'rule',
        ruleId: 'rule-005',
        ruleName: 'U位容量预警',
        cabinetId: 'cab-bj-001',
        cabinetName: 'A区1排1号',
        datacenterId: 'dc-001',
        datacenterName: '北京亦庄',
        message: '机柜U位使用率达到92%',
        value: 92,
        threshold: 90,
        createdAt: '2026-01-16T14:00:00Z',
        acknowledged: true,
        acknowledgedAt: '2026-01-16T15:00:00Z',
        acknowledgedBy: '王运维',
    },
    {
        id: 'alert-006',
        level: 'warning',
        type: 'humidity',
        source: 'rule',
        ruleId: 'rule-002',
        ruleName: '湿度告警',
        cabinetId: 'cab-sh-001',
        cabinetName: 'B区1排1号',
        datacenterId: 'dc-002',
        datacenterName: '上海嘉定',
        message: '机柜湿度低于40%',
        value: 35,
        threshold: 40,
        createdAt: '2026-01-16T10:00:00Z',
        acknowledged: false,
    },
];

const workflowProfiles: Record<string, Partial<IDC.AlertDetail>> = {
    'alert-001': {
        workflowStatus: 'new', priority: 'P1', team: '北京 NOC', slaDueAt: '2026-08-19T17:40:00Z', escalationLevel: 2,
        relatedAlertIds: ['alert-006'],
        notificationDeliveries: [
            { channel: '短信', target: '北京 NOC 值班组', status: 'delivered', sentAt: '2026-08-20T01:31:00Z' },
            { channel: '电话', target: '一级值班', status: 'failed', sentAt: '2026-08-20T01:33:00Z' },
        ],
    },
    'alert-002': { workflowStatus: 'acknowledged', acknowledged: true, acknowledgedAt: '2026-08-20T01:22:00Z', acknowledgedBy: '李运维', priority: 'P2', assignee: '李运维', team: '网络组', slaDueAt: '2026-08-20T03:00:00Z', escalationLevel: 0 },
    'alert-003': { workflowStatus: 'processing', priority: 'P2', assignee: '张运维', team: '动力组', slaDueAt: '2026-08-20T04:00:00Z', escalationLevel: 1, workOrderId: 'WO-20260820-003' },
    'alert-004': { workflowStatus: 'closed', priority: 'P1', assignee: '李运维', team: '服务器组', slaDueAt: '2026-08-20T02:10:00Z', escalationLevel: 0, workOrderId: 'WO-20260820-001' },
    'alert-005': { workflowStatus: 'suppressed', priority: 'P3', assignee: '王运维', team: '容量组', slaDueAt: '2026-08-20T08:00:00Z', escalationLevel: 0, maintenanceWindow: '扩容变更 CHG-20260820-02 · 10:00-12:00' },
    'alert-006': { workflowStatus: 'reopened', priority: 'P2', team: '上海 NOC', slaDueAt: '2026-08-20T02:30:00Z', escalationLevel: 1, relatedAlertIds: ['alert-001'] },
};

mockAlerts.forEach((alert, index) => {
    Object.assign(alert, workflowProfiles[alert.id]);
    alert.createdAt = new Date(Date.parse('2026-08-20T01:30:00Z') - index * 12 * 60_000).toISOString();
    alert.timeline = [
        {
            id: `${alert.id}-created`,
            type: 'created',
            title: '告警产生',
            actor: alert.ruleName || '系统检测',
            occurredAt: alert.createdAt,
            detail: alert.message,
        },
        ...(alert.acknowledgedAt
            ? [{ id: `${alert.id}-ack`, type: 'acknowledged', title: '确认告警', actor: alert.acknowledgedBy || '值班员', occurredAt: alert.acknowledgedAt }]
            : []),
    ];
    alert.notificationDeliveries ||= [
        { channel: '企业微信', target: alert.team || '默认值班组', status: 'delivered', sentAt: alert.createdAt },
    ];
});

// 模拟告警规则
const mockRules: IDC.AlertRule[] = [
    {
        id: 'rule-001',
        name: '高温告警',
        type: 'temperature',
        enabled: true,
        condition: {
            metric: 'temperature',
            operator: '>',
            threshold: 28,
            duration: 300,
        },
        severity: 'critical',
        notification: { email: true, sms: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
    },
    {
        id: 'rule-002',
        name: '湿度告警',
        type: 'humidity',
        enabled: true,
        condition: {
            metric: 'humidity',
            operator: '<',
            threshold: 40,
            duration: 600,
        },
        severity: 'warning',
        notification: { email: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
    },
    {
        id: 'rule-003',
        name: '功率告警',
        type: 'power',
        enabled: true,
        condition: {
            metric: 'power_usage_percent',
            operator: '>=',
            threshold: 85,
        },
        severity: 'warning',
        notification: { email: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
    },
    {
        id: 'rule-004',
        name: '设备离线告警',
        type: 'device_status',
        enabled: true,
        condition: {
            metric: 'device_status',
            operator: '==',
            threshold: 0,           // 0表示离线
            duration: 120,
        },
        severity: 'error',
        notification: { email: true, sms: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
    },
    {
        id: 'rule-005',
        name: 'U位容量预警',
        type: 'capacity',
        enabled: true,
        condition: {
            metric: 'u_usage_percent',
            operator: '>=',
            threshold: 90,
        },
        severity: 'info',
        notification: { email: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
    },
    {
        id: 'rule-006',
        name: '端口利用率告警',
        type: 'port_status',
        enabled: false,
        condition: {
            metric: 'port_usage_percent',
            operator: '>',
            threshold: 80,
        },
        severity: 'warning',
        notification: { email: true },
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2026-01-05T08:00:00Z',
    },
];

// Mock 告警中心数据
export default {
    // 获取告警列表
    'GET /api/idc/alerts': async (req: Request, res: Response) => {
        await waitTime(300);
        const {
            current = 1,
            pageSize = 10,
            level,
            acknowledged,
            type,
            keyword,
            startTime,
            endTime,
            deviceId,
            cabinetId,
            datacenterId,
            workflowStatus,
            assignee,
        } = req.query;

        let filtered = [...mockAlerts];

        if (level) {
            filtered = filtered.filter(a => a.level === level);
        }
        if (acknowledged !== undefined) {
            const ack = acknowledged === 'true';
            filtered = filtered.filter(a => a.acknowledged === ack);
        }
        if (type) {
            filtered = filtered.filter(a => a.type === type);
        }
        if (deviceId) {
            filtered = filtered.filter(a => a.deviceId === String(deviceId));
        }
        if (cabinetId) {
            filtered = filtered.filter(a => a.cabinetId === String(cabinetId));
        }
        if (datacenterId) {
            filtered = filtered.filter(a => a.datacenterId === String(datacenterId));
        }
        if (workflowStatus) {
            filtered = filtered.filter(a => a.workflowStatus === String(workflowStatus));
        }
        if (assignee) {
            filtered = filtered.filter(a => a.assignee === String(assignee));
        }
        if (keyword) {
            const normalizedKeyword = String(keyword).trim().toLowerCase();
            filtered = filtered.filter(alert =>
                [
                    alert.message,
                    alert.deviceName,
                    alert.cabinetName,
                    alert.datacenterName,
                    alert.ruleName,
                ].some(value => value?.toLowerCase().includes(normalizedKeyword)),
            );
        }
        if (startTime) {
            const startTimestamp = new Date(String(startTime)).getTime();
            filtered = filtered.filter(
                alert => new Date(alert.createdAt).getTime() >= startTimestamp,
            );
        }
        if (endTime) {
            const endTimestamp = new Date(String(endTime)).getTime();
            filtered = filtered.filter(
                alert => new Date(alert.createdAt).getTime() <= endTimestamp,
            );
        }

        // 分页
        const start = (Number(current) - 1) * Number(pageSize);
        const end = start + Number(pageSize);
        const data = filtered
            .sort((a, b) => {
                const aBreached = a.slaDueAt && new Date(a.slaDueAt).getTime() < Date.now() ? 1 : 0;
                const bBreached = b.slaDueAt && new Date(b.slaDueAt).getTime() < Date.now() ? 1 : 0;
                return bBreached - aBreached || String(a.slaDueAt).localeCompare(String(b.slaDueAt));
            })
            .slice(start, end);

        res.json({
            success: true,
            data,
            total: filtered.length,
            current: Number(current),
            pageSize: Number(pageSize),
        });
    },

    // 获取告警统计
    'GET /api/idc/alerts/stats': async (_req: Request, res: Response) => {
        await waitTime(200);

        const activeAlerts = mockAlerts.filter(alert => !['closed', 'false_positive', 'suppressed'].includes(alert.workflowStatus || 'new'));
        const stats: IDC.AlertStats = {
            total: mockAlerts.length,
            critical: activeAlerts.filter(a => a.level === 'critical').length,
            error: activeAlerts.filter(a => a.level === 'error').length,
            warning: activeAlerts.filter(a => a.level === 'warning').length,
            info: activeAlerts.filter(a => a.level === 'info').length,
            unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
            todayNew: 3,
            avgResolveTime: 45,
            slaBreached: activeAlerts.filter(a => a.slaDueAt && new Date(a.slaDueAt).getTime() < Date.now()).length,
            unassigned: activeAlerts.filter(a => !a.assignee).length,
            escalated: activeAlerts.filter(a => (a.escalationLevel || 0) > 0).length,
        };

        res.json({ success: true, data: stats });
    },

    // 确认告警
    'POST /api/idc/alerts/:id/acknowledge': async (req: Request, res: Response) => {
        await waitTime(300);
        const id = String(req.params.id);
        const { notes } = req.body as { notes?: string };

        const alert = mockAlerts.find(a => a.id === id);
        if (!alert) {
            res.status(404).json({ success: false, errorMessage: '告警不存在' });
            return;
        }
        if (alert.resolvedAt) {
            res.status(409).json({ success: false, errorMessage: '已解决的告警不能再确认' });
            return;
        }
        if (alert.acknowledged) {
            res.status(409).json({ success: false, errorMessage: '告警已确认' });
            return;
        }
        alert.acknowledged = true;
        alert.workflowStatus = 'acknowledged';
        alert.acknowledgedAt = new Date().toISOString();
        alert.acknowledgedBy = '当前用户';
        if (notes?.trim()) alert.notes = notes.trim();

        res.json({ success: true, message: `告警 ${id} 已确认` });
    },

    // 解决告警
    'POST /api/idc/alerts/:id/resolve': async (req: Request, res: Response) => {
        await waitTime(300);
        const id = String(req.params.id);
        const { notes } = req.body as { notes?: string };

        const alert = mockAlerts.find(a => a.id === id);
        if (!alert) {
            res.status(404).json({ success: false, errorMessage: '告警不存在' });
            return;
        }
        if (alert.resolvedAt) {
            res.status(409).json({ success: false, errorMessage: '告警已解决' });
            return;
        }
        if (!alert.acknowledged) {
            res.status(409).json({ success: false, errorMessage: '请先确认告警' });
            return;
        }
        alert.resolvedAt = new Date().toISOString();
        alert.workflowStatus = 'closed';
        alert.resolvedBy = '当前用户';
        if (notes?.trim()) alert.notes = notes.trim();

        res.json({ success: true, message: `告警 ${id} 已解决` });
    },

    'POST /api/idc/alerts/:id/transition': async (req: Request, res: Response) => {
        await waitTime(180);
        const alert = mockAlerts.find(item => item.id === String(req.params.id));
        if (!alert) {
            res.status(404).json({ success: false, errorMessage: '告警不存在' });
            return;
        }
        const { action, notes, assignee, team, maintenanceWindow } = req.body as {
            action: string;
            notes?: string;
            assignee?: string;
            team?: string;
            maintenanceWindow?: string;
        };
        const transitions: Record<string, IDC.AlertDetail['workflowStatus']> = {
            acknowledge: 'acknowledged', start: 'processing', recover: 'recovered', close: 'closed',
            reopen: 'reopened', suppress: 'suppressed', false_positive: 'false_positive',
        };
        const allowed: Record<string, string[]> = {
            acknowledge: ['new', 'reopened'], start: ['acknowledged'], recover: ['processing'],
            close: ['recovered'], reopen: ['closed', 'suppressed', 'false_positive'], suppress: ['new', 'acknowledged', 'processing', 'reopened'],
            false_positive: ['new', 'acknowledged', 'processing', 'reopened'], assign: ['new', 'acknowledged', 'processing', 'reopened'],
        };
        const currentStatus = alert.workflowStatus || 'new';
        if (!allowed[action]?.includes(currentStatus)) {
            res.status(409).json({ success: false, errorMessage: `${currentStatus} 状态不允许执行 ${action}` });
            return;
        }
        if (action === 'assign') {
            alert.assignee = assignee || alert.assignee;
            alert.team = team || alert.team;
        } else {
            alert.workflowStatus = transitions[action];
        }
        if (action === 'acknowledge') {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = assignee || '当前用户';
            alert.assignee ||= assignee || '当前用户';
        }
        if (action === 'close') {
            alert.resolvedAt = new Date().toISOString();
            alert.resolvedBy = '当前用户';
        }
        if (action === 'reopen') alert.resolvedAt = undefined;
        if (action === 'suppress') alert.maintenanceWindow = maintenanceWindow || '临时维护窗口 · 2 小时';
        if (notes?.trim()) alert.notes = notes.trim();
        alert.timeline ||= [];
        const transitionLabels: Record<string, string> = {
            acknowledge: '确认告警', start: '开始处理', recover: '标记恢复', close: '关闭告警',
            reopen: '重新打开', suppress: '维护抑制', false_positive: '标记误报', assign: `指派给 ${alert.assignee}`,
        };
        alert.timeline.push({
            id: `${alert.id}-${Date.now()}`,
            type: action,
            title: transitionLabels[action] || `状态变更为 ${alert.workflowStatus}`,
            actor: '当前用户',
            occurredAt: new Date().toISOString(),
            detail: notes,
        });
        res.json({ success: true, data: alert });
    },

    'POST /api/idc/alerts/:id/work-order': async (req: Request, res: Response) => {
        await waitTime(180);
        const alert = mockAlerts.find(item => item.id === String(req.params.id));
        if (!alert) {
            res.status(404).json({ success: false, errorMessage: '告警不存在' });
            return;
        }
        alert.workOrderId ||= `WO-20260820-${String(mockAlerts.indexOf(alert) + 10).padStart(3, '0')}`;
        alert.timeline ||= [];
        alert.timeline.push({ id: `${alert.id}-work-order`, type: 'work_order', title: `创建工单 ${alert.workOrderId}`, actor: '当前用户', occurredAt: new Date().toISOString() });
        res.json({ success: true, data: { workOrderId: alert.workOrderId } });
    },

    // 批量确认告警
    'POST /api/idc/alerts/batch-acknowledge': async (req: Request, res: Response) => {
        await waitTime(500);
        const { ids = [] } = req.body as { ids?: string[] };
        const result: IDC.BatchAlertOperationResult = {
            succeededIds: [],
            failed: [],
        };

        ids.forEach((id) => {
            const alert = mockAlerts.find(a => a.id === id);
            if (!alert) {
                result.failed.push({ id, reason: '告警不存在' });
                return;
            }
            if (alert.resolvedAt) {
                result.failed.push({ id, reason: '告警已解决' });
                return;
            }
            if (alert.acknowledged) {
                result.failed.push({ id, reason: '告警已确认' });
                return;
            }

            alert.acknowledged = true;
            alert.workflowStatus = 'acknowledged';
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = '当前用户';
            result.succeededIds.push(id);
        });

        res.json({ success: true, data: result });
    },

    // 批量解决告警
    'POST /api/idc/alerts/batch-resolve': async (req: Request, res: Response) => {
        await waitTime(500);
        const { ids = [] } = req.body as { ids?: string[] };
        const result: IDC.BatchAlertOperationResult = {
            succeededIds: [],
            failed: [],
        };

        ids.forEach((id) => {
            const alert = mockAlerts.find(item => item.id === id);
            if (!alert) {
                result.failed.push({ id, reason: '告警不存在' });
                return;
            }
            if (alert.resolvedAt) {
                result.failed.push({ id, reason: '告警已解决' });
                return;
            }
            if (!alert.acknowledged) {
                result.failed.push({ id, reason: '请先确认告警' });
                return;
            }

            alert.resolvedAt = new Date().toISOString();
            alert.resolvedBy = '当前用户';
            alert.workflowStatus = 'closed';
            result.succeededIds.push(id);
        });

        res.json({ success: true, data: result });
    },

    // 获取告警规则列表
    'GET /api/idc/alert-rules': async (_req: Request, res: Response) => {
        await waitTime(300);
        res.json({ success: true, data: mockRules });
    },

    // 创建告警规则
    'POST /api/idc/alert-rules': async (req: Request, res: Response) => {
        await waitTime(500);
        const body = req.body as IDC.AlertRuleCreateParams;

        const newRule: IDC.AlertRule = {
            id: `rule-${Date.now()}`,
            ...body,
            enabled: body.enabled ?? true,
            notification: body.notification || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        mockRules.push(newRule);
        res.json({ success: true, data: newRule });
    },

    // 更新告警规则
    'PUT /api/idc/alert-rules/:id': async (req: Request, res: Response) => {
        await waitTime(500);
        const id = String(req.params.id);
        const body = req.body;

        const index = mockRules.findIndex(r => r.id === id);
        if (index !== -1) {
            mockRules[index] = {
                ...mockRules[index],
                ...body,
                updatedAt: new Date().toISOString(),
            };
            res.json({ success: true, data: mockRules[index] });
        } else {
            res.status(404).json({ success: false, errorMessage: '规则不存在' });
        }
    },

    // 删除告警规则
    'DELETE /api/idc/alert-rules/:id': async (req: Request, res: Response) => {
        await waitTime(300);
        const id = String(req.params.id);

        const index = mockRules.findIndex(r => r.id === id);
        if (index !== -1) {
            mockRules.splice(index, 1);
            res.json({ success: true, message: '规则已删除' });
        } else {
            res.status(404).json({ success: false, errorMessage: '规则不存在' });
        }
    },

    // 切换规则启用状态
    'POST /api/idc/alert-rules/:id/toggle': async (req: Request, res: Response) => {
        await waitTime(300);
        const id = String(req.params.id);

        const rule = mockRules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            rule.updatedAt = new Date().toISOString();
            res.json({ success: true, data: rule });
        } else {
            res.status(404).json({ success: false, errorMessage: '规则不存在' });
        }
    },

    // 获取告警中的设备ID列表（用于3D高亮）
    'GET /api/idc/alerts/alerting-devices': async (_req: Request, res: Response) => {
        await waitTime(100);

        const alertingDeviceIds = mockAlerts
            .filter(a => !a.acknowledged && a.deviceId)
            .map(a => a.deviceId!);

        const alertingCabinetIds = mockAlerts
            .filter(a => !a.acknowledged && a.cabinetId && !a.deviceId)
            .map(a => a.cabinetId!);

        res.json({
            success: true,
            data: {
                deviceIds: [...new Set(alertingDeviceIds)],
                cabinetIds: [...new Set(alertingCabinetIds)],
            },
        });
    },
};

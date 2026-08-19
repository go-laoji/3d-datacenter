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
        const data = filtered.slice(start, end);

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

        const activeAlerts = mockAlerts.filter(alert => !alert.resolvedAt);
        const stats: IDC.AlertStats = {
            total: mockAlerts.length,
            critical: activeAlerts.filter(a => a.level === 'critical').length,
            error: activeAlerts.filter(a => a.level === 'error').length,
            warning: activeAlerts.filter(a => a.level === 'warning').length,
            info: activeAlerts.filter(a => a.level === 'info').length,
            unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
            todayNew: 3,
            avgResolveTime: 45,
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
        alert.resolvedBy = '当前用户';
        if (notes?.trim()) alert.notes = notes.trim();

        res.json({ success: true, message: `告警 ${id} 已解决` });
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

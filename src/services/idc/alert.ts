import { request } from '@umijs/max';

/** 获取告警列表 */
export async function getAlerts(params?: IDC.AlertQueryParams) {
    return request<IDC.PageResult<IDC.AlertDetail>>('/api/idc/alerts', {
        method: 'GET',
        params,
    });
}

/** 获取告警统计 */
export async function getAlertStats() {
    return request<IDC.ApiResponse<IDC.AlertStats>>('/api/idc/alerts/stats', {
        method: 'GET',
    });
}

/** 确认告警 */
export async function acknowledgeAlert(id: string, notes?: string) {
    return request<IDC.ApiResponse>(`/api/idc/alerts/${id}/acknowledge`, {
        method: 'POST',
        data: { notes },
    });
}

/** 解决告警 */
export async function resolveAlert(id: string, notes?: string) {
    return request<IDC.ApiResponse>(`/api/idc/alerts/${id}/resolve`, {
        method: 'POST',
        data: { notes },
    });
}

/** 批量确认告警 */
export async function batchAcknowledgeAlerts(ids: string[]) {
    return request<IDC.ApiResponse>('/api/idc/alerts/batch-acknowledge', {
        method: 'POST',
        data: { ids },
    });
}

/** 批量解决告警 */
export async function batchResolveAlerts(ids: string[]) {
    return request<IDC.ApiResponse>('/api/idc/alerts/batch-resolve', {
        method: 'POST',
        data: { ids },
    });
}

/** 获取告警规则列表 */
export async function getAlertRules() {
    return request<IDC.ApiResponse<IDC.AlertRule[]>>('/api/idc/alert-rules', {
        method: 'GET',
    });
}

/** 创建告警规则 */
export async function createAlertRule(data: IDC.AlertRuleCreateParams) {
    return request<IDC.ApiResponse<IDC.AlertRule>>('/api/idc/alert-rules', {
        method: 'POST',
        data,
    });
}

/** 更新告警规则 */
export async function updateAlertRule(id: string, data: Partial<IDC.AlertRule>) {
    return request<IDC.ApiResponse<IDC.AlertRule>>(`/api/idc/alert-rules/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除告警规则 */
export async function deleteAlertRule(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/alert-rules/${id}`, {
        method: 'DELETE',
    });
}

/** 切换规则启用状态 */
export async function toggleAlertRule(id: string) {
    return request<IDC.ApiResponse<IDC.AlertRule>>(`/api/idc/alert-rules/${id}/toggle`, {
        method: 'POST',
    });
}

/** 获取告警中的设备ID列表（用于3D高亮） */
export async function getAlertingDevices() {
    return request<IDC.ApiResponse<{
        deviceIds: string[];
        cabinetIds: string[];
    }>>('/api/idc/alerts/alerting-devices', {
        method: 'GET',
    });
}

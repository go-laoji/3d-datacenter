import { request } from '@umijs/max';

/** 获取设备的端口列表 */
export async function getPortsByDevice(
    deviceId: string,
    params?: { portType?: string; status?: string; linkStatus?: string },
) {
    return request<IDC.ApiResponse<IDC.Port[]> & { total: number }>(
        `/api/idc/ports/by-device/${deviceId}`,
        {
            method: 'GET',
            params,
        },
    );
}

/** 获取单个端口 */
export async function getPort(id: string) {
    return request<IDC.ApiResponse<IDC.Port>>(`/api/idc/ports/${id}`, {
        method: 'GET',
    });
}

/** 更新端口配置 */
export async function updatePort(id: string, data: IDC.PortUpdateParams) {
    return request<IDC.ApiResponse<IDC.Port>>(`/api/idc/ports/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 批量更新端口VLAN配置 */
export async function batchUpdatePortVlan(portIds: string[], vlanConfig: IDC.VlanConfig) {
    return request<IDC.ApiResponse<IDC.Port[]>>('/api/idc/ports/batch-vlan', {
        method: 'POST',
        data: { portIds, vlanConfig },
    });
}

/** 批量更新端口状态 */
export async function batchUpdatePortStatus(portIds: string[], status: IDC.Port['status']) {
    return request<IDC.ApiResponse>('/api/idc/ports/batch-status', {
        method: 'POST',
        data: { portIds, status },
    });
}

/** 获取端口统计 */
export async function getPortStats(deviceId: string) {
    return request<IDC.ApiResponse<{
        total: number;
        up: number;
        down: number;
        disabled: number;
        error: number;
        connected: number;
        disconnected: number;
        byType: Record<string, number>;
    }>>(`/api/idc/ports/stats/${deviceId}`, {
        method: 'GET',
    });
}

/** 获取端口类型选项 */
export async function getPortTypes() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/port-types',
        {
            method: 'GET',
        },
    );
}

/** 获取速率选项 */
export async function getPortSpeeds() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/port-speeds',
        {
            method: 'GET',
        },
    );
}

/** 获取VLAN模式选项 */
export async function getVlanModes() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/vlan-modes',
        {
            method: 'GET',
        },
    );
}

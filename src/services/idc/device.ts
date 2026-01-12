import { request } from '@umijs/max';

/** 获取设备列表 */
export async function getDevices(
    params?: IDC.PageParams & {
        cabinetId?: string;
        templateId?: string;
        name?: string;
        status?: string;
        assetCode?: string;
        managementIp?: string;
        department?: string;
    },
) {
    return request<IDC.PageResult<IDC.Device>>('/api/idc/devices', {
        method: 'GET',
        params,
    });
}

/** 获取单个设备 */
export async function getDevice(id: string) {
    return request<IDC.ApiResponse<IDC.Device>>(`/api/idc/devices/${id}`, {
        method: 'GET',
    });
}

/** 创建设备（上架） */
export async function createDevice(data: IDC.DeviceCreateParams) {
    return request<IDC.ApiResponse<IDC.Device>>('/api/idc/devices', {
        method: 'POST',
        data,
    });
}

/** 更新设备 */
export async function updateDevice(id: string, data: Partial<IDC.Device>) {
    return request<IDC.ApiResponse<IDC.Device>>(`/api/idc/devices/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除设备（下架） */
export async function deleteDevice(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/devices/${id}`, {
        method: 'DELETE',
    });
}

/** 获取机柜内的设备 */
export async function getDevicesByCabinet(cabinetId: string) {
    return request<IDC.ApiResponse<IDC.Device[]>>(
        `/api/idc/devices/by-cabinet/${cabinetId}`,
        {
            method: 'GET',
        },
    );
}

/** 批量更新设备状态 */
export async function batchUpdateDeviceStatus(ids: string[], status: IDC.Device['status']) {
    return request<IDC.ApiResponse>('/api/idc/devices/batch-status', {
        method: 'POST',
        data: { ids, status },
    });
}

/** 获取设备统计 */
export async function getDeviceStats() {
    return request<IDC.ApiResponse<{
        total: number;
        online: number;
        offline: number;
        warning: number;
        error: number;
        maintenance: number;
        byCategory: Record<string, number>;
        byDepartment: Record<string, number>;
    }>>('/api/idc/devices/stats', {
        method: 'GET',
    });
}

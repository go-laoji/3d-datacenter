import { request } from '@umijs/max';

export interface ConnectionHistoryItem {
    id: string;
    action: string;
    operator: string;
    occurredAt: string;
    detail: string;
}

export interface ConnectionView extends IDC.Connection {
    sourceDeviceName: string;
    sourceDeviceLocation: string;
    sourcePortName: string;
    sourcePortSpeed: string;
    targetDeviceName: string;
    targetDeviceLocation: string;
    targetPortName: string;
    targetPortSpeed: string;
    impact: string[];
    history: ConnectionHistoryItem[];
}

export interface ConnectionValidation {
    valid: boolean;
    blockers: string[];
    warnings: string[];
}

export interface ConnectionImportRow {
    row: number;
    cableNumber: string;
    source: string;
    target: string;
    status: 'ready' | 'conflict' | 'invalid';
    message: string;
}

/** 获取连线列表 */
export async function getConnections(
    params?: IDC.PageParams & {
        connectionType?: string;
        cableType?: string;
        sourceDeviceId?: string;
        targetDeviceId?: string;
        status?: string;
        cableNumber?: string;
        deviceId?: string;
        keyword?: string;
    },
) {
    return request<IDC.PageResult<ConnectionView>>('/api/idc/connections', {
        method: 'GET',
        params,
    });
}

/** 获取单条连线 */
export async function getConnection(id: string) {
    return request<IDC.ApiResponse<ConnectionView>>(`/api/idc/connections/${id}`, {
        method: 'GET',
    });
}

export async function validateConnection(data: Pick<IDC.ConnectionCreateParams, 'sourceDeviceId' | 'sourcePortId' | 'targetDeviceId' | 'targetPortId' | 'cableType'>) {
    return request<IDC.ApiResponse<ConnectionValidation>>('/api/idc/connections/validate', {
        method: 'POST',
        data,
    });
}

export async function previewConnectionImport(content: string) {
    return request<IDC.ApiResponse<{ rows: ConnectionImportRow[]; ready: number; conflicts: number }>>('/api/idc/connections/import-preview', {
        method: 'POST',
        data: { content },
    });
}

export async function applyConnectionImport(rows: ConnectionImportRow[]) {
    return request<IDC.ApiResponse<{ created: number; skipped: number }>>('/api/idc/connections/import-apply', {
        method: 'POST',
        data: { rows },
    });
}

/** 创建连线 */
export async function createConnection(data: IDC.ConnectionCreateParams) {
    return request<IDC.ApiResponse<IDC.Connection>>('/api/idc/connections', {
        method: 'POST',
        data,
    });
}

/** 更新连线 */
export async function updateConnection(id: string, data: Partial<IDC.Connection>) {
    return request<IDC.ApiResponse<IDC.Connection>>(`/api/idc/connections/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除连线 */
export async function deleteConnection(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/connections/${id}`, {
        method: 'DELETE',
    });
}

/** 获取设备的连线 */
export async function getConnectionsByDevice(deviceId: string) {
    return request<IDC.ApiResponse<IDC.Connection[]>>(
        `/api/idc/connections/by-device/${deviceId}`,
        {
            method: 'GET',
        },
    );
}

/** 获取数据中心的所有连线 */
export async function getConnectionsByDatacenter(datacenterId: string) {
    return request<IDC.ApiResponse<IDC.Connection[]>>(
        `/api/idc/connections/by-datacenter/${datacenterId}`,
        {
            method: 'GET',
        },
    );
}

/** 获取连线类型选项 */
export async function getConnectionTypes() {
    return request<IDC.ApiResponse<{ value: string; label: string; color: string }[]>>(
        '/api/idc/connection-types',
        {
            method: 'GET',
        },
    );
}

/** 获取线缆类型选项 */
export async function getCableTypes() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/cable-types',
        {
            method: 'GET',
        },
    );
}

/** 获取连线统计 */
export async function getConnectionStats() {
    return request<IDC.ApiResponse<{
        total: number;
        active: number;
        inactive: number;
        faulty: number;
        byType: Record<string, number>;
        byCableType: Record<string, number>;
    }>>('/api/idc/connections/stats', {
        method: 'GET',
    });
}

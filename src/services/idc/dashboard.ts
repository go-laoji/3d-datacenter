import { request } from '@umijs/max';

/** 获取仪表板统计数据 */
export async function getDashboardStats() {
    return request<IDC.ApiResponse<IDC.DashboardStats>>('/api/idc/dashboard/stats', {
        method: 'GET',
    });
}

/** 获取设备状态趋势 */
export async function getDeviceTrend(days: number = 7) {
    return request<IDC.ApiResponse<{
        date: string;
        online: number;
        offline: number;
        warning: number;
        error: number;
    }[]>>('/api/idc/dashboard/device-trend', {
        method: 'GET',
        params: { days },
    });
}

/** 获取机柜使用率排行 */
export async function getCabinetUsageRank(limit: number = 10) {
    return request<IDC.ApiResponse<{
        cabinetId: string;
        cabinetName: string;
        usage: number;
    }[]>>('/api/idc/dashboard/cabinet-usage-rank', {
        method: 'GET',
        params: { limit },
    });
}

/** 获取设备分类统计 */
export async function getDeviceCategory() {
    return request<IDC.ApiResponse<{
        category: string;
        label: string;
        count: number;
        color: string;
    }[]>>('/api/idc/dashboard/device-category', {
        method: 'GET',
    });
}

/** 获取数据中心负载 */
export async function getDatacenterLoad() {
    return request<IDC.ApiResponse<{
        datacenterId: string;
        name: string;
        cabinetUsage: number;
        powerUsage: number;
        deviceCount: number;
    }[]>>('/api/idc/dashboard/datacenter-load', {
        method: 'GET',
    });
}

/** 获取最近操作记录 */
export async function getRecentOperations(limit: number = 10) {
    return request<IDC.ApiResponse<{
        id: string;
        type: string;
        operator: string;
        target: string;
        description: string;
        createdAt: string;
    }[]>>('/api/idc/dashboard/recent-operations', {
        method: 'GET',
        params: { limit },
    });
}

/** 确认告警 */
export async function acknowledgeAlert(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/dashboard/alerts/${id}/acknowledge`, {
        method: 'POST',
    });
}

/** 获取拓扑数据 */
export async function getTopology(datacenterId: string) {
    return request<IDC.ApiResponse<{
        datacenterId: string;
        nodes: {
            id: string;
            label: string;
            type: string;
            status: string;
            x: number;
            y: number;
        }[];
        edges: {
            source: string;
            target: string;
            type: string;
        }[];
    }>>(`/api/idc/topology/${datacenterId}`, {
        method: 'GET',
    });
}

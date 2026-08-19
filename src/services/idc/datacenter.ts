import { request } from '@umijs/max';

/** 获取数据中心列表 */
export async function getDatacenters(
    params?: IDC.PageParams & { name?: string; status?: string; code?: string },
) {
    return request<IDC.PageResult<IDC.Datacenter>>('/api/idc/datacenters', {
        method: 'GET',
        params,
    });
}

/** 获取单个数据中心 */
export async function getDatacenter(id: string) {
    return request<IDC.ApiResponse<IDC.Datacenter>>(`/api/idc/datacenters/${id}`, {
        method: 'GET',
    });
}

/** 创建数据中心 */
export async function createDatacenter(data: IDC.DatacenterCreateParams) {
    return request<IDC.ApiResponse<IDC.Datacenter>>('/api/idc/datacenters', {
        method: 'POST',
        data,
    });
}

/** 更新数据中心 */
export async function updateDatacenter(id: string, data: Partial<IDC.Datacenter>) {
    return request<IDC.ApiResponse<IDC.Datacenter>>(`/api/idc/datacenters/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除数据中心 */
export async function deleteDatacenter(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/datacenters/${id}`, {
        method: 'DELETE',
    });
}

/** 获取站点归档影响范围 */
export async function getDatacenterArchiveImpact(id: string) {
    return request<IDC.ApiResponse<IDC.DatacenterDependencyImpact>>(
        `/api/idc/datacenters/${id}/archive-impact`,
        { method: 'GET' },
    );
}

/** 归档数据中心（保留资产与历史关系） */
export async function archiveDatacenter(id: string) {
    return request<IDC.ApiResponse<IDC.Datacenter>>(
        `/api/idc/datacenters/${id}/archive`,
        { method: 'POST' },
    );
}

/** 获取所有数据中心（下拉选择用） */
export async function getAllDatacenters() {
    return request<IDC.ApiResponse<{ id: string; name: string; code: string }[]>>(
        '/api/idc/datacenters/all',
        {
            method: 'GET',
        },
    );
}

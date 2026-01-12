import { request } from '@umijs/max';

/** 获取设备模板列表 */
export async function getDeviceTemplates(
    params?: IDC.PageParams & {
        category?: string;
        brand?: string;
        name?: string;
        isBuiltin?: string;
    },
) {
    return request<IDC.PageResult<IDC.DeviceTemplate>>('/api/idc/device-templates', {
        method: 'GET',
        params,
    });
}

/** 获取单个设备模板 */
export async function getDeviceTemplate(id: string) {
    return request<IDC.ApiResponse<IDC.DeviceTemplate>>(`/api/idc/device-templates/${id}`, {
        method: 'GET',
    });
}

/** 创建设备模板 */
export async function createDeviceTemplate(data: IDC.DeviceTemplateCreateParams) {
    return request<IDC.ApiResponse<IDC.DeviceTemplate>>('/api/idc/device-templates', {
        method: 'POST',
        data,
    });
}

/** 更新设备模板 */
export async function updateDeviceTemplate(id: string, data: Partial<IDC.DeviceTemplate>) {
    return request<IDC.ApiResponse<IDC.DeviceTemplate>>(`/api/idc/device-templates/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除设备模板 */
export async function deleteDeviceTemplate(id: string) {
    return request<IDC.ApiResponse>(`/api/idc/device-templates/${id}`, {
        method: 'DELETE',
    });
}

/** 获取所有设备模板（下拉选择用） */
export async function getAllDeviceTemplates(category?: string) {
    return request<IDC.ApiResponse<{
        id: string;
        name: string;
        brand: string;
        model: string;
        category: string;
        uHeight: number;
    }[]>>('/api/idc/device-templates/all', {
        method: 'GET',
        params: { category },
    });
}

/** 获取设备类别 */
export async function getDeviceCategories() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/device-categories',
        {
            method: 'GET',
        },
    );
}

/** 获取品牌列表 */
export async function getDeviceBrands() {
    return request<IDC.ApiResponse<{ value: string; label: string }[]>>(
        '/api/idc/device-brands',
        {
            method: 'GET',
        },
    );
}

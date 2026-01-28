import { request } from '@umijs/max';

// PDU设备接口
export interface PDUDevice {
    id: string;
    name: string;
    category: 'pdu';
    cabinetId: string;
    startU: number;
    endU: number;
    uHeight: number;
    assetCode: string;
    status: 'online' | 'offline' | 'warning' | 'error';
    managementIp?: string;
    pduData: {
        powerPath: 'A' | 'B';
        inputVoltage: number;
        outputPorts: number;
        maxLoad: number;
        currentLoad: number;
        brand?: string;
        model?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

// PDU设备模板
export interface PDUTemplate {
    id: string;
    category: 'pdu';
    brand: string;
    model: string;
    uHeight: number;
    specs: {
        inputVoltage: string;
        outputPorts: number;
        maxLoad: string;
        ratedCurrent: string;
    };
}

// 获取PDU设备列表
export async function getPDUDevices(params?: {
    cabinetId?: string;
    powerPath?: 'A' | 'B';
}) {
    return request<{
        success: boolean;
        data: PDUDevice[];
        total: number;
    }>('/api/pdu/devices', {
        method: 'GET',
        params,
    });
}

// 获取PDU设备详情
export async function getPDUDevice(id: string) {
    return request<{
        success: boolean;
        data: PDUDevice;
    }>(`/api/pdu/devices/${id}`, {
        method: 'GET',
    });
}

// 创建PDU设备
export async function createPDUDevice(data: Partial<PDUDevice>) {
    return request<{
        success: boolean;
        data: PDUDevice;
    }>('/api/pdu/devices', {
        method: 'POST',
        data,
    });
}

// 更新PDU设备
export async function updatePDUDevice(id: string, data: Partial<PDUDevice>) {
    return request<{
        success: boolean;
        data: PDUDevice;
    }>(`/api/pdu/devices/${id}`, {
        method: 'PUT',
        data,
    });
}

// 删除PDU设备
export async function deletePDUDevice(id: string) {
    return request<{
        success: boolean;
        message: string;
    }>(`/api/pdu/devices/${id}`, {
        method: 'DELETE',
    });
}

// 获取PDU设备模板
export async function getPDUTemplates() {
    return request<{
        success: boolean;
        data: PDUTemplate[];
        total: number;
    }>('/api/pdu/templates', {
        method: 'GET',
    });
}

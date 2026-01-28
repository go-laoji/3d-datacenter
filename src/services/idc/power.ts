import { request } from '@umijs/max';

// 电源拓扑节点
export interface PowerNode {
    id: string;
    type: 'utility' | 'ups' | 'pdu' | 'device';
    name: string;
    status: 'online' | 'offline' | 'warning';
    load?: number;
    capacity?: number;
}

// 电源链路
export interface PowerLink {
    id: string;
    source: string;
    target: string;
    powerPath: 'A' | 'B';
    status: 'active' | 'inactive' | 'fault';
}

// 冗余状态
export interface RedundancyStatus {
    dualPower: Array<PowerNode & { powerPaths: string[] }>;
    singlePower: Array<PowerNode & { powerPaths: string[]; risk: string }>;
    summary: {
        totalDevices: number;
        dualPowerCount: number;
        singlePowerCount: number;
        redundancyRate: string;
    };
}

// 负载均衡状态
export interface LoadBalanceStatus {
    pathA: { load: number; percentage: string };
    pathB: { load: number; percentage: string };
    totalLoad: number;
    balanceRate: string;
    status: 'balanced' | 'warning' | 'unbalanced';
}

// 获取电源拓扑
export async function getPowerTopology(datacenterId?: string) {
    return request<{
        success: boolean;
        data: {
            nodes: PowerNode[];
            links: PowerLink[];
        };
    }>('/api/power/topology', {
        method: 'GET',
        params: { datacenterId },
    });
}

// 获取电源冗余状态
export async function getPowerRedundancy(datacenterId?: string) {
    return request<{
        success: boolean;
        data: RedundancyStatus;
    }>('/api/power/redundancy', {
        method: 'GET',
        params: { datacenterId },
    });
}

// 获取负载均衡状态
export async function getPowerLoadBalance(datacenterId?: string) {
    return request<{
        success: boolean;
        data: LoadBalanceStatus;
    }>('/api/power/load-balance', {
        method: 'GET',
        params: { datacenterId },
    });
}

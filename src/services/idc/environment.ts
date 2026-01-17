import { request } from '@umijs/max';

/** 获取所有机柜环境数据 */
export async function getCabinetEnvironments() {
    return request<IDC.ApiResponse<IDC.CabinetEnvironment[]>>('/api/idc/environment/cabinets', {
        method: 'GET',
    });
}

/** 获取单个机柜传感器详细数据 */
export async function getCabinetSensors(cabinetId: string) {
    return request<IDC.ApiResponse<IDC.EnvironmentSensor[]>>(`/api/idc/environment/cabinet/${cabinetId}`, {
        method: 'GET',
    });
}

/** 获取温度趋势数据 */
export async function getTemperatureTrend(hours: number = 24) {
    return request<IDC.ApiResponse<IDC.TemperatureTrend[]>>('/api/idc/environment/temperature-trend', {
        method: 'GET',
        params: { hours },
    });
}

/** 获取PUE趋势数据 */
export async function getPueTrend(days: number = 30, datacenterId?: string) {
    return request<IDC.ApiResponse<IDC.PueData[]>>('/api/idc/environment/pue-trend', {
        method: 'GET',
        params: { days, datacenterId },
    });
}

/** 获取能耗统计 */
export async function getEnergyStats() {
    return request<IDC.ApiResponse<IDC.EnergyStats>>('/api/idc/environment/energy-stats', {
        method: 'GET',
    });
}

/** 获取机柜能耗数据 */
export async function getPowerConsumption(cabinetId?: string) {
    return request<IDC.ApiResponse<IDC.PowerConsumption[]>>('/api/idc/environment/power', {
        method: 'GET',
        params: { cabinetId },
    });
}

/** 获取环境监控概览 */
export async function getEnvironmentOverview() {
    return request<IDC.ApiResponse<{
        totalCabinets: number;
        normalCabinets: number;
        warningCabinets: number;
        criticalCabinets: number;
        avgTemperature: number;
        avgHumidity: number;
        maxTemperature: number;
        maxTemperatureCabinet: string;
        minTemperature: number;
        totalPower: number;
        avgPue: number;
    }>>('/api/idc/environment/overview', {
        method: 'GET',
    });
}

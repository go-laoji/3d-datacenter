import { request } from '@umijs/max';

export type EnvironmentDataQuality =
  | 'good'
  | 'delayed'
  | 'interrupted'
  | 'estimated'
  | 'invalid';

export interface EnvironmentThresholds {
  temperatureWarning: number;
  temperatureCritical: number;
  humidityLow: number;
  humidityHigh: number;
  pueTarget: number;
  pueWarning: number;
  hysteresis: number;
  durationMinutes: number;
  source: string;
  maintenanceWindow?: string;
}

export interface EnvironmentOverview {
  totalCabinets: number;
  normalCabinets: number;
  warningCabinets: number;
  criticalCabinets: number;
  unavailableCabinets: number;
  avgTemperature: number | null;
  avgHumidity: number | null;
  maxTemperature: number | null;
  maxTemperatureCabinet: string;
  minTemperature: number | null;
  totalPower: number | null;
  avgPue: number | null;
  collectedAt: string;
  source: string;
  quality: EnvironmentDataQuality;
  thresholds: EnvironmentThresholds;
}

export interface CabinetEnvironmentView {
  cabinetId: string;
  cabinetName: string;
  datacenterId: string;
  datacenterName: string;
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  avgHumidity: number | null;
  status: 'normal' | 'warning' | 'critical' | 'unavailable';
  quality: EnvironmentDataQuality;
  source: string;
  collectedAt: string;
  sensorCount: number;
  anomalyReason?: string;
}

export interface EnvironmentSensorView {
  id: string;
  cabinetId: string;
  cabinetName: string;
  position: 'front' | 'rear' | 'top' | 'bottom';
  temperature: number | null;
  humidity: number | null;
  lastUpdated: string;
  quality: EnvironmentDataQuality;
  source: string;
}

export interface TemperaturePoint {
  timestamp: string;
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  avgHumidity: number | null;
  maxHumidity: number | null;
  power: number | null;
  baseline: number;
  threshold: number;
  quality: EnvironmentDataQuality;
  cabinetId?: string;
  sensorId?: string;
}

export interface PuePoint extends IDC.PueData {
  target: number;
  threshold: number;
  quality: EnvironmentDataQuality;
}

export interface EnvironmentQuery {
  datacenterId?: string;
  range?: '24h' | '7d' | '30d';
  granularity?: '1h' | '6h' | '1d';
}

export async function getCabinetEnvironments(datacenterId?: string) {
  return request<IDC.ApiResponse<CabinetEnvironmentView[]>>(
    '/api/idc/environment/cabinets',
    { method: 'GET', params: { datacenterId } },
  );
}

export async function getCabinetSensors(cabinetId: string) {
  return request<IDC.ApiResponse<EnvironmentSensorView[]>>(
    `/api/idc/environment/cabinet/${cabinetId}`,
    { method: 'GET' },
  );
}

export async function getTemperatureTrend(params: EnvironmentQuery = {}) {
  return request<IDC.ApiResponse<TemperaturePoint[]>>(
    '/api/idc/environment/temperature-trend',
    { method: 'GET', params },
  );
}

export async function getPueTrend(params: EnvironmentQuery = {}) {
  return request<IDC.ApiResponse<PuePoint[]>>(
    '/api/idc/environment/pue-trend',
    { method: 'GET', params },
  );
}

export async function getEnvironmentThresholds() {
  return request<IDC.ApiResponse<EnvironmentThresholds>>(
    '/api/idc/environment/thresholds',
    { method: 'GET' },
  );
}

export async function getEnergyStats() {
  return request<IDC.ApiResponse<IDC.EnergyStats>>(
    '/api/idc/environment/energy-stats',
    { method: 'GET' },
  );
}

export async function getPowerConsumption(cabinetId?: string) {
  return request<IDC.ApiResponse<IDC.PowerConsumption[]>>(
    '/api/idc/environment/power',
    { method: 'GET', params: { cabinetId } },
  );
}

export async function getEnvironmentOverview(datacenterId?: string) {
  return request<IDC.ApiResponse<EnvironmentOverview>>(
    '/api/idc/environment/overview',
    { method: 'GET', params: { datacenterId } },
  );
}

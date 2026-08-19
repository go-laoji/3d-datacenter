import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type CabinetUsageRankItem,
  type DashboardTrendPoint,
  getCabinetUsageRank,
  getDashboardStats,
  getDeviceTrend,
  getRecentOperations,
  type RecentOperation,
} from '@/services/idc/dashboard';
import { getEnvironmentOverview } from '@/services/idc/environment';

export interface EnergyOverview {
  avgTemperature: number | null;
  avgHumidity: number | null;
  maxTemperature: number | null;
  maxTemperatureCabinet: string;
  totalPower: number | null;
  avgPue: number | null;
}

export interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const REFRESH_STORAGE_KEY = 'dashboard-refresh-seconds';

function initialLoadable<T>(): Loadable<T> {
  return { data: null, loading: true, error: null };
}

function getInitialRefreshSeconds(): number {
  if (typeof window === 'undefined') return 60;
  const stored = Number(localStorage.getItem(REFRESH_STORAGE_KEY));
  return [0, 30, 60, 300].includes(stored) ? stored : 60;
}

export function useDashboardData() {
  const [stats, setStats] =
    useState<Loadable<IDC.DashboardStats>>(initialLoadable);
  const [trend, setTrend] =
    useState<Loadable<DashboardTrendPoint[]>>(initialLoadable);
  const [cabinetRank, setCabinetRank] =
    useState<Loadable<CabinetUsageRankItem[]>>(initialLoadable);
  const [operations, setOperations] =
    useState<Loadable<RecentOperation[]>>(initialLoadable);
  const [energy, setEnergy] =
    useState<Loadable<EnergyOverview>>(initialLoadable);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshSeconds, setRefreshSecondsState] = useState(
    getInitialRefreshSeconds,
  );

  const loadStats = useCallback(async () => {
    setStats((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getDashboardStats();
      if (!response.success || !response.data) throw new Error('统计数据为空');
      setStats({ data: response.data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (_error) {
      setStats((current) => ({
        ...current,
        loading: false,
        error: '核心指标加载失败',
      }));
    }
  }, []);

  const loadTrend = useCallback(async () => {
    setTrend((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getDeviceTrend(7);
      if (!response.success || !response.data) throw new Error('趋势数据为空');
      setTrend({ data: response.data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (_error) {
      setTrend((current) => ({
        ...current,
        loading: false,
        error: '设备趋势加载失败',
      }));
    }
  }, []);

  const loadCabinetRank = useCallback(async () => {
    setCabinetRank((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getCabinetUsageRank(5);
      if (!response.success || !response.data) throw new Error('机柜数据为空');
      setCabinetRank({ data: response.data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (_error) {
      setCabinetRank((current) => ({
        ...current,
        loading: false,
        error: '容量风险加载失败',
      }));
    }
  }, []);

  const loadOperations = useCallback(async () => {
    setOperations((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getRecentOperations(5);
      if (!response.success || !response.data) throw new Error('操作数据为空');
      setOperations({ data: response.data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (_error) {
      setOperations((current) => ({
        ...current,
        loading: false,
        error: '最近动态加载失败',
      }));
    }
  }, []);

  const loadEnergy = useCallback(async () => {
    setEnergy((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getEnvironmentOverview();
      if (!response.success || !response.data) throw new Error('环境数据为空');
      setEnergy({ data: response.data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (_error) {
      setEnergy((current) => ({
        ...current,
        loading: false,
        error: '动环指标加载失败',
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      loadStats(),
      loadTrend(),
      loadCabinetRank(),
      loadOperations(),
      loadEnergy(),
    ]);
  }, [loadCabinetRank, loadEnergy, loadOperations, loadStats, loadTrend]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!refreshSeconds) return undefined;
    const timer = window.setInterval(() => {
      void refreshAll();
    }, refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [refreshAll, refreshSeconds]);

  const setRefreshSeconds = useCallback((seconds: number) => {
    localStorage.setItem(REFRESH_STORAGE_KEY, String(seconds));
    setRefreshSecondsState(seconds);
  }, []);

  const refreshing = useMemo(
    () =>
      [stats, trend, cabinetRank, operations, energy].some(
        (module) => module.loading,
      ),
    [cabinetRank, energy, operations, stats, trend],
  );

  return {
    stats,
    trend,
    cabinetRank,
    operations,
    energy,
    lastUpdated,
    refreshSeconds,
    refreshing,
    loadStats,
    loadTrend,
    loadCabinetRank,
    loadOperations,
    loadEnergy,
    refreshAll,
    setRefreshSeconds,
  };
}

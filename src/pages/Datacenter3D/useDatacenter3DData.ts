import { useCallback, useEffect, useState } from 'react';
import { getCabinetsByDatacenter } from '@/services/idc/cabinet';
import { getConnectionsByDatacenter } from '@/services/idc/connection';
import { getAllDatacenters } from '@/services/idc/datacenter';
import { getDevices } from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { getCabinetEnvironments } from '@/services/idc/environment';
import { getDatacenterLayout } from '@/services/idc/layout';

export interface CabinetTemperature {
  cabinetId: string;
  temperature: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface DatacenterOption {
  id: string;
  name: string;
  code: string;
}

export function useDatacenter3DData(selectedDatacenterId?: string) {
  const [datacenters, setDatacenters] = useState<DatacenterOption[]>([]);
  const [templates, setTemplates] = useState<IDC.DeviceTemplate[]>([]);
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [devices, setDevices] = useState<IDC.Device[]>([]);
  const [connections, setConnections] = useState<IDC.Connection[]>([]);
  const [layout, setLayout] = useState<IDC.DatacenterLayout | null>(null);
  const [temperatures, setTemperatures] = useState<CabinetTemperature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [refreshedAt, setRefreshedAt] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([getAllDatacenters(), getAllDeviceTemplates()])
      .then(([datacenterResponse, templateResponse]) => {
        if (!active) return;
        if (datacenterResponse.success) {
          setDatacenters(datacenterResponse.data || []);
        }
        if (templateResponse.success) {
          setTemplates(templateResponse.data || []);
        }
      })
      .catch(() => {
        if (active) setError('机房基础数据加载失败，请稍后重试');
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedDatacenterId) return;
    setLoading(true);
    setError(undefined);
    try {
      const [
        cabinetResponse,
        deviceResponse,
        connectionResponse,
        layoutResponse,
        environmentResponse,
      ] = await Promise.all([
        getCabinetsByDatacenter(selectedDatacenterId),
        getDevices({
          datacenterId: selectedDatacenterId,
          current: 1,
          pageSize: 1000,
        }),
        getConnectionsByDatacenter(selectedDatacenterId),
        getDatacenterLayout(selectedDatacenterId),
        getCabinetEnvironments(selectedDatacenterId),
      ]);

      if (!cabinetResponse.success || !deviceResponse.success) {
        throw new Error('scene data unavailable');
      }
      setCabinets(cabinetResponse.data || []);
      setDevices(deviceResponse.data || []);
      setConnections(
        connectionResponse.success ? connectionResponse.data || [] : [],
      );
      setLayout(layoutResponse.success ? layoutResponse.data || null : null);
      setTemperatures(
        environmentResponse.success
          ? (environmentResponse.data || []).flatMap((environment) =>
              environment.avgTemperature === null ||
              environment.status === 'unavailable'
                ? []
                : [
                    {
                      cabinetId: environment.cabinetId,
                      temperature: environment.avgTemperature,
                      status: environment.status,
                    },
                  ],
            )
          : [],
      );
      setRefreshedAt(new Date().toISOString());
    } catch {
      setError('3D 场景数据加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedDatacenterId]);

  useEffect(() => {
    setCabinets([]);
    setDevices([]);
    setConnections([]);
    setLayout(null);
    setTemperatures([]);
    void refresh();
  }, [refresh]);

  return {
    datacenters,
    templates,
    cabinets,
    devices,
    connections,
    layout,
    temperatures,
    loading,
    error,
    refreshedAt,
    refresh,
  };
}

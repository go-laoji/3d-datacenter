import { useCallback, useEffect, useState } from 'react';
import { getCabinet } from '@/services/idc/cabinet';
import { getDevicesByCabinet } from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { getPortsByDevice } from '@/services/idc/port';

export function useCabinet3DData(cabinetId: string | null) {
  const [cabinet, setCabinet] = useState<IDC.Cabinet | null>(null);
  const [devices, setDevices] = useState<IDC.Device[]>([]);
  const [templates, setTemplates] = useState<IDC.DeviceTemplate[]>([]);
  const [devicePorts, setDevicePorts] = useState<Record<string, IDC.Port[]>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [refreshedAt, setRefreshedAt] = useState<string>();

  const refresh = useCallback(async () => {
    if (!cabinetId) return;
    setLoading(true);
    setError(undefined);
    try {
      const [cabinetResponse, deviceResponse, templateResponse] =
        await Promise.all([
          getCabinet(cabinetId),
          getDevicesByCabinet(cabinetId),
          getAllDeviceTemplates(),
        ]);
      if (!cabinetResponse.success || !cabinetResponse.data) {
        throw new Error('cabinet unavailable');
      }
      const nextDevices = deviceResponse.success
        ? deviceResponse.data || []
        : [];
      const portEntries = await Promise.all(
        nextDevices.map(async (device) => {
          try {
            const response = await getPortsByDevice(device.id);
            return [
              device.id,
              response.success ? response.data || [] : [],
            ] as const;
          } catch {
            return [device.id, []] as const;
          }
        }),
      );
      setCabinet(cabinetResponse.data);
      setDevices(nextDevices);
      setTemplates(templateResponse.success ? templateResponse.data || [] : []);
      setDevicePorts(Object.fromEntries(portEntries));
      setRefreshedAt(new Date().toISOString());
    } catch {
      setError('机柜 3D 数据加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [cabinetId]);

  useEffect(() => {
    setCabinet(null);
    setDevices([]);
    setDevicePorts({});
    void refresh();
  }, [refresh]);

  return {
    cabinet,
    devices,
    templates,
    devicePorts,
    loading,
    error,
    refreshedAt,
    refresh,
  };
}

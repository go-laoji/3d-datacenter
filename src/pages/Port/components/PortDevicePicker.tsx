import { Select, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getDevice, getDevices } from '@/services/idc/device';

interface Props {
  value?: string;
  requestedDeviceId?: string | null;
  onChange: (device?: IDC.Device) => void;
}

const PortDevicePicker: React.FC<Props> = ({
  value,
  requestedDeviceId,
  onChange,
}) => {
  const [devices, setDevices] = useState<IDC.Device[]>([]);
  const [loading, setLoading] = useState(false);
  const version = useRef(0);

  const search = async (keyword = '') => {
    const requestVersion = ++version.current;
    setLoading(true);
    try {
      const result = await getDevices({
        current: 1,
        pageSize: 20,
        name: keyword || undefined,
        lifecycleStatus: 'mounted',
      });
      if (requestVersion === version.current && result.success)
        setDevices(
          (result.data ?? []).filter(
            (device) => !device.templateId.toLowerCase().includes('pdu'),
          ),
        );
    } finally {
      if (requestVersion === version.current) setLoading(false);
    }
  };

  useEffect(() => {
    void search();
    if (requestedDeviceId)
      void getDevice(requestedDeviceId).then((result) => {
        if (!result.success || !result.data) return onChange(undefined);
        setDevices((current) =>
          current.some((device) => device.id === result.data!.id)
            ? current
            : [result.data!, ...current],
        );
        onChange(result.data);
      });
  }, [requestedDeviceId]);

  return (
    <Select
      aria-label="选择端口所属设备"
      value={value}
      style={{ minWidth: 320 }}
      showSearch
      filterOption={false}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : '没有匹配的已上架设备'}
      placeholder="输入设备名称或 IP 搜索"
      onSearch={search}
      onChange={(id) => onChange(devices.find((device) => device.id === id))}
      options={devices.map((device) => ({
        value: device.id,
        label: (
          <span>
            {device.name}{' '}
            <Typography.Text type="secondary">
              · {device.managementIp ?? device.assetCode}
            </Typography.Text>
          </span>
        ),
      }))}
    />
  );
};

export default PortDevicePicker;

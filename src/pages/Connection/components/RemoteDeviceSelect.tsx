import { Select, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getDevices } from '@/services/idc/device';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const RemoteDeviceSelect: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [options, setOptions] = useState<
    Array<{ value: string; label: React.ReactNode }>
  >([]);
  const [loading, setLoading] = useState(false);
  const searchVersion = useRef(0);

  const search = async (keyword = '') => {
    const version = ++searchVersion.current;
    setLoading(true);
    try {
      const result = await getDevices({
        current: 1,
        pageSize: 20,
        name: keyword || undefined,
        lifecycleStatus: 'mounted',
      });
      if (version !== searchVersion.current || !result.success) return;
      setOptions(
        (result.data ?? []).map((device) => ({
          value: device.id,
          label: (
            <div>
              <div>{device.name}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {device.managementIp ?? device.assetCode} ·{' '}
                {device.cabinetId ?? '未上架'}
              </Typography.Text>
            </div>
          ),
        })),
      );
    } finally {
      if (version === searchVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    void search();
  }, []);

  return (
    <Select
      value={value}
      onChange={onChange}
      onSearch={search}
      onDropdownVisibleChange={(open) => {
        if (open && !options.length) void search();
      }}
      showSearch
      filterOption={false}
      notFoundContent={loading ? <Spin size="small" /> : '没有匹配设备'}
      options={options}
      placeholder={placeholder ?? '输入名称或 IP 搜索设备'}
    />
  );
};

export default RemoteDeviceSelect;

import { Alert, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getPortsByDevice } from '@/services/idc/port';
import {
  getPortAvailability,
  getPortDisplayName,
  isPortAvailable,
  portAvailabilityText,
} from '../portSelection';

interface Props {
  deviceId?: string;
  value?: string;
  onChange: (portId: string) => void;
  excludePortId?: string;
}

const PortSelector: React.FC<Props> = ({
  deviceId,
  value,
  onChange,
  excludePortId,
}) => {
  const [ports, setPorts] = useState<IDC.Port[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!deviceId) {
      setPorts([]);
      return;
    }
    setLoading(true);
    getPortsByDevice(deviceId)
      .then((result) => {
        if (active && result.success) setPorts(result.data ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [deviceId]);

  const available = useMemo(
    () => ports.filter((port) => isPortAvailable(port, excludePortId)).length,
    [ports, excludePortId],
  );
  if (!deviceId)
    return <Alert type="info" showIcon message="请先搜索并选择设备" />;
  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!ports.length)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="该设备没有可用端口数据"
      />
    );

  return (
    <div>
      <Typography.Text type="secondary">
        共 {ports.length} 个端口，可用 {available} 个；已占用端口不可重复连接
      </Typography.Text>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 8,
          maxHeight: 230,
          overflowY: 'auto',
          marginTop: 8,
        }}
      >
        {ports.map((port) => {
          const availability = getPortAvailability(port, excludePortId);
          const selected = value === port.id;
          const enabled = availability === 'available';
          return (
            <button
              key={port.id}
              type="button"
              disabled={!enabled}
              aria-pressed={selected}
              aria-label={`${getPortDisplayName(port)}，${portAvailabilityText[availability]}`}
              onClick={() => onChange(port.id)}
              style={{
                textAlign: 'left',
                padding: 10,
                borderRadius: 6,
                border: selected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                background: selected ? '#e6f4ff' : enabled ? '#fff' : '#fafafa',
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled || selected ? 1 : 0.62,
              }}
            >
              <Space size={4} wrap>
                <strong>{getPortDisplayName(port)}</strong>
                <Tag>{port.portType}</Tag>
                <Tag color="blue">{port.speed}</Tag>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  VLAN {port.vlanConfig?.pvid ?? '-'} · {port.status} ·{' '}
                  {portAvailabilityText[availability]}
                </Typography.Text>
              </div>
              {port.description ? (
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {port.description}
                  </Typography.Text>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PortSelector;

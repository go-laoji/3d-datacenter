import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Modal,
  Skeleton,
  Space,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import { getDeviceUnmountImpact } from '@/services/idc/device';

interface DeviceUnmountModalProps {
  device?: IDC.Device;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: (confirmDependencies: boolean) => Promise<void>;
}

const DeviceUnmountModal: React.FC<DeviceUnmountModalProps> = ({
  device,
  confirmLoading,
  onCancel,
  onConfirm,
}) => {
  const [impact, setImpact] = useState<IDC.DeviceUnmountImpact>();
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!device) {
      setImpact(undefined);
      setConfirmed(false);
      return;
    }

    setLoading(true);
    setLoadFailed(false);
    setConfirmed(false);
    setImpact(undefined);
    getDeviceUnmountImpact(device.id)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setImpact(response.data);
        } else {
          setLoadFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [device, retryVersion]);

  const hasDependencies = Boolean(
    impact &&
      (impact.connectionCount > 0 ||
        impact.powerConnectionCount > 0 ||
        impact.activeAlertCount > 0),
  );

  return (
    <Modal
      title="设备下架确认"
      open={Boolean(device)}
      okText="确认下架"
      okButtonProps={{
        danger: true,
        disabled:
          loading || loadFailed || !impact || (hasDependencies && !confirmed),
      }}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onOk={() => onConfirm(hasDependencies && confirmed)}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : loadFailed ? (
        <Alert
          type="error"
          showIcon
          message="无法检查下架影响"
          description="为避免错误释放机柜容量，本次下架已被阻止。"
          action={
            <Button
              size="small"
              onClick={() => setRetryVersion((value) => value + 1)}
            >
              重新检查
            </Button>
          }
        />
      ) : (
        device &&
        impact && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="设备">{device.name}</Descriptions.Item>
              <Descriptions.Item label="资产编码">
                {device.assetCode}
              </Descriptions.Item>
              <Descriptions.Item label="当前 U 位">
                U{device.startU} - U{device.endU}
              </Descriptions.Item>
            </Descriptions>

            <Space wrap>
              <Tag color={impact.connectionCount ? 'warning' : 'default'}>
                网络连接 {impact.connectionCount}
              </Tag>
              <Tag color={impact.powerConnectionCount ? 'warning' : 'default'}>
                电源连接 {impact.powerConnectionCount}
              </Tag>
              <Tag color={impact.activeAlertCount ? 'error' : 'default'}>
                活动告警 {impact.activeAlertCount}
              </Tag>
            </Space>

            <Alert
              type={hasDependencies ? 'warning' : 'info'}
              showIcon
              message={
                hasDependencies ? '该设备仍有关联对象' : '下架后将释放机柜容量'
              }
              description={
                hasDependencies
                  ? '演示数据会保留连接和告警记录。请确认已经了解这些关联关系，再继续下架。'
                  : '资产记录和历史信息会保留，设备将变为未上架和离线状态。'
              }
            />

            {hasDependencies && (
              <Checkbox
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              >
                我已确认关联连接和活动告警，并继续下架
              </Checkbox>
            )}
          </Space>
        )
      )}
    </Modal>
  );
};

export default DeviceUnmountModal;

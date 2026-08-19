import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Modal,
  Skeleton,
  Space,
  Steps,
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
  const [step, setStep] = useState(0);
  const [dependenciesConfirmed, setDependenciesConfirmed] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!device) {
      setImpact(undefined);
      return;
    }

    setStep(0);
    setLoading(true);
    setLoadFailed(false);
    setDependenciesConfirmed(false);
    setBackupConfirmed(false);
    setImpact(undefined);
    getDeviceUnmountImpact(device.id)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) setImpact(response.data);
        else setLoadFailed(true);
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
        impact.activeAlertCount > 0 ||
        impact.openWorkOrderCount > 0),
  );
  const canContinue = Boolean(impact) && !loading && !loadFailed;
  const confirmationsComplete = Boolean(
    impact &&
      (!hasDependencies || dependenciesConfirmed) &&
      (!impact.backupConfirmationRequired || backupConfirmed),
  );

  const footer = [
    <Button key="cancel" onClick={onCancel}>
      取消
    </Button>,
  ];
  if (step > 0) {
    footer.push(
      <Button key="previous" onClick={() => setStep((value) => value - 1)}>
        上一步
      </Button>,
    );
  }
  if (step < 2) {
    footer.push(
      <Button
        key="next"
        type="primary"
        disabled={step === 0 ? !canContinue : !confirmationsComplete}
        onClick={() => setStep((value) => value + 1)}
      >
        下一步
      </Button>,
    );
  } else {
    footer.push(
      <Button
        key="confirm"
        danger
        type="primary"
        loading={confirmLoading}
        onClick={() => onConfirm(hasDependencies)}
      >
        确认下架
      </Button>,
    );
  }

  return (
    <Modal
      title="设备下架向导"
      open={Boolean(device)}
      width={640}
      footer={footer}
      onCancel={onCancel}
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: '影响检查' },
          { title: '处置确认' },
          { title: '完成下架' },
        ]}
      />

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
          <>
            {step === 0 && (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="设备">
                    {device.name}
                  </Descriptions.Item>
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
                  <Tag
                    color={impact.powerConnectionCount ? 'warning' : 'default'}
                  >
                    电源连接 {impact.powerConnectionCount}
                  </Tag>
                  <Tag color={impact.activeAlertCount ? 'error' : 'default'}>
                    活动告警 {impact.activeAlertCount}
                  </Tag>
                  <Tag
                    color={impact.openWorkOrderCount ? 'warning' : 'default'}
                  >
                    关联工单 {impact.openWorkOrderCount}
                  </Tag>
                </Space>
                <Alert
                  type={hasDependencies ? 'warning' : 'info'}
                  showIcon
                  message={
                    hasDependencies ? '该设备仍有关联对象' : '影响检查已通过'
                  }
                  description="下架只释放机柜容量，资产、连接、告警、工单和变更记录都会保留。"
                />
              </Space>
            )}

            {step === 1 && (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="请确认处置前置条件"
                  description="该确认仅用于前端演示，不会自动关闭告警、断开连接或完成数据备份。"
                />
                {hasDependencies && (
                  <Checkbox
                    checked={dependenciesConfirmed}
                    onChange={(event) =>
                      setDependenciesConfirmed(event.target.checked)
                    }
                  >
                    已确认网络、电源、告警和工单的后续处置责任
                  </Checkbox>
                )}
                {impact.backupConfirmationRequired && (
                  <Checkbox
                    checked={backupConfirmed}
                    onChange={(event) =>
                      setBackupConfirmed(event.target.checked)
                    }
                  >
                    已确认配置和业务数据备份可用
                  </Checkbox>
                )}
              </Space>
            )}

            {step === 2 && (
              <Alert
                type="success"
                showIcon
                message="下架条件已确认"
                description="确认后设备进入已下架状态并释放 U 位，资产编码和所有历史关系继续保留。"
              />
            )}
          </>
        )
      )}
    </Modal>
  );
};

export default DeviceUnmountModal;

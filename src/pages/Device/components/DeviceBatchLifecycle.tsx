import { ModalForm, ProFormSelect } from '@ant-design/pro-components';
import { Alert, Button, message } from 'antd';
import { batchUpdateDeviceLifecycle } from '@/services/idc/device';
import { lifecycleConfig } from '../devicePresentation';

export function DeviceBatchLifecycle({
  selectedDeviceIds,
  onCompleted,
}: {
  selectedDeviceIds: React.Key[];
  onCompleted: () => void;
}) {
  return (
    <ModalForm<{ lifecycleStatus: IDC.DeviceLifecycleStatus }>
      title="批量变更设备生命周期"
      width={480}
      trigger={
        <Button disabled={selectedDeviceIds.length === 0}>
          批量变更（{selectedDeviceIds.length}）
        </Button>
      }
      onFinish={async (values) => {
        const response = await batchUpdateDeviceLifecycle(
          selectedDeviceIds.map(String),
          values.lifecycleStatus,
        );
        if (!response.success) return false;
        message.success(
          `已更新 ${response.data?.updatedCount ?? 0} 台设备的生命周期`,
        );
        onCompleted();
        return true;
      }}
    >
      <Alert
        type="warning"
        showIcon
        message="批量变更不会自动关闭告警或断开连接"
        description="涉及归档或下架的设备仍应逐台完成影响检查。"
        style={{ marginBottom: 16 }}
      />
      <ProFormSelect
        name="lifecycleStatus"
        label="目标生命周期"
        rules={[{ required: true, message: '请选择目标生命周期' }]}
        options={Object.entries(lifecycleConfig).map(([value, config]) => ({
          value,
          label: config.text,
        }))}
      />
    </ModalForm>
  );
}

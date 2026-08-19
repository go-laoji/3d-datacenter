import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { PortView } from '@/services/idc/port';

interface Props {
  open: boolean;
  port?: PortView;
  onClose: () => void;
  onSave: (values: IDC.PortUpdateParams) => Promise<void>;
}

const toNumbers = (values?: Array<string | number>) =>
  values?.map((value) => Number(value)).filter((value) => !Number.isNaN(value));

const PortConfigModal: React.FC<Props> = ({ open, port, onClose, onSave }) => {
  const [form] = Form.useForm();
  useEffect(() => {
    if (!open || !port) return;
    form.setFieldsValue({
      portAlias: port.portAlias,
      status: port.status,
      vlanMode: port.vlanConfig?.mode,
      pvid: port.vlanConfig?.pvid,
      allowedVlans: port.vlanConfig?.allowedVlans,
      description: port.description,
      portSecurity: port.portSecurity,
      maxMacCount: port.maxMacCount,
    });
  }, [open, port]);
  return (
    <Modal
      title={`配置端口 ${port?.portNumber ?? ''}`}
      open={open}
      onCancel={onClose}
      okText="保存配置"
      onOk={async () => {
        const values = await form.validateFields();
        if (values.status === 'disabled' && port?.linkStatus === 'connected') {
          Modal.confirm({
            title: '确认禁用已连接端口？',
            content: `将立即中断 ${port.connectedDeviceName ?? '当前对端'} 的物理连接，需要网络管理员权限。`,
            okButtonProps: { danger: true },
            okText: '以管理员身份禁用',
            onOk: () =>
              onSave({
                ...values,
                vlanConfig: values.vlanMode
                  ? {
                      mode: values.vlanMode,
                      pvid: values.pvid ?? 1,
                      allowedVlans: toNumbers(values.allowedVlans),
                    }
                  : undefined,
              }),
          });
          return;
        }
        await onSave({
          ...values,
          vlanConfig: values.vlanMode
            ? {
                mode: values.vlanMode,
                pvid: values.pvid ?? 1,
                allowedVlans: toNumbers(values.allowedVlans),
              }
            : undefined,
        });
      }}
    >
      {port?.linkStatus === 'connected' ? (
        <Alert
          type="warning"
          showIcon
          message="该端口有有效连接，禁用会造成业务中断"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form form={form} layout="vertical">
        <Form.Item name="portAlias" label="端口别名">
          <Input />
        </Form.Item>
        <Form.Item name="status" label="管理状态">
          <Select
            options={[
              { value: 'up', label: '启用' },
              { value: 'down', label: '关闭' },
              { value: 'disabled', label: '禁用（高风险）' },
            ]}
          />
        </Form.Item>
        <Form.Item name="vlanMode" label="VLAN 模式">
          <Select
            allowClear
            options={['access', 'trunk', 'hybrid'].map((value) => ({
              value,
              label: value.toUpperCase(),
            }))}
          />
        </Form.Item>
        <Form.Item name="pvid" label="PVID">
          <InputNumber min={1} max={4094} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="allowedVlans" label="允许 VLAN">
          <Select mode="tags" tokenSeparators={[',', ' ']} />
        </Form.Item>
        <Form.Item name="maxMacCount" label="最大 MAC 数">
          <InputNumber min={1} max={256} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PortConfigModal;

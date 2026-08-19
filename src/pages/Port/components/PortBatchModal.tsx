import {
  Alert,
  Button,
  Checkbox,
  Form,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import type { PortBatchResult, PortView } from '@/services/idc/port';

type BatchMode = 'vlan' | 'status';
interface Props {
  open: boolean;
  ports: PortView[];
  onClose: () => void;
  onApplyVlan: (config: IDC.VlanConfig) => Promise<PortBatchResult[]>;
  onApplyStatus: (status: IDC.Port['status']) => Promise<PortBatchResult[]>;
}

const PortBatchModal: React.FC<Props> = ({
  open,
  ports,
  onClose,
  onApplyVlan,
  onApplyStatus,
}) => {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<BatchMode>('vlan');
  const [results, setResults] = useState<PortBatchResult[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const connected = ports.filter(
    (port) => port.linkStatus === 'connected',
  ).length;
  const selectedStatus = Form.useWatch('status', form);
  useEffect(() => {
    if (!open) {
      setResults([]);
      setAccepted(false);
      form.resetFields();
    }
  }, [open]);

  const apply = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const next =
        mode === 'vlan'
          ? await onApplyVlan({
              mode: values.vlanMode,
              pvid: values.pvid ?? 1,
              allowedVlans: values.allowedVlans
                ?.map(Number)
                .filter((value: number) => !Number.isNaN(value)),
            })
          : await onApplyStatus(values.status);
      setResults(next);
    } finally {
      setSubmitting(false);
    }
  };

  const dangerous =
    mode === 'status' && selectedStatus === 'disabled' && connected > 0;
  return (
    <Modal
      title={`批量配置 ${ports.length} 个端口`}
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        results.length ? (
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        ) : (
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              danger={dangerous}
              disabled={dangerous && !accepted}
              loading={submitting}
              onClick={apply}
            >
              应用变更
            </Button>
          </Space>
        )
      }
    >
      {results.length ? (
        <>
          <Alert
            type="success"
            showIcon
            message={`已处理 ${results.length} 个端口`}
            style={{ marginBottom: 12 }}
          />
          <Table
            size="small"
            pagination={false}
            rowKey="portId"
            dataSource={results}
            columns={[
              {
                title: '端口',
                dataIndex: 'portId',
                render: (id) =>
                  ports.find((port) => port.id === id)?.portNumber ?? id,
              },
              {
                title: '结果',
                dataIndex: 'success',
                render: (success) => (
                  <Tag color={success ? 'success' : 'error'}>
                    {success ? '成功' : '失败'}
                  </Tag>
                ),
              },
              { title: '说明', dataIndex: 'message' },
            ]}
          />
        </>
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            message={`目标 ${ports.length} 个，其中已连接 ${connected} 个`}
            description={`变更前值：${Array.from(new Set(ports.map((port) => (mode === 'vlan' ? `${port.vlanConfig?.mode ?? '-'}/${port.vlanConfig?.pvid ?? '-'}` : port.status)))).join('、')}`}
            style={{ marginBottom: 12 }}
          />
          <Segmented
            block
            value={mode}
            onChange={(value) => {
              setMode(value as BatchMode);
              setAccepted(false);
            }}
            options={[
              { value: 'vlan', label: 'VLAN 配置' },
              { value: 'status', label: '启用 / 禁用' },
            ]}
            style={{ marginBottom: 16 }}
          />
          <Form
            form={form}
            layout="vertical"
            initialValues={{ vlanMode: 'access', pvid: 1, status: 'up' }}
          >
            {mode === 'vlan' ? (
              <>
                <Form.Item
                  name="vlanMode"
                  label="目标 VLAN 模式"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={['access', 'trunk', 'hybrid'].map((value) => ({
                      value,
                      label: value.toUpperCase(),
                    }))}
                  />
                </Form.Item>
                <Form.Item name="pvid" label="目标 PVID">
                  <InputNumber min={1} max={4094} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="allowedVlans" label="允许 VLAN">
                  <Select mode="tags" tokenSeparators={[',', ' ']} />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                name="status"
                label="目标管理状态"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'up', label: '启用' },
                    { value: 'down', label: '关闭' },
                    { value: 'disabled', label: '禁用（需要管理员权限）' },
                  ]}
                />
              </Form.Item>
            )}
          </Form>
          {dangerous ? (
            <Alert
              type="error"
              showIcon
              message={`将中断 ${connected} 条现有连接`}
              description={
                <Checkbox
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                >
                  <Typography.Text>
                    我已核对业务影响，并确认以管理员权限执行
                  </Typography.Text>
                </Checkbox>
              }
            />
          ) : null}
        </>
      )}
    </Modal>
  );
};

export default PortBatchModal;

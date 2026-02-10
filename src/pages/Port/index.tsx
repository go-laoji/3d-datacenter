import { PageContainer } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { RefreshCw, Settings, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDevices } from '@/services/idc/device';
import {
  batchUpdatePortVlan,
  getPortsByDevice,
  updatePort,
} from '@/services/idc/port';

const PortPage: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [ports, setPorts] = useState<IDC.Port[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [currentPort, setCurrentPort] = useState<IDC.Port>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  useEffect(() => {
    getDevices({ pageSize: 1000 }).then((res) => {
      if (res.success) {
        // 只显示交换机类型的设备
        setDevices(res.data || []);
      }
    });
  }, []);

  const loadPorts = async (deviceId: string) => {
    setLoading(true);
    try {
      const res = await getPortsByDevice(deviceId);
      if (res.success) {
        setPorts(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取当前设备信息
  const selectedDeviceInfo = devices.find((d) => d.id === selectedDevice);

  useEffect(() => {
    if (selectedDevice) {
      loadPorts(selectedDevice);
    }
  }, [selectedDevice]);

  const statusColors: Record<string, string> = {
    up: 'success',
    down: 'default',
    disabled: 'warning',
    error: 'error',
  };

  const columns = [
    {
      title: '端口',
      dataIndex: 'portNumber',
      width: 100,
      render: (text: string, record: IDC.Port) => (
        <Space>
          {record.linkStatus === 'connected' ? (
            <Wifi size={14} style={{ color: '#52c41a' }} />
          ) : (
            <WifiOff size={14} style={{ color: '#8c8c8c' }} />
          )}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '别名',
      dataIndex: 'portAlias',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '类型',
      dataIndex: 'portType',
      width: 100,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '速率',
      dataIndex: 'speed',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Badge
          status={statusColors[status] as any}
          text={
            status === 'up'
              ? '启用'
              : status === 'down'
                ? '关闭'
                : status === 'disabled'
                  ? '禁用'
                  : '错误'
          }
        />
      ),
    },
    {
      title: '连接',
      dataIndex: 'linkStatus',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'success' : 'default'}>
          {status === 'connected' ? '已连接' : '未连接'}
        </Tag>
      ),
    },
    {
      title: 'VLAN模式',
      dataIndex: ['vlanConfig', 'mode'],
      width: 90,
      render: (mode: string) =>
        mode ? (
          <Tag
            color={
              mode === 'access' ? 'blue' : mode === 'trunk' ? 'purple' : 'cyan'
            }
          >
            {mode.toUpperCase()}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'PVID',
      dataIndex: ['vlanConfig', 'pvid'],
      width: 70,
      render: (pvid: number) => pvid || '-',
    },
    {
      title: '允许VLAN',
      dataIndex: ['vlanConfig', 'allowedVlans'],
      width: 150,
      ellipsis: true,
      render: (vlans: number[]) =>
        vlans?.length ? (
          <Tooltip title={vlans.join(', ')}>
            {vlans.slice(0, 3).join(', ')}
            {vlans.length > 3 ? `...+${vlans.length - 3}` : ''}
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: IDC.Port) => (
        <Button
          type="link"
          size="small"
          icon={<Settings size={14} />}
          onClick={() => {
            setCurrentPort(record);
            form.setFieldsValue({
              portAlias: record.portAlias,
              status: record.status,
              vlanMode: record.vlanConfig?.mode,
              pvid: record.vlanConfig?.pvid,
              allowedVlans: record.vlanConfig?.allowedVlans || [],
              description: record.description,
            });
            setConfigModalOpen(true);
          }}
        >
          配置
        </Button>
      ),
    },
  ];

  const handleSaveConfig = async () => {
    if (!currentPort) return;

    const values = form.getFieldsValue();
    const allowedVlans = Array.isArray(values.allowedVlans)
      ? values.allowedVlans
          .map((v: string | number) =>
            typeof v === 'string' ? parseInt(v, 10) : v,
          )
          .filter((v: number) => !Number.isNaN(v))
      : undefined;

    const data: IDC.PortUpdateParams = {
      portAlias: values.portAlias,
      status: values.status,
      vlanConfig: values.vlanMode
        ? {
            mode: values.vlanMode,
            pvid: values.pvid || 1,
            allowedVlans,
          }
        : undefined,
      description: values.description,
    };

    const res = await updatePort(currentPort.id, data);
    if (res.success) {
      message.success('配置保存成功');
      setConfigModalOpen(false);
      if (selectedDevice) loadPorts(selectedDevice);
    }
  };

  const handleBatchVlan = async () => {
    const values = batchForm.getFieldsValue();
    const allowedVlans = Array.isArray(values.allowedVlans)
      ? values.allowedVlans
          .map((v: string | number) =>
            typeof v === 'string' ? parseInt(v, 10) : v,
          )
          .filter((v: number) => !Number.isNaN(v))
      : undefined;

    const vlanConfig: IDC.VlanConfig = {
      mode: values.vlanMode,
      pvid: values.pvid || 1,
      allowedVlans,
    };

    const res = await batchUpdatePortVlan(selectedRowKeys, vlanConfig);
    if (res.success) {
      message.success(`成功更新 ${selectedRowKeys.length} 个端口的VLAN配置`);
      setBatchModalOpen(false);
      setSelectedRowKeys([]);
      if (selectedDevice) loadPorts(selectedDevice);
    }
  };

  return (
    <PageContainer
      header={{
        title: '端口配置',
        subTitle: '管理交换机端口VLAN、QoS等配置',
      }}
    >
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <span>选择设备：</span>
          <Select
            placeholder="请选择设备"
            style={{ width: 300 }}
            showSearch
            optionFilterProp="label"
            value={selectedDevice}
            onChange={setSelectedDevice}
            options={devices.map((d) => ({ value: d.id, label: d.name }))}
          />
          {selectedDevice && (
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => loadPorts(selectedDevice)}
            >
              刷新
            </Button>
          )}
          {selectedRowKeys.length > 0 && (
            <Button type="primary" onClick={() => setBatchModalOpen(true)}>
              批量配置VLAN ({selectedRowKeys.length})
            </Button>
          )}
        </Space>

        {/* 设备摘要卡片 */}
        {selectedDeviceInfo && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="设备名称"
                value={selectedDeviceInfo.name}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="端口总数" value={ports.length} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="已连接"
                value={ports.filter((p) => p.linkStatus === 'connected').length}
                valueStyle={{ color: '#52c41a' }}
                suffix="个"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="启用"
                value={ports.filter((p) => p.status === 'up').length}
                valueStyle={{ color: '#1890ff' }}
                suffix="个"
              />
            </Col>
          </Row>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={ports}
          loading={loading}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个端口`,
          }}
        />
      </Card>

      {/* 端口配置模态框 */}
      <Modal
        title={`配置端口 ${currentPort?.portNumber}`}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
        okText="保存"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="portAlias" label="端口别名">
            <Input placeholder="请输入端口别名" />
          </Form.Item>
          <Form.Item name="status" label="端口状态">
            <Select
              options={[
                { value: 'up', label: '启用' },
                { value: 'down', label: '关闭' },
                { value: 'disabled', label: '禁用' },
              ]}
            />
          </Form.Item>
          <Form.Item name="vlanMode" label="VLAN模式">
            <Select
              allowClear
              options={[
                { value: 'access', label: 'Access' },
                { value: 'trunk', label: 'Trunk' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
          </Form.Item>
          <Form.Item name="pvid" label="PVID">
            <InputNumber min={1} max={4094} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="allowedVlans"
            label="允许VLAN"
            tooltip="输入VLAN ID后按回车添加"
          >
            <Select
              mode="tags"
              placeholder="输入VLAN ID按回车添加，如 1, 100, 200"
              tokenSeparators={[',', ' ']}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量VLAN配置模态框 */}
      <Modal
        title={`批量配置VLAN (${selectedRowKeys.length}个端口)`}
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={handleBatchVlan}
        okText="应用"
        width={400}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="vlanMode"
            label="VLAN模式"
            rules={[{ required: true, message: '请选择VLAN模式' }]}
          >
            <Select
              options={[
                { value: 'access', label: 'Access' },
                { value: 'trunk', label: 'Trunk' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
          </Form.Item>
          <Form.Item name="pvid" label="PVID" initialValue={1}>
            <InputNumber min={1} max={4094} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="allowedVlans" label="允许VLAN">
            <Select
              mode="tags"
              placeholder="输入VLAN ID按回车添加"
              tokenSeparators={[',', ' ']}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PortPage;

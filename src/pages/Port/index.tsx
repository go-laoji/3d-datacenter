import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { RefreshCw, Settings, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  batchUpdatePortStatus,
  batchUpdatePortVlan,
  getPortsByDevice,
  type PortBatchResult,
  type PortView,
  updatePort,
} from '@/services/idc/port';
import PortBatchModal from './components/PortBatchModal';
import PortConfigModal from './components/PortConfigModal';
import PortDetailDrawer from './components/PortDetailDrawer';
import PortDevicePicker from './components/PortDevicePicker';
import { filterPorts } from './portFiltering';

const statusLabels = {
  up: ['success', '启用'],
  down: ['default', '关闭'],
  disabled: ['warning', '禁用'],
  error: ['error', '错误'],
} as const;

const PortPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDeviceId =
    searchParams.get('deviceId') || searchParams.get('device');
  const requestedPortId = searchParams.get('portId');
  const [device, setDevice] = useState<IDC.Device>();
  const [ports, setPorts] = useState<PortView[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<PortView>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? undefined);
  const [linkStatus, setLinkStatus] = useState(
    searchParams.get('linkStatus') ?? undefined,
  );
  const [speed, setSpeed] = useState(searchParams.get('speed') ?? undefined);
  const [vlan, setVlan] = useState(searchParams.get('vlan') ?? '');

  const syncUrl = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    next.delete('device');
    setSearchParams(next, { replace: true });
  };

  const loadPorts = async (deviceId: string) => {
    setLoading(true);
    try {
      const result = await getPortsByDevice(deviceId);
      if (!result.success) return;
      const nextPorts = result.data ?? [];
      setPorts(nextPorts);
      const requested = nextPorts.find((port) => port.id === requestedPortId);
      if (requestedPortId && requested) {
        setCurrent(requested);
        setDetailOpen(true);
      } else if (requestedPortId)
        message.warning('链接中的端口不存在或不属于当前设备');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (device) {
      setSelectedIds([]);
      void loadPorts(device.id);
    } else setPorts([]);
  }, [device?.id]);

  const filteredPorts = useMemo(
    () => filterPorts(ports, { keyword, status, linkStatus, speed, vlan }),
    [ports, keyword, status, linkStatus, speed, vlan],
  );
  const selectedPorts = ports.filter((port) => selectedIds.includes(port.id));

  const openDetail = (port: PortView) => {
    setCurrent(port);
    setDetailOpen(true);
    syncUrl({ deviceId: device?.id, portId: port.id });
  };
  const openConfig = (port: PortView) => {
    setCurrent(port);
    setConfigOpen(true);
  };

  const columns = [
    {
      title: '端口',
      dataIndex: 'portNumber',
      width: 130,
      render: (_: string, port: PortView) => (
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => openDetail(port)}
        >
          <Space>
            {port.linkStatus === 'connected' ? (
              <Wifi size={14} color="#52c41a" />
            ) : (
              <WifiOff size={14} />
            )}
            {port.portNumber}
          </Space>
        </Button>
      ),
    },
    {
      title: '类型 / 速率',
      width: 120,
      render: (_: unknown, port: PortView) => (
        <Space size={4}>
          <Tag>{port.portType}</Tag>
          <Tag color="blue">{port.speed}</Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: PortView['status']) => (
        <Badge status={statusLabels[value][0]} text={statusLabels[value][1]} />
      ),
    },
    {
      title: '连接对端',
      width: 210,
      render: (_: unknown, port: PortView) =>
        port.linkStatus === 'connected' ? (
          <Space direction="vertical" size={0}>
            <strong>{port.connectedDeviceName ?? '关系待核对'}</strong>
            <Typography.Text type="secondary">
              {port.connectedPortName ?? port.connectionPurpose ?? '采集占用'}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">未连接</Typography.Text>
        ),
    },
    {
      title: 'VLAN',
      width: 150,
      render: (_: unknown, port: PortView) =>
        port.vlanConfig ? (
          <Space>
            <Tag color="purple">{port.vlanConfig.mode.toUpperCase()}</Tag>PVID{' '}
            {port.vlanConfig.pvid}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: 'MAC / 安全',
      width: 170,
      render: (_: unknown, port: PortView) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{port.learnedMacs[0] ?? '-'}</Typography.Text>
          <Typography.Text type="secondary">
            {port.portSecurity ? '端口安全已启用' : '未启用端口安全'}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '最近变化', dataIndex: 'lastChangedAt', width: 150 },
    {
      title: '操作',
      width: 90,
      fixed: 'right' as const,
      render: (_: unknown, port: PortView) => (
        <Button
          type="link"
          size="small"
          icon={<Settings size={14} />}
          onClick={() => openConfig(port)}
        >
          配置
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '端口管理',
        subTitle: '围绕设备、连接、VLAN、安全与最近变化完成端口运维',
      }}
    >
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <PortDevicePicker
            value={device?.id}
            requestedDeviceId={requestedDeviceId}
            onChange={(next) => {
              setDevice(next);
              syncUrl({
                deviceId: next?.id,
                portId:
                  next?.id === requestedDeviceId
                    ? (requestedPortId ?? undefined)
                    : undefined,
              });
              if (requestedDeviceId && !next)
                message.warning('链接中的设备不存在或不可访问');
            }}
          />
          {device ? (
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => loadPorts(device.id)}
            >
              刷新
            </Button>
          ) : null}
          {selectedIds.length ? (
            <Button type="primary" onClick={() => setBatchOpen(true)}>
              批量变更 ({selectedIds.length})
            </Button>
          ) : null}
        </Space>
        {device ? (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={6}>
              <Statistic title="端口总数" value={ports.length} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="已连接"
                value={
                  ports.filter((port) => port.linkStatus === 'connected').length
                }
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="可用"
                value={
                  ports.filter(
                    (port) =>
                      port.status === 'up' &&
                      port.linkStatus === 'disconnected',
                  ).length
                }
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="异常 / 禁用"
                value={
                  ports.filter((port) =>
                    ['error', 'disabled'].includes(port.status),
                  ).length
                }
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        ) : null}
        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search
            aria-label="搜索端口"
            placeholder="端口、别名、对端或用途"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => syncUrl({ keyword: value })}
            style={{ width: 250 }}
          />
          <Select
            aria-label="端口状态筛选"
            allowClear
            placeholder="管理状态"
            value={status}
            onChange={(value) => {
              setStatus(value);
              syncUrl({ status: value });
            }}
            options={['up', 'down', 'disabled', 'error'].map((value) => ({
              value,
              label: statusLabels[value as keyof typeof statusLabels][1],
            }))}
          />
          <Select
            aria-label="连接状态筛选"
            allowClear
            placeholder="连接状态"
            value={linkStatus}
            onChange={(value) => {
              setLinkStatus(value);
              syncUrl({ linkStatus: value });
            }}
            options={[
              { value: 'connected', label: '已连接' },
              { value: 'disconnected', label: '未连接' },
            ]}
          />
          <Select
            aria-label="速率筛选"
            allowClear
            placeholder="速率"
            value={speed}
            onChange={(value) => {
              setSpeed(value);
              syncUrl({ speed: value });
            }}
            options={['1G', '10G', '25G', '40G', '100G'].map((value) => ({
              value,
              label: value,
            }))}
          />
          <Input
            aria-label="VLAN 筛选"
            placeholder="VLAN ID"
            value={vlan}
            onChange={(event) => {
              setVlan(event.target.value);
              syncUrl({ vlan: event.target.value });
            }}
            style={{ width: 110 }}
          />
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredPorts}
          loading={loading}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个端口`,
          }}
        />
      </Card>
      <PortDetailDrawer
        open={detailOpen}
        port={current}
        device={device}
        onClose={() => {
          setDetailOpen(false);
          syncUrl({ portId: undefined });
        }}
        onConfigure={() => {
          setDetailOpen(false);
          setConfigOpen(true);
        }}
      />
      <PortConfigModal
        open={configOpen}
        port={current}
        onClose={() => setConfigOpen(false)}
        onSave={async (values) => {
          if (!current || !device) return;
          const result = await updatePort(current.id, values);
          if (result.success) {
            message.success('端口配置已保存');
            setConfigOpen(false);
            await loadPorts(device.id);
          }
        }}
      />
      <PortBatchModal
        open={batchOpen}
        ports={selectedPorts}
        onClose={() => {
          setBatchOpen(false);
          setSelectedIds([]);
          if (device) void loadPorts(device.id);
        }}
        onApplyVlan={async (config) => {
          const result = await batchUpdatePortVlan(selectedIds, config);
          return selectedIds.map((portId) => ({
            portId,
            success: result.success,
            message: result.success ? 'VLAN 配置更新成功' : '更新失败',
          }));
        }}
        onApplyStatus={async (nextStatus) => {
          const result = await batchUpdatePortStatus(selectedIds, nextStatus);
          return (
            result.data?.results ??
            selectedIds.map(
              (portId) =>
                ({
                  portId,
                  success: false,
                  message: '未返回执行结果',
                }) as PortBatchResult,
            )
          );
        }}
      />
    </PageContainer>
  );
};

export default PortPage;

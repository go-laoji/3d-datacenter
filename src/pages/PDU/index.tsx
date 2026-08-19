import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Button,
  Dropdown,
  Modal,
  message,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';
import { Ellipsis, Eye, Plus, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCabinets } from '@/services/idc/cabinet';
import {
  createPDUDevice,
  deletePDUDevice,
  getPDUDevices,
  getPDUTemplates,
  type PDUDevice,
  type PDUTemplate,
  updatePDUDevice,
} from '@/services/idc/pdu';
import PDUDetailDrawer from './components/PDUDetailDrawer';
import PDUFormModal, { type PDUFormValues } from './components/PDUFormModal';
import PDUMetricStrip from './components/PDUMetricStrip';
import { getLoadPercent, getLoadTone, summarizePDUs } from './pduPresentation';

const statusConfig = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  warning: { color: 'warning', text: '告警' },
  error: { color: 'error', text: '故障' },
} as const;

const PDUPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<PDUDevice>();
  const [templates, setTemplates] = useState<PDUTemplate[]>([]);
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [allDevices, setAllDevices] = useState<PDUDevice[]>([]);

  const loadReferenceData = async () => {
    const [templateResult, cabinetResult, deviceResult] = await Promise.all([
      getPDUTemplates(),
      getCabinets({ pageSize: 1000 }),
      getPDUDevices(),
    ]);
    if (templateResult.success) setTemplates(templateResult.data ?? []);
    if (cabinetResult.success) setCabinets(cabinetResult.data ?? []);
    if (deviceResult.success) {
      const devices = deviceResult.data ?? [];
      setAllDevices(devices);
      const requestedId = new URLSearchParams(history.location.search).get(
        'pduId',
      );
      const requested = devices.find((device) => device.id === requestedId);
      if (requestedId && requested) {
        setCurrent(requested);
        setDetailOpen(true);
      } else if (requestedId) {
        message.warning('链接中的 PDU 不存在，已显示全部设备');
      }
    }
  };

  useEffect(() => {
    void loadReferenceData();
  }, []);

  const stats = useMemo(() => summarizePDUs(allDevices), [allDevices]);
  const cabinetMap = useMemo(
    () => new Map(cabinets.map((cabinet) => [cabinet.id, cabinet])),
    [cabinets],
  );

  const openDetails = (record: PDUDevice) => {
    setCurrent(record);
    setDetailOpen(true);
    history.replace(`${history.location.pathname}?pduId=${record.id}`);
  };

  const reload = async () => {
    await Promise.all([actionRef.current?.reload(), loadReferenceData()]);
  };

  const remove = (record: PDUDevice) => {
    const connections = record.outlets.filter((outlet) => outlet.deviceId);
    Modal.confirm({
      title: `删除 ${record.name}？`,
      okText: '确认删除',
      okButtonProps: { danger: true, disabled: connections.length > 0 },
      content: connections.length
        ? `当前仍连接 ${connections.length} 台设备，请先迁移插座连接后再删除。`
        : '该操作会移除 PDU 及其历史演示数据，无法撤销。',
      onOk: async () => {
        const result = await deletePDUDevice(record.id);
        if (result.success) {
          message.success('PDU 已删除');
          await reload();
        }
      },
    });
  };

  const columns: ProColumns<PDUDevice>[] = [
    {
      title: 'PDU',
      dataIndex: 'keyword',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => openDetails(record)}
          style={{ paddingInline: 0 }}
        >
          <Space>
            <Zap size={15} />
            {record.name}
          </Space>
        </Button>
      ),
    },
    {
      title: '电源路径',
      dataIndex: ['pduData', 'powerPath'],
      width: 110,
      valueType: 'select',
      valueEnum: { A: { text: 'A 路' }, B: { text: 'B 路' } },
      render: (_, record) => (
        <Tag color={record.pduData.powerPath === 'A' ? 'blue' : 'green'}>
          {record.pduData.powerPath} 路 · {record.pduData.phase}
        </Tag>
      ),
    },
    {
      title: '所在机柜',
      dataIndex: 'cabinetId',
      width: 160,
      valueType: 'select',
      fieldProps: {
        options: cabinets.map((cabinet) => ({
          value: cabinet.id,
          label: cabinet.name,
        })),
        showSearch: true,
      },
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() =>
            history.push(`/idc/cabinet?cabinetId=${record.cabinetId}`)
          }
        >
          {cabinetMap.get(record.cabinetId)?.name ?? record.cabinetId}
        </Button>
      ),
    },
    {
      title: '负载',
      dataIndex: 'risk',
      width: 210,
      valueType: 'select',
      valueEnum: {
        highLoad: { text: '只看高负载' },
        singlePath: { text: '只看单路接入' },
        stale: { text: '只看数据延迟' },
      },
      render: (_, record) => {
        const percent = getLoadPercent(record);
        const tone = getLoadTone(percent);
        return (
          <Progress
            percent={percent}
            strokeColor={tone.color}
            size="small"
            format={() =>
              `${record.pduData.currentLoad}/${record.pduData.maxLoad}W`
            }
          />
        );
      },
    },
    {
      title: '插座',
      search: false,
      width: 100,
      render: (_, record) =>
        `${record.outlets.filter((outlet) => outlet.deviceId).length} / ${record.pduData.outputPorts}`,
    },
    {
      title: '采集质量',
      search: false,
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.metric.quality === 'good' ? 'success' : 'warning'}>
            {record.metric.quality === 'good' ? '正常' : '延迟'}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.metric.collectedAt}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(statusConfig).map(([key, value]) => [
          key,
          { text: value.text },
        ]),
      ),
      render: (_, record) => (
        <Tag color={statusConfig[record.status].color}>
          {statusConfig[record.status].text}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => openDetails(record)}
        >
          详情
        </Button>,
        <Dropdown
          key="more"
          menu={{
            items: [
              { key: 'edit', label: '编辑额定参数' },
              { key: 'power', label: '电力拓扑定位' },
              { key: 'delete', label: '删除', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') {
                setCurrent(record);
                setFormMode('edit');
                setFormOpen(true);
              }
              if (key === 'power') history.push(`/power?pduId=${record.id}`);
              if (key === 'delete') remove(record);
            },
          }}
        >
          <Button
            type="text"
            size="small"
            aria-label={`${record.name} 更多操作`}
            icon={<Ellipsis size={16} />}
          />
        </Dropdown>,
      ],
    },
  ];

  const submitForm = async (values: PDUFormValues) => {
    const data: Partial<PDUDevice> = {
      name: values.name,
      cabinetId: values.cabinetId,
      startU: values.startU,
      endU: values.startU + 1,
      uHeight: 2,
      assetCode: values.assetCode ?? `PDU-${Date.now()}`,
      managementIp: values.managementIp,
      status: values.status ?? 'online',
      category: 'pdu',
      pduData: {
        powerPath: values.powerPath,
        inputVoltage: 220,
        inputCurrent: current?.pduData.inputCurrent ?? 0,
        phase: values.phase,
        outputPorts: values.outputPorts,
        maxLoad: values.maxLoad,
        currentLoad: values.currentLoad ?? 0,
        peakLoad: current?.pduData.peakLoad ?? 0,
        loadThreshold: values.loadThreshold,
        brand: values.brand ?? current?.pduData.brand,
        model: values.model ?? current?.pduData.model,
      },
    };
    const result =
      formMode === 'edit' && current
        ? await updatePDUDevice(current.id, data)
        : await createPDUDevice(data);
    if (!result.success) return false;
    message.success(
      formMode === 'edit' ? 'PDU 已更新' : 'PDU 已创建，插座已按模板生成',
    );
    await reload();
    return true;
  };

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'pages.power.pdu',
          defaultMessage: 'PDU 设备管理',
        }),
        subTitle: '查看 A/B 路容量、插座关系、采集质量与负载趋势',
      }}
    >
      <PDUMetricStrip stats={stats} />
      <ProTable<PDUDevice>
        headerTitle="PDU 与配电风险"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1180 }}
        request={async (params) => {
          const result = await getPDUDevices({
            cabinetId: params.cabinetId,
            powerPath: params['pduData,powerPath'],
            status: params.status,
            risk: params.risk,
            keyword: params.keyword,
          });
          return {
            data: result.data ?? [],
            success: result.success,
            total: result.total ?? 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setCurrent(undefined);
              setFormMode('create');
              setFormOpen(true);
            }}
          >
            添加 PDU
          </Button>,
        ]}
      />
      <PDUFormModal
        open={formOpen}
        mode={formMode}
        current={current}
        templates={templates}
        cabinets={cabinets}
        onOpenChange={setFormOpen}
        onFinish={submitForm}
      />
      <PDUDetailDrawer
        open={detailOpen}
        device={current}
        cabinet={current ? cabinetMap.get(current.cabinetId) : undefined}
        onClose={() => {
          setDetailOpen(false);
          history.replace(history.location.pathname);
        }}
      />
    </PageContainer>
  );
};

export default PDUPage;

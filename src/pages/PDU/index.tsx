import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
} from 'antd';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getCabinets } from '@/services/idc/cabinet';
import {
  createPDUDevice,
  deletePDUDevice,
  getPDUDevices,
  getPDUTemplates,
  type PDUDevice,
  updatePDUDevice,
} from '@/services/idc/pdu';

const statusConfig: Record<
  string,
  { color: string; text: string; icon: React.ReactNode }
> = {
  online: { color: 'success', text: '在线', icon: <CheckCircle size={14} /> },
  offline: { color: 'default', text: '离线', icon: <Activity size={14} /> },
  warning: {
    color: 'warning',
    text: '告警',
    icon: <AlertTriangle size={14} />,
  },
  error: { color: 'error', text: '故障', icon: <AlertTriangle size={14} /> },
};

// 负载状态颜色
const getLoadColor = (percent: number) => {
  if (percent < 60) return '#52c41a';
  if (percent < 80) return '#faad14';
  return '#f5222d';
};

// 负载状态文本
const getLoadStatus = (percent: number) => {
  if (percent < 60) return { text: '正常', color: 'success' };
  if (percent < 80) return { text: '中等', color: 'warning' };
  return { text: '高负载', color: 'error' };
};

const PDUPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<PDUDevice>();
  const [_templates, setTemplates] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [pduStats, setPduStats] = useState({
    total: 0,
    pathA: 0,
    pathB: 0,
    avgLoad: 0,
    highLoad: 0,
  });

  useEffect(() => {
    getPDUTemplates().then((res) => {
      if (res.success) setTemplates(res.data || []);
    });
    getCabinets({ pageSize: 1000 }).then((res) => {
      if (res.success) setCabinets(res.data || []);
    });
  }, []);

  // 计算统计数据
  const updateStats = (devices: PDUDevice[]) => {
    const pathA = devices.filter((d) => d.pduData?.powerPath === 'A').length;
    const pathB = devices.filter((d) => d.pduData?.powerPath === 'B').length;
    const loads = devices.map((d) => {
      const max = d.pduData?.maxLoad || 1;
      const current = d.pduData?.currentLoad || 0;
      return (current / max) * 100;
    });
    const avgLoad =
      loads.length > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length : 0;
    const highLoad = loads.filter((l) => l >= 80).length;

    setPduStats({
      total: devices.length,
      pathA,
      pathB,
      avgLoad: Math.round(avgLoad),
      highLoad,
    });
  };

  const columns: ProColumns<PDUDevice>[] = [
    {
      title: 'PDU名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space>
          <Zap
            size={16}
            style={{
              color: record.pduData?.powerPath === 'A' ? '#1890ff' : '#52c41a',
            }}
          />
          <span style={{ fontWeight: 500 }}>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '电源路径',
      dataIndex: ['pduData', 'powerPath'],
      width: 100,
      valueType: 'select',
      valueEnum: {
        A: { text: 'A路电源', status: 'Processing' },
        B: { text: 'B路电源', status: 'Success' },
      },
      render: (_, record) => (
        <Tag color={record.pduData?.powerPath === 'A' ? 'blue' : 'green'}>
          {record.pduData?.powerPath === 'A' ? 'A路' : 'B路'}
        </Tag>
      ),
    },
    {
      title: '所在机柜',
      dataIndex: 'cabinetId',
      width: 150,
      valueType: 'select',
      fieldProps: {
        options: cabinets.map((c) => ({ value: c.id, label: c.name })),
        showSearch: true,
      },
      render: (_, record) => {
        const cab = cabinets.find((c) => c.id === record.cabinetId);
        return cab?.name || record.cabinetId;
      },
    },
    {
      title: 'U位',
      dataIndex: 'startU',
      width: 80,
      search: false,
      render: (_, record) =>
        record.startU === record.endU
          ? `U${record.startU}`
          : `U${record.startU}-${record.endU}`,
    },
    {
      title: '输出端口',
      dataIndex: ['pduData', 'outputPorts'],
      width: 90,
      search: false,
      render: (_, record) => `${record.pduData?.outputPorts || 0}口`,
    },
    {
      title: '负载情况',
      dataIndex: 'load',
      width: 200,
      search: false,
      render: (_, record) => {
        const max = record.pduData?.maxLoad || 1;
        const current = record.pduData?.currentLoad || 0;
        const percent = Math.round((current / max) * 100);
        const status = getLoadStatus(percent);
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={getLoadColor(percent)}
              format={() => `${current}W / ${max}W`}
            />
            <Tag color={status.color} style={{ fontSize: 10 }}>
              {status.text}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        online: { text: '在线', status: 'Success' },
        offline: { text: '离线', status: 'Default' },
        warning: { text: '告警', status: 'Warning' },
        error: { text: '故障', status: 'Error' },
      },
      render: (_, record) => (
        <Tag
          icon={statusConfig[record.status]?.icon}
          color={statusConfig[record.status]?.color}
        >
          {statusConfig[record.status]?.text}
        </Tag>
      ),
    },
    {
      title: '管理IP',
      dataIndex: 'managementIp',
      width: 130,
      copyable: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => {
            setCurrentRow(record);
            setDetailDrawerOpen(true);
          }}
        >
          详情
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<Edit3 size={14} />}
          onClick={() => {
            setCurrentRow(record);
            setEditModalOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个PDU吗？"
          onConfirm={async () => {
            const res = await deletePDUDevice(record.id);
            if (res.success) {
              message.success('PDU已删除');
              actionRef.current?.reload();
            }
          }}
        >
          <Button type="link" size="small" danger icon={<Trash2 size={14} />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'pages.power.pdu',
          defaultMessage: 'PDU设备管理',
        }),
        subTitle: '管理配电单元(PDU)设备',
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="PDU总数"
              value={pduStats.total}
              prefix={<Zap size={16} style={{ color: '#1890ff' }} />}
              suffix="台"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="A路电源"
              value={pduStats.pathA}
              valueStyle={{ color: '#1890ff' }}
              prefix={<Tag color="blue">A</Tag>}
              suffix="台"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="B路电源"
              value={pduStats.pathB}
              valueStyle={{ color: '#52c41a' }}
              prefix={<Tag color="green">B</Tag>}
              suffix="台"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="高负载PDU"
              value={pduStats.highLoad}
              valueStyle={{
                color: pduStats.highLoad > 0 ? '#f5222d' : '#52c41a',
              }}
              prefix={<AlertTriangle size={16} />}
              suffix="台"
            />
          </Card>
        </Col>
      </Row>

      <ProTable<PDUDevice>
        headerTitle="PDU设备列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1400 }}
        request={async (params) => {
          const res = await getPDUDevices({
            cabinetId: params.cabinetId,
            powerPath: params['pduData,powerPath'],
          });
          if (res.success && res.data) {
            updateStats(res.data);
          }
          return {
            data: res.data || [],
            success: res.success,
            total: res.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            添加PDU
          </Button>,
        ]}
      />

      {/* 创建PDU模态框 */}
      <ModalForm
        title="添加PDU设备"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width={600}
        onFinish={async (values) => {
          const res = await createPDUDevice({
            ...values,
            category: 'pdu',
            pduData: {
              powerPath: values.powerPath,
              inputVoltage: values.inputVoltage || 220,
              outputPorts: values.outputPorts || 8,
              maxLoad: values.maxLoad || 3000,
              currentLoad: 0,
            },
          });
          if (res.success) {
            message.success('PDU添加成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <ProFormText
          name="name"
          label="PDU名称"
          placeholder="如：PDU-A-01"
          rules={[{ required: true, message: '请输入PDU名称' }]}
        />
        <ProFormSelect
          name="powerPath"
          label="电源路径"
          options={[
            { value: 'A', label: 'A路电源 (主路)' },
            { value: 'B', label: 'B路电源 (备路)' },
          ]}
          rules={[{ required: true, message: '请选择电源路径' }]}
        />
        <ProFormSelect
          name="cabinetId"
          label="所在机柜"
          options={cabinets.map((c) => ({ value: c.id, label: c.name }))}
          showSearch
          rules={[{ required: true, message: '请选择机柜' }]}
        />
        <ProFormDigit
          name="startU"
          label="起始U位"
          min={1}
          max={42}
          rules={[{ required: true }]}
        />
        <ProFormDigit
          name="outputPorts"
          label="输出端口数"
          min={4}
          max={48}
          initialValue={16}
        />
        <ProFormDigit
          name="maxLoad"
          label="最大负载(W)"
          min={1000}
          max={10000}
          initialValue={3000}
        />
        <ProFormText
          name="managementIp"
          label="管理IP"
          placeholder="如：192.168.1.100"
        />
        <ProFormText
          name="assetCode"
          label="资产编码"
          placeholder="如：PDU-2024-001"
        />
      </ModalForm>

      {/* 编辑PDU模态框 */}
      <ModalForm
        title="编辑PDU设备"
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        width={600}
        initialValues={{
          ...currentRow,
          powerPath: currentRow?.pduData?.powerPath,
          outputPorts: currentRow?.pduData?.outputPorts,
          maxLoad: currentRow?.pduData?.maxLoad,
          currentLoad: currentRow?.pduData?.currentLoad,
        }}
        onFinish={async (values) => {
          if (!currentRow) return false;
          const res = await updatePDUDevice(currentRow.id, {
            ...values,
            pduData: {
              ...currentRow.pduData,
              powerPath: values.powerPath,
              outputPorts: values.outputPorts,
              maxLoad: values.maxLoad,
              currentLoad: values.currentLoad,
            },
          });
          if (res.success) {
            message.success('PDU更新成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <ProFormText name="name" label="PDU名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="powerPath"
          label="电源路径"
          options={[
            { value: 'A', label: 'A路电源 (主路)' },
            { value: 'B', label: 'B路电源 (备路)' },
          ]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { value: 'online', label: '在线' },
            { value: 'offline', label: '离线' },
            { value: 'warning', label: '告警' },
            { value: 'error', label: '故障' },
          ]}
        />
        <ProFormDigit name="currentLoad" label="当前负载(W)" min={0} />
        <ProFormDigit
          name="maxLoad"
          label="最大负载(W)"
          min={1000}
          max={10000}
        />
        <ProFormText name="managementIp" label="管理IP" />
      </ModalForm>

      {/* 详情抽屉 */}
      <Drawer
        title="PDU设备详情"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={500}
      >
        {currentRow && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="PDU名称">
              <Space>
                <Badge
                  status={
                    currentRow.status === 'online' ? 'success' : 'default'
                  }
                />
                {currentRow.name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="电源路径">
              <Tag
                color={currentRow.pduData?.powerPath === 'A' ? 'blue' : 'green'}
              >
                {currentRow.pduData?.powerPath === 'A'
                  ? 'A路电源 (主路)'
                  : 'B路电源 (备路)'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所在机柜">
              {cabinets.find((c) => c.id === currentRow.cabinetId)?.name ||
                currentRow.cabinetId}
            </Descriptions.Item>
            <Descriptions.Item label="U位">
              U{currentRow.startU} - U{currentRow.endU}
            </Descriptions.Item>
            <Descriptions.Item label="输出端口数">
              {currentRow.pduData?.outputPorts} 口
            </Descriptions.Item>
            <Descriptions.Item label="输入电压">
              {currentRow.pduData?.inputVoltage}V
            </Descriptions.Item>
            <Descriptions.Item label="负载情况">
              <Progress
                percent={Math.round(
                  ((currentRow.pduData?.currentLoad || 0) /
                    (currentRow.pduData?.maxLoad || 1)) *
                    100,
                )}
                strokeColor={getLoadColor(
                  Math.round(
                    ((currentRow.pduData?.currentLoad || 0) /
                      (currentRow.pduData?.maxLoad || 1)) *
                      100,
                  ),
                )}
                format={() =>
                  `${currentRow.pduData?.currentLoad}W / ${currentRow.pduData?.maxLoad}W`
                }
              />
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig[currentRow.status]?.color}>
                {statusConfig[currentRow.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="管理IP">
              {currentRow.managementIp || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="资产编码">
              {currentRow.assetCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="品牌型号">
              {currentRow.pduData?.brand} {currentRow.pduData?.model}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {currentRow.createdAt || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {currentRow.updatedAt || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default PDUPage;

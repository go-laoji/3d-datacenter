import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Dropdown, Modal, message, Space, Tag, Typography } from 'antd';
import { ArrowRight, Cable, Ellipsis, Eye, FileUp, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  type ConnectionView,
  createConnection,
  deleteConnection,
  getCableTypes,
  getConnection,
  getConnections,
  getConnectionTypes,
  updateConnection,
} from '@/services/idc/connection';
import ConnectionDetailDrawer from './components/ConnectionDetailDrawer';
import ConnectionEditModal from './components/ConnectionEditModal';
import ConnectionFormModal from './components/ConnectionFormModal';
import ConnectionImportModal from './components/ConnectionImportModal';

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

const statusMap = {
  active: { color: 'success', text: '正常' },
  inactive: { color: 'default', text: '未激活' },
  faulty: { color: 'error', text: '故障' },
} as const;

const ConnectionPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<ConnectionView>();
  const [connectionTypes, setConnectionTypes] = useState<SelectOption[]>([]);
  const [cableTypes, setCableTypes] = useState<SelectOption[]>([]);

  useEffect(() => {
    void Promise.all([getConnectionTypes(), getCableTypes()]).then(
      ([types, cables]) => {
        if (types.success) setConnectionTypes(types.data ?? []);
        if (cables.success) setCableTypes(cables.data ?? []);
      },
    );
    const connectionId = new URLSearchParams(history.location.search).get(
      'connectionId',
    );
    if (connectionId) {
      void getConnection(connectionId).then((result) => {
        if (result.success && result.data) {
          setCurrent(result.data);
          setDetailOpen(true);
        } else message.warning('链接中的连接不存在');
      });
    }
  }, []);

  const openDetail = (record: ConnectionView) => {
    setCurrent(record);
    setDetailOpen(true);
    history.replace(`${history.location.pathname}?connectionId=${record.id}`);
  };

  const confirmDelete = (record: ConnectionView) => {
    Modal.confirm({
      title: `断开并删除 ${record.cableNumber}？`,
      okText: '确认断开',
      okButtonProps: { danger: true },
      content: (
        <Space direction="vertical">
          <Typography.Text>
            {record.sourceDeviceName} / {record.sourcePortName} →{' '}
            {record.targetDeviceName} / {record.targetPortName}
          </Typography.Text>
          <Typography.Text type="danger">
            可能影响：{record.impact.join('、')}
          </Typography.Text>
        </Space>
      ),
      onOk: async () => {
        const result = await deleteConnection(record.id);
        if (result.success) {
          message.success('连接已断开，端口已释放');
          actionRef.current?.reload();
        }
      },
    });
  };

  const columns: ProColumns<ConnectionView>[] = [
    {
      title: '线缆 / 搜索',
      dataIndex: 'keyword',
      width: 170,
      render: (_, record) => (
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => openDetail(record)}
        >
          <Space>
            <Cable size={15} style={{ color: record.cableColor }} />
            {record.cableNumber}
          </Space>
        </Button>
      ),
    },
    {
      title: '连接类型',
      dataIndex: 'connectionType',
      width: 110,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        connectionTypes.map((item) => [item.value, { text: item.label }]),
      ),
      render: (_, record) => (
        <Tag
          color={
            connectionTypes.find((item) => item.value === record.connectionType)
              ?.color
          }
        >
          {connectionTypes.find((item) => item.value === record.connectionType)
            ?.label ?? record.connectionType}
        </Tag>
      ),
    },
    {
      title: '源端',
      search: false,
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.sourceDeviceName}</strong>
          <Typography.Text type="secondary">
            {record.sourcePortName} · {record.sourcePortSpeed} ·{' '}
            {record.sourceDeviceLocation}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '',
      search: false,
      width: 40,
      render: () => <ArrowRight size={16} />,
    },
    {
      title: '目标端',
      search: false,
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.targetDeviceName}</strong>
          <Typography.Text type="secondary">
            {record.targetPortName} · {record.targetPortSpeed} ·{' '}
            {record.targetDeviceLocation}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '介质',
      dataIndex: 'cableType',
      width: 130,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        cableTypes.map((item) => [item.value, { text: item.label }]),
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: {
        active: { text: '正常' },
        inactive: { text: '未激活' },
        faulty: { text: '故障' },
      },
      render: (_, record) => (
        <Tag color={statusMap[record.status].color}>
          {statusMap[record.status].text}
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
          key="detail"
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => openDetail(record)}
        >
          详情
        </Button>,
        <Dropdown
          key="more"
          menu={{
            items: [
              { key: 'edit', label: '编辑属性' },
              { key: 'topology', label: '拓扑定位' },
              { key: 'delete', label: '断开连接', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') {
                setCurrent(record);
                setEditOpen(true);
              }
              if (key === 'topology')
                history.push(`/network/topology?connectionId=${record.id}`);
              if (key === 'delete') confirmDelete(record);
            },
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<Ellipsis size={16} />}
            aria-label={`${record.cableNumber} 更多操作`}
          />
        </Dropdown>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '物理连接管理',
        subTitle: '按设备与端口检索、校验、导入并追踪物理链路变更',
      }}
    >
      <ProTable<ConnectionView>
        headerTitle="物理连接与业务影响"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1250 }}
        request={async (params) => {
          const urlDeviceId =
            new URLSearchParams(history.location.search).get('deviceId') ??
            undefined;
          const result = await getConnections({
            current: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
            connectionType: params.connectionType,
            cableType: params.cableType,
            status: params.status,
            deviceId: urlDeviceId,
          });
          return {
            data: result.data ?? [],
            success: result.success,
            total: result.total ?? 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="import"
            icon={<FileUp size={15} />}
            onClick={() => setImportOpen(true)}
          >
            批量导入
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => setCreateOpen(true)}
          >
            新建连接
          </Button>,
        ]}
      />
      <ConnectionFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        connectionTypes={connectionTypes}
        cableTypes={cableTypes}
        onFinish={async (values) => {
          const result = await createConnection(values);
          if (!result.success) return false;
          message.success('连接创建成功，拓扑将在下次刷新显示');
          actionRef.current?.reload();
          return true;
        }}
      />
      <ConnectionEditModal
        open={editOpen}
        connection={current}
        onOpenChange={setEditOpen}
        connectionTypes={connectionTypes}
        cableTypes={cableTypes}
        onFinish={async (values) => {
          if (!current) return false;
          const result = await updateConnection(current.id, values);
          if (!result.success) return false;
          message.success('连接属性已更新');
          actionRef.current?.reload();
          return true;
        }}
      />
      <ConnectionImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApplied={() => {
          message.success('有效连接已进入导入任务');
          actionRef.current?.reload();
        }}
      />
      <ConnectionDetailDrawer
        open={detailOpen}
        connection={current}
        onClose={() => {
          setDetailOpen(false);
          history.replace(history.location.pathname);
        }}
      />
    </PageContainer>
  );
};

export default ConnectionPage;

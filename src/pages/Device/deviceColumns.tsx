import type { ProColumns } from '@ant-design/pro-components';
import { Button, Dropdown, Modal, message, Space, Tag, Tooltip } from 'antd';
import {
  AlertTriangle,
  Cable,
  Edit3,
  Eye,
  MoreHorizontal,
  Network,
  PackageMinus,
  Server,
  Settings,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { deleteDevice } from '@/services/idc/device';
import {
  canPermanentlyDeleteDevice,
  getDeviceLifecycleStatus,
  lifecycleConfig,
} from './devicePresentation';

export const deviceStatusConfig: Record<
  string,
  { color: string; text: string; icon: React.ReactNode }
> = {
  online: { color: 'success', text: '在线', icon: <Wifi size={14} /> },
  offline: { color: 'default', text: '离线', icon: <WifiOff size={14} /> },
  warning: {
    color: 'warning',
    text: '告警',
    icon: <AlertTriangle size={14} />,
  },
  error: { color: 'error', text: '故障', icon: <AlertTriangle size={14} /> },
  maintenance: {
    color: 'processing',
    text: '维护中',
    icon: <Settings size={14} />,
  },
};

interface DeviceColumnOptions {
  templates: IDC.DeviceTemplate[];
  cabinets: IDC.Cabinet[];
  onOpenDetail: (device: IDC.Device) => void;
  onOpenPorts: (device: IDC.Device) => void;
  onEdit: (device: IDC.Device) => void;
  onUnmount: (device: IDC.Device) => void;
  onReload: () => void;
}

export function getDeviceColumns({
  templates,
  cabinets,
  onOpenDetail,
  onOpenPorts,
  onEdit,
  onUnmount,
  onReload,
}: DeviceColumnOptions): ProColumns<IDC.Device>[] {
  return [
    {
      title: '设备名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space>
          <Server size={16} style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '资产编码',
      dataIndex: 'assetCode',
      width: 150,
      copyable: true,
    },
    {
      title: '设备型号',
      dataIndex: 'templateId',
      width: 180,
      search: false,
      render: (_, record) => {
        const template = templates.find(
          (item) => item.id === record.templateId,
        );
        return template
          ? `${template.brand} ${template.model}`
          : record.templateId;
      },
    },
    {
      title: '所在机柜',
      dataIndex: 'cabinetId',
      width: 150,
      valueType: 'select',
      fieldProps: {
        options: cabinets.map((cabinet) => ({
          value: cabinet.id,
          label: cabinet.name,
        })),
        showSearch: true,
      },
      render: (_, record) =>
        cabinets.find((cabinet) => cabinet.id === record.cabinetId)?.name ||
        record.cabinetId,
    },
    {
      title: 'U 位',
      dataIndex: 'startU',
      width: 80,
      search: false,
      render: (_, record) =>
        record.startU === record.endU
          ? `U${record.startU}`
          : `U${record.startU}-${record.endU}`,
    },
    {
      title: '管理 IP',
      dataIndex: 'managementIp',
      width: 130,
      copyable: true,
      render: (_, record) =>
        record.managementIp && (
          <Tooltip title="点击复制">
            <Space>
              <Network size={14} style={{ color: '#8c8c8c' }} />
              {record.managementIp}
            </Space>
          </Tooltip>
        ),
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
        maintenance: { text: '维护中', status: 'Processing' },
      },
      render: (_, record) => (
        <Tag
          icon={deviceStatusConfig[record.status]?.icon}
          color={deviceStatusConfig[record.status]?.color}
        >
          {deviceStatusConfig[record.status]?.text}
        </Tag>
      ),
    },
    { title: '负责人', dataIndex: 'owner', width: 80, search: false },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: [
          '网络运维部',
          '应用开发部',
          '数据库运维部',
          '安全运维部',
          '存储运维部',
          'AI研发部',
        ].map((value) => ({ value, label: value })),
      },
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycleStatus',
      width: 110,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(lifecycleConfig).map(([key, value]) => [
          key,
          { text: value.text },
        ]),
      ),
      render: (_, record) => {
        const lifecycle = getDeviceLifecycleStatus(record);
        return (
          <Tag color={lifecycleConfig[lifecycle].color}>
            {lifecycleConfig[lifecycle].text}
          </Tag>
        );
      },
    },
    {
      title: '质保到期',
      dataIndex: 'warrantyExpiry',
      width: 110,
      valueType: 'date',
      search: false,
      render: (_, record) => {
        if (!record.warrantyExpiry) return '-';
        const daysLeft = Math.ceil(
          (new Date(record.warrantyExpiry).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        const isExpired = daysLeft <= 0;
        const isExpiringSoon = daysLeft > 0 && daysLeft <= 90;
        return (
          <Tooltip title={isExpired ? '已过期' : `剩余 ${daysLeft} 天`}>
            <span
              style={{
                color: isExpired
                  ? '#f5222d'
                  : isExpiringSoon
                    ? '#faad14'
                    : undefined,
              }}
            >
              {record.warrantyExpiry}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => onOpenDetail(record)}
          >
            详情
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'ports', icon: <Cable size={14} />, label: '端口' },
                { key: 'edit', icon: <Edit3 size={14} />, label: '编辑' },
                {
                  key: 'unmount',
                  icon: <PackageMinus size={14} />,
                  label: '下架',
                  disabled: record.isMounted === false,
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <Trash2 size={14} />,
                  label: canPermanentlyDeleteDevice(record)
                    ? '永久删除'
                    : '永久删除（仅归档资产）',
                  danger: true,
                  disabled: !canPermanentlyDeleteDevice(record),
                },
              ],
              onClick: ({ key }) => {
                if (key === 'ports') return onOpenPorts(record);
                if (key === 'edit') return onEdit(record);
                if (key === 'unmount') return onUnmount(record);
                Modal.confirm({
                  title: '永久删除已归档资产？',
                  content: '永久删除后无法恢复，仅高权限管理员可执行。',
                  okText: '永久删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    const response = await deleteDevice(record.id);
                    if (!response.success) {
                      message.error(response.errorMessage || '删除失败');
                      return Promise.reject();
                    }
                    message.success('已归档资产被永久删除');
                    onReload();
                  },
                });
              },
            }}
          >
            <Button
              type="link"
              size="small"
              icon={<MoreHorizontal size={14} />}
            >
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];
}

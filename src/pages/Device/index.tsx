import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import {
  AlertTriangle,
  Cable,
  CheckCircle,
  Edit3,
  Eye,
  Network,
  Plus,
  Server,
  Settings,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DevicePortView from '@/components/DevicePortView';
import { getCabinets, getCabinetUUsage } from '@/services/idc/cabinet';
import {
  createDevice,
  deleteDevice,
  getDevices,
  unmountDevice,
  updateDevice,
} from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';

const statusConfig: Record<
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

// U位可视化选择组件
const USlotSelector: React.FC<{
  cabinetId: string;
  uHeight: number; // 机柜总U位
  deviceUHeight: number; // 设备占用U位
  selectedStartU: number | undefined;
  onSelect: (startU: number) => void;
}> = ({ cabinetId, uHeight, deviceUHeight, selectedStartU, onSelect }) => {
  const [uUsage, setUUsage] = useState<
    { u: number; occupied: boolean; deviceName?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cabinetId) {
      setLoading(true);
      getCabinetUUsage(cabinetId)
        .then((res) => {
          if (res.success && res.data) {
            // API返回的是对象 { uSlots: [...] }，需要提取并转换
            const slots = res.data.uSlots || [];
            setUUsage(
              slots.map((s: any) => ({
                u: s.u,
                occupied: !!s.deviceId,
                deviceName: s.deviceName,
              })),
            );
          }
        })
        .finally(() => setLoading(false));
    }
  }, [cabinetId]);

  // 检查某个起始U位是否可用
  const isSlotAvailable = (startU: number) => {
    for (let u = startU; u < startU + deviceUHeight; u++) {
      const slot = uUsage.find((s) => s.u === u);
      if (slot?.occupied) return false;
      if (u > uHeight) return false;
    }
    return true;
  };

  // 生成可用的起始U位选项
  const availableSlots = useMemo(() => {
    const slots: number[] = [];
    for (let u = 1; u <= uHeight - deviceUHeight + 1; u++) {
      if (isSlotAvailable(u)) {
        slots.push(u);
      }
    }
    return slots;
  }, [uUsage, uHeight, deviceUHeight]);

  if (!cabinetId)
    return <Alert message="请先选择目标机柜" type="info" showIcon />;
  if (loading) return <div>加载U位信息...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
        可用U位: {availableSlots.length} 个 | 设备需占用: {deviceUHeight}U
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        {Array.from({ length: uHeight }, (_, i) => uHeight - i).map((u) => {
          const slot = uUsage.find((s) => s.u === u);
          const isOccupied = slot?.occupied;
          const isSelected =
            selectedStartU &&
            u >= selectedStartU &&
            u < selectedStartU + deviceUHeight;
          const canStart = !isOccupied && isSlotAvailable(u);

          return (
            <Tooltip
              key={u}
              title={
                isOccupied
                  ? `已被 ${slot.deviceName} 占用`
                  : canStart
                    ? `点击选择 U${u} 作为起始位置`
                    : '不可用'
              }
            >
              <div
                onClick={() => canStart && onSelect(u)}
                style={{
                  width: 32,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  borderRadius: 3,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  backgroundColor: isSelected
                    ? '#1890ff'
                    : isOccupied
                      ? '#ffccc7'
                      : '#f0f0f0',
                  color: isSelected ? '#fff' : isOccupied ? '#f5222d' : '#333',
                  border: isSelected
                    ? '2px solid #1890ff'
                    : '1px solid #d9d9d9',
                  transition: 'all 0.2s',
                }}
              >
                {u}
              </div>
            </Tooltip>
          );
        })}
      </div>
      {selectedStartU && (
        <Alert
          type="success"
          message={`已选择: U${selectedStartU} - U${selectedStartU + deviceUHeight - 1}`}
          icon={<CheckCircle size={14} />}
          showIcon
        />
      )}
      {availableSlots.length === 0 && (
        <Alert type="error" message="该机柜没有足够的连续空闲U位" showIcon />
      )}
    </div>
  );
};

const DevicePage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<IDC.Device>();
  const [templates, setTemplates] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);

  // 上架表单状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>();
  const [selectedStartU, setSelectedStartU] = useState<number>();

  // 端口详情视图状态
  const [portViewOpen, setPortViewOpen] = useState(false);
  const [portViewDevice, setPortViewDevice] = useState<IDC.Device | null>(null);

  useEffect(() => {
    getAllDeviceTemplates().then((res) => {
      if (res.success) setTemplates(res.data || []);
    });
    getCabinets({ pageSize: 1000 }).then((res) => {
      if (res.success) setCabinets(res.data || []);
    });
  }, []);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, templates]);

  const selectedCabinet = useMemo(() => {
    return cabinets.find((c) => c.id === selectedCabinetId);
  }, [selectedCabinetId, cabinets]);

  const columns: ProColumns<IDC.Device>[] = [
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
        const tpl = templates.find((t) => t.id === record.templateId);
        return tpl ? `${tpl.brand} ${tpl.model}` : record.templateId;
      },
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
      title: '管理IP',
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
          icon={statusConfig[record.status]?.icon}
          color={statusConfig[record.status]?.color}
        >
          {statusConfig[record.status]?.text}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: 80,
      search: false,
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: [
          { value: '网络运维部', label: '网络运维部' },
          { value: '应用开发部', label: '应用开发部' },
          { value: '数据库运维部', label: '数据库运维部' },
          { value: '安全运维部', label: '安全运维部' },
          { value: '存储运维部', label: '存储运维部' },
          { value: 'AI研发部', label: 'AI研发部' },
        ],
      },
    },
    {
      title: '架设状态',
      dataIndex: 'isMounted',
      width: 90,
      valueType: 'select',
      valueEnum: {
        true: { text: '已上架', status: 'Success' },
        false: { text: '已下架', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isMounted !== false ? 'green' : 'default'}>
          {record.isMounted !== false ? '已上架' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '质保到期',
      dataIndex: 'warrantyExpiry',
      width: 110,
      valueType: 'date',
      search: false,
      render: (_, record) => {
        if (!record.warrantyExpiry) return '-';
        const expiry = new Date(record.warrantyExpiry);
        const now = new Date();
        const daysLeft = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isExpiringSoon = daysLeft > 0 && daysLeft <= 90;
        const isExpired = daysLeft <= 0;
        return (
          <Tooltip title={isExpired ? '已过期' : `剩余${daysLeft}天`}>
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
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Tooltip key="ports" title="查看端口使用情况">
          <Button
            type="link"
            size="small"
            icon={<Cable size={14} />}
            onClick={() => {
              setPortViewDevice(record);
              setPortViewOpen(true);
            }}
          >
            端口
          </Button>
        </Tooltip>,
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
          key="unmount"
          title="确定要下架这个设备吗？"
          description="下架后设备的连接信息将被释放，历史记录会保留。"
          onConfirm={async () => {
            const res = await unmountDevice(record.id);
            if (res.success) {
              message.success('设备已下架');
              actionRef.current?.reload();
            }
          }}
          disabled={record.isMounted === false}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            disabled={record.isMounted === false}
          >
            下架
          </Button>
        </Popconfirm>,
        <Popconfirm
          key="delete"
          title="确定要删除这个设备吗？"
          description="删除后数据将无法恢复。"
          onConfirm={async () => {
            const res = await deleteDevice(record.id);
            if (res.success) {
              message.success('设备已删除');
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

  const resetCreateForm = () => {
    setSelectedTemplateId(undefined);
    setSelectedCabinetId(undefined);
    setSelectedStartU(undefined);
  };

  return (
    <PageContainer
      header={{
        title: '设备管理',
        subTitle: '管理已上架的设备',
      }}
    >
      <ProTable<IDC.Device>
        headerTitle="设备列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1600 }}
        request={async (params) => {
          const res = await getDevices({
            current: params.current,
            pageSize: params.pageSize,
            cabinetId: params.cabinetId,
            name: params.name,
            status: params.status,
            assetCode: params.assetCode,
            managementIp: params.managementIp,
            department: params.department,
          });
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
            onClick={() => {
              resetCreateForm();
              setCreateModalOpen(true);
            }}
          >
            设备上架
          </Button>,
        ]}
      />

      {/* 设备上架模态框 - 优化版 */}
      <ModalForm
        title="设备上架"
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) resetCreateForm();
        }}
        width={800}
        onFinish={async (values) => {
          if (!selectedStartU) {
            message.error('请选择起始U位');
            return false;
          }
          const deviceUHeight = selectedTemplate?.uHeight || 1;
          const res = await createDevice({
            ...values,
            startU: selectedStartU,
            endU: selectedStartU + deviceUHeight - 1,
          } as unknown as IDC.DeviceCreateParams);
          if (res.success) {
            message.success('设备上架成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          <div>
            <ProFormSelect
              name="templateId"
              label="设备型号"
              options={templates.map((t) => ({
                value: t.id,
                label: `${t.brand} ${t.model} (${t.uHeight}U)`,
              }))}
              showSearch
              rules={[{ required: true, message: '请选择设备型号' }]}
              fieldProps={{
                onChange: (value: string) => {
                  setSelectedTemplateId(value);
                  setSelectedStartU(undefined);
                },
              }}
            />
            <ProFormSelect
              name="cabinetId"
              label="目标机柜"
              options={cabinets.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code}) - 剩余${c.uHeight - c.usedU}U`,
              }))}
              showSearch
              rules={[{ required: true, message: '请选择目标机柜' }]}
              fieldProps={{
                onChange: (value: string) => {
                  setSelectedCabinetId(value);
                  setSelectedStartU(undefined);
                },
              }}
            />

            {/* U位可视化选择 */}
            {selectedCabinetId && selectedTemplateId && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  选择起始U位 <span style={{ color: '#f5222d' }}>*</span>
                </div>
                <USlotSelector
                  cabinetId={selectedCabinetId}
                  uHeight={selectedCabinet?.uHeight || 42}
                  deviceUHeight={selectedTemplate?.uHeight || 1}
                  selectedStartU={selectedStartU}
                  onSelect={setSelectedStartU}
                />
              </div>
            )}

            <ProFormText
              name="name"
              label="设备名称"
              placeholder="如：核心交换机-A1"
              rules={[{ required: true, message: '请输入设备名称' }]}
            />
            <ProFormText
              name="assetCode"
              label="资产编码"
              placeholder="如：BJ-NET-SW-001"
              rules={[{ required: true, message: '请输入资产编码' }]}
            />
          </div>

          <div>
            <ProFormText
              name="serialNumber"
              label="序列号"
              placeholder="请输入设备序列号"
            />
            <ProFormText
              name="managementIp"
              label="管理IP"
              placeholder="如：10.0.1.1"
            />
            <ProFormDatePicker name="purchaseDate" label="采购日期" />
            <ProFormDatePicker name="warrantyExpiry" label="质保到期" />
            <ProFormText name="vendor" label="供应商" />
            <ProFormText name="owner" label="负责人" />
            <ProFormSelect
              name="department"
              label="所属部门"
              options={[
                { value: '网络运维部', label: '网络运维部' },
                { value: '应用开发部', label: '应用开发部' },
                { value: '数据库运维部', label: '数据库运维部' },
                { value: '安全运维部', label: '安全运维部' },
                { value: '存储运维部', label: '存储运维部' },
                { value: 'AI研发部', label: 'AI研发部' },
              ]}
            />
          </div>
        </div>
        <ProFormTextArea name="description" label="备注" />
      </ModalForm>

      {/* 编辑模态框 */}
      <ModalForm
        title="编辑设备"
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        width={700}
        initialValues={currentRow}
        onFinish={async (values) => {
          if (!currentRow) return false;
          const res = await updateDevice(currentRow.id, values);
          if (res.success) {
            message.success('更新成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <ProFormText
          name="name"
          label="设备名称"
          rules={[{ required: true }]}
        />
        <ProFormText
          name="assetCode"
          label="资产编码"
          rules={[{ required: true }]}
        />
        <ProFormText name="serialNumber" label="序列号" />
        <ProFormText name="managementIp" label="管理IP" />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { value: 'online', label: '在线' },
            { value: 'offline', label: '离线' },
            { value: 'warning', label: '告警' },
            { value: 'error', label: '故障' },
            { value: 'maintenance', label: '维护中' },
          ]}
        />
        <ProFormDatePicker name="purchaseDate" label="采购日期" />
        <ProFormDatePicker name="warrantyExpiry" label="质保到期" />
        <ProFormText name="vendor" label="供应商" />
        <ProFormText name="owner" label="负责人" />
        <ProFormSelect
          name="department"
          label="所属部门"
          options={[
            { value: '网络运维部', label: '网络运维部' },
            { value: '应用开发部', label: '应用开发部' },
            { value: '数据库运维部', label: '数据库运维部' },
            { value: '安全运维部', label: '安全运维部' },
            { value: '存储运维部', label: '存储运维部' },
            { value: 'AI研发部', label: 'AI研发部' },
          ]}
        />
        <ProFormTextArea name="description" label="备注" />
      </ModalForm>

      {/* 详情抽屉 */}
      <Drawer
        title="设备详情"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={500}
      >
        {currentRow && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="设备名称">
              <Space>
                <Badge
                  status={
                    currentRow.status === 'online' ? 'success' : 'default'
                  }
                />
                {currentRow.name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="资产编码">
              {currentRow.assetCode}
            </Descriptions.Item>
            <Descriptions.Item label="序列号">
              {currentRow.serialNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="设备型号">
              {templates.find((t) => t.id === currentRow.templateId)?.name ||
                currentRow.templateId}
            </Descriptions.Item>
            <Descriptions.Item label="所在机柜">
              {cabinets.find((c) => c.id === currentRow.cabinetId)?.name ||
                currentRow.cabinetId}
            </Descriptions.Item>
            <Descriptions.Item label="U位">
              U{currentRow.startU} - U{currentRow.endU}
            </Descriptions.Item>
            <Descriptions.Item label="管理IP">
              {currentRow.managementIp || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig[currentRow.status]?.color}>
                {statusConfig[currentRow.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="采购日期">
              {currentRow.purchaseDate || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="质保到期">
              {currentRow.warrantyExpiry || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {currentRow.vendor || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {currentRow.owner || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="所属部门">
              {currentRow.department || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {currentRow.description || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 端口详情视图 */}
      <DevicePortView
        device={portViewDevice}
        template={
          portViewDevice
            ? templates.find((t) => t.id === portViewDevice.templateId)
            : null
        }
        open={portViewOpen}
        onClose={() => {
          setPortViewOpen(false);
          setPortViewDevice(null);
        }}
      />
    </PageContainer>
  );
};

export default DevicePage;

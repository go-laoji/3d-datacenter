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
import { history, useSearchParams } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Dropdown,
  Modal,
  message,
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
  MoreHorizontal,
  Network,
  PackageMinus,
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
  validateDeviceMount,
} from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import DeviceDetailDrawer from './components/DeviceDetailDrawer';
import DeviceUnmountModal from './components/DeviceUnmountModal';
import {
  canPermanentlyDeleteDevice,
  getDeviceLifecycleStatus,
  lifecycleConfig,
} from './devicePresentation';

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
  uUsage?: { u: number; occupied: boolean; deviceName?: string }[];
  loading?: boolean;
}> = ({
  cabinetId,
  uHeight,
  deviceUHeight,
  selectedStartU,
  onSelect,
  uUsage,
  loading,
}) => {
  const [innerUsage, setInnerUsage] = useState<
    { u: number; occupied: boolean; deviceName?: string }[]
  >([]);
  const [innerLoading, setInnerLoading] = useState(false);
  const mergedLoading = typeof loading === 'boolean' ? loading : innerLoading;
  const mergedUsage = uUsage ?? innerUsage;

  useEffect(() => {
    if (cabinetId) {
      if (uUsage) return;
      setInnerLoading(true);
      getCabinetUUsage(cabinetId)
        .then((res) => {
          if (res.success && res.data) {
            // API返回的是对象 { uSlots: [...] }，需要提取并转换
            const slots = res.data.uSlots || [];
            setInnerUsage(
              slots.map((s) => ({
                u: s.u,
                occupied: !!s.deviceId,
                deviceName: s.deviceName ?? undefined,
              })),
            );
          }
        })
        .finally(() => setInnerLoading(false));
    }
  }, [cabinetId, uUsage]);

  // 检查某个起始U位是否可用
  const isSlotAvailable = (startU: number) => {
    for (let u = startU; u < startU + deviceUHeight; u++) {
      const slot = mergedUsage.find((s) => s.u === u);
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
  }, [mergedUsage, uHeight, deviceUHeight]);

  if (!cabinetId)
    return <Alert message="请先选择目标机柜" type="info" showIcon />;
  if (mergedLoading) return <div>加载U位信息...</div>;

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
          const slot = mergedUsage.find((s) => s.u === u);
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
              <button
                type="button"
                disabled={!canStart}
                aria-label={`U${u}${isOccupied ? `，已被 ${slot.deviceName || '设备'} 占用` : canStart ? '，可作为起始位' : '，不可作为起始位'}`}
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
                  padding: 0,
                }}
              >
                {u}
              </button>
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
  const [searchParams] = useSearchParams();
  const requestedDeviceId = searchParams.get('deviceId') || undefined;
  const requestedStatus = searchParams.get('status') || undefined;
  const requestedDatacenterId = searchParams.get('datacenterId') || undefined;
  const actionRef = useRef<ActionType>(null);
  const openedDeepLinkDeviceRef = useRef<string | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<IDC.Device>();
  const [templates, setTemplates] = useState<IDC.DeviceTemplate[]>([]);
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);

  // 上架表单状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>();
  const [selectedStartU, setSelectedStartU] = useState<number>();
  const [cabinetSlots, setCabinetSlots] = useState<
    { u: number; occupied: boolean; deviceName?: string }[]
  >([]);
  const [cabinetSlotsLoading, setCabinetSlotsLoading] = useState(false);
  const [mountValidation, setMountValidation] =
    useState<IDC.DeviceMountValidationResult | null>(null);
  const [mountValidationLoading, setMountValidationLoading] = useState(false);

  // 端口详情视图状态
  const [portViewOpen, setPortViewOpen] = useState(false);
  const [portViewDevice, setPortViewDevice] = useState<IDC.Device | null>(null);
  const [unmountTarget, setUnmountTarget] = useState<IDC.Device>();
  const [unmounting, setUnmounting] = useState(false);

  useEffect(() => {
    getAllDeviceTemplates().then((res) => {
      if (res.success) setTemplates(res.data || []);
    });
    getCabinets({ pageSize: 1000 }).then((res) => {
      if (res.success) setCabinets(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (!requestedDeviceId) openedDeepLinkDeviceRef.current = undefined;
    actionRef.current?.reload();
  }, [requestedDatacenterId, requestedDeviceId, requestedStatus]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, templates]);

  const selectedCabinet = useMemo(() => {
    return cabinets.find((c) => c.id === selectedCabinetId);
  }, [selectedCabinetId, cabinets]);

  useEffect(() => {
    if (!selectedCabinetId) {
      setCabinetSlots([]);
      setMountValidation(null);
      return;
    }
    setCabinetSlotsLoading(true);
    getCabinetUUsage(selectedCabinetId)
      .then((res) => {
        if (res.success && res.data) {
          const slots = res.data.uSlots || [];
          setCabinetSlots(
            slots.map((s) => ({
              u: s.u,
              occupied: !!s.deviceId,
              deviceName: s.deviceName ?? undefined,
            })),
          );
        } else {
          setCabinetSlots([]);
        }
      })
      .finally(() => setCabinetSlotsLoading(false));
  }, [selectedCabinetId]);

  const deviceMaxPower = useMemo(() => {
    if (selectedTemplate?.maxPower) return selectedTemplate.maxPower;
    const category = selectedTemplate?.category;
    const defaults: Record<string, number> = {
      server: 800,
      storage: 1200,
      switch: 300,
      router: 300,
      firewall: 400,
      loadbalancer: 400,
      other: 200,
    };
    return category ? defaults[category] || 200 : 200;
  }, [selectedTemplate]);

  const powerPortCount = useMemo(() => {
    return (
      selectedTemplate?.portGroups?.reduce((sum, pg) => {
        return pg.portType === 'Power' ? sum + (pg.count || 0) : sum;
      }, 0) || 0
    );
  }, [selectedTemplate]);

  const totalPortCount = useMemo(() => {
    return (
      selectedTemplate?.portGroups?.reduce((sum, pg) => {
        return sum + (pg.count || 0);
      }, 0) || 0
    );
  }, [selectedTemplate]);

  useEffect(() => {
    const cabinetId = selectedCabinetId;
    const templateId = selectedTemplateId;
    const cabinet = selectedCabinet;
    const tpl = selectedTemplate;

    if (!cabinetId || !templateId || !cabinet || !tpl) {
      setMountValidation(null);
      return;
    }

    const deviceUHeight = tpl.uHeight || 1;
    const startU = selectedStartU;
    const endU = startU ? startU + deviceUHeight - 1 : undefined;

    setMountValidationLoading(true);
    validateDeviceMount({
      cabinetId,
      cabinetUHeight: cabinet.uHeight,
      cabinetMaxPower: cabinet.maxPower,
      cabinetCurrentPower: cabinet.currentPower,
      templateId,
      deviceUHeight,
      deviceMaxPower,
      powerPortCount,
      totalPortCount,
      startU,
      endU,
    })
      .then((res) => {
        if (res.success && res.data) {
          setMountValidation(res.data);
        } else {
          setMountValidation(null);
        }
      })
      .finally(() => setMountValidationLoading(false));
  }, [
    selectedCabinetId,
    selectedTemplateId,
    selectedCabinet,
    selectedTemplate,
    selectedStartU,
    deviceMaxPower,
    powerPortCount,
    totalPortCount,
  ]);

  const cabinetOptions = useMemo(() => {
    const deviceUHeight = selectedTemplate?.uHeight || 1;
    return [...cabinets]
      .map((c) => {
        const availableU = (c.uHeight || 42) - (c.usedU || 0);
        const headroom = (c.maxPower || 0) - (c.currentPower || 0);
        const canFitU = availableU >= deviceUHeight;
        return {
          value: c.id,
          sortScore:
            (canFitU ? 1_000_000 : 0) +
            Math.max(0, availableU) * 1000 +
            Math.max(0, headroom),
          label: `${c.name} (${c.code}) - 剩余${availableU}U | 余功率${Math.max(0, headroom)}W`,
        };
      })
      .sort((a, b) => b.sortScore - a.sortScore)
      .map(({ value, label }) => ({ value, label }));
  }, [cabinets, selectedTemplate]);

  const validationSummary = useMemo(() => {
    if (!selectedTemplate || !selectedCabinet) return null;
    const deviceUHeight = selectedTemplate.uHeight || 1;
    const startU = selectedStartU;
    const endU = startU ? startU + deviceUHeight - 1 : undefined;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (startU && endU) {
      if (endU > selectedCabinet.uHeight) {
        errors.push('U位超出机柜高度');
      } else {
        const occupied = cabinetSlots.some(
          (s) => s.occupied && s.u >= startU && s.u <= endU,
        );
        if (occupied) errors.push('所选U位区间存在占用冲突');
      }
    }

    const maxPower = selectedCabinet.maxPower || 0;
    const currentPower = selectedCabinet.currentPower || 0;
    const nextPower = maxPower ? currentPower + deviceMaxPower : currentPower;

    if (maxPower) {
      if (nextPower > maxPower) {
        errors.push('功率将超过机柜最大承载');
      } else if (nextPower / maxPower >= 0.8) {
        warnings.push('功率负载较高，可能存在散热压力');
      }
    }

    if (!totalPortCount) warnings.push('设备模板未定义端口信息');
    if (powerPortCount < 2) warnings.push('设备电源口可能不支持A/B双路冗余');
    warnings.push('A/B路电源来源未配置，建议在电力拓扑中补齐冗余链路');

    return { errors, warnings, startU, endU, nextPower, maxPower };
  }, [
    selectedTemplate,
    selectedCabinet,
    selectedStartU,
    cabinetSlots,
    deviceMaxPower,
    powerPortCount,
    totalPortCount,
  ]);

  const resetCreateForm = () => {
    setSelectedTemplateId(undefined);
    setSelectedCabinetId(undefined);
    setSelectedStartU(undefined);
    setCabinetSlots([]);
    setMountValidation(null);
  };

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
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => {
              setCurrentRow(record);
              setDetailDrawerOpen(true);
            }}
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
                if (key === 'ports') {
                  setPortViewDevice(record);
                  setPortViewOpen(true);
                  return;
                }
                if (key === 'edit') {
                  setCurrentRow(record);
                  setEditModalOpen(true);
                  return;
                }
                if (key === 'unmount') {
                  setUnmountTarget(record);
                  return;
                }
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
                    actionRef.current?.reload();
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

  return (
    <PageContainer
      header={{
        title: '设备管理',
        subTitle: '管理已上架的设备',
      }}
    >
      {(requestedDeviceId || requestedStatus || requestedDatacenterId) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            requestedDeviceId
              ? `已从工作台定位设备 ${requestedDeviceId}`
              : requestedStatus
                ? `已按“${statusConfig[requestedStatus]?.text || requestedStatus}”状态筛选设备`
                : `已恢复站点上下文 ${requestedDatacenterId}`
          }
          description={
            requestedDeviceId
              ? '设备详情将在数据加载完成后自动展开。'
              : '列表仅展示与工作台指标一致的设备，可继续叠加其他筛选条件。'
          }
          action={
            <Button size="small" onClick={() => history.push('/idc/device')}>
              清除定位
            </Button>
          }
        />
      )}
      <ProTable<IDC.Device>
        headerTitle="设备列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1600 }}
        request={async (params) => {
          const res = await getDevices({
            id: requestedDeviceId,
            datacenterId: requestedDatacenterId,
            current: params.current,
            pageSize: params.pageSize,
            cabinetId: params.cabinetId,
            name: params.name,
            status: params.status || requestedStatus,
            assetCode: params.assetCode,
            managementIp: params.managementIp,
            department: params.department,
            isMounted: params.isMounted,
            lifecycleStatus: params.lifecycleStatus,
          });
          const deepLinkedDevice = requestedDeviceId
            ? res.data?.[0]
            : undefined;
          if (
            requestedDeviceId &&
            deepLinkedDevice &&
            openedDeepLinkDeviceRef.current !== requestedDeviceId
          ) {
            openedDeepLinkDeviceRef.current = requestedDeviceId;
            setCurrentRow(deepLinkedDevice);
            setDetailDrawerOpen(true);
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
          if (mountValidationLoading) {
            message.warning('正在进行容量校验，请稍后');
            return false;
          }
          if (mountValidation && !mountValidation.ok) {
            message.error('容量校验未通过，请调整上架位置或目标机柜');
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
            if (res.data) {
              const createdDeviceId = res.data.id;
              Modal.success({
                title: '设备已上架，继续完善关系',
                content: (
                  <Space wrap style={{ marginTop: 12 }}>
                    <Button
                      onClick={() =>
                        history.push(
                          `/network/port?deviceId=${createdDeviceId}`,
                        )
                      }
                    >
                      配置端口
                    </Button>
                    <Button
                      onClick={() =>
                        history.push(`/power?deviceId=${createdDeviceId}`)
                      }
                    >
                      配置 A/B 路电源
                    </Button>
                  </Space>
                ),
                okText: '稍后处理',
              });
            }
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
              options={cabinetOptions}
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
                  uUsage={cabinetSlots}
                  loading={cabinetSlotsLoading}
                />
              </div>
            )}

            {(selectedCabinetId || selectedTemplateId) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>容量校验</div>
                {mountValidationLoading && <div>校验中...</div>}
                {!mountValidationLoading && (
                  <>
                    {validationSummary?.errors?.length ? (
                      <Alert
                        type="error"
                        showIcon
                        message="校验未通过"
                        description={
                          <div>
                            {validationSummary.errors.map((e) => (
                              <div key={e}>{e}</div>
                            ))}
                          </div>
                        }
                      />
                    ) : (
                      <Alert
                        type="success"
                        showIcon
                        message="基础容量校验通过"
                      />
                    )}
                    {validationSummary?.warnings?.length ? (
                      <Alert
                        style={{ marginTop: 8 }}
                        type="warning"
                        showIcon
                        message="建议关注项"
                        description={
                          <div>
                            {validationSummary.warnings.map((w) => (
                              <div key={w}>{w}</div>
                            ))}
                          </div>
                        }
                      />
                    ) : null}
                    {mountValidation?.recommendedStartU &&
                      mountValidation.recommendedEndU && (
                        <Alert
                          style={{ marginTop: 8 }}
                          type="info"
                          showIcon
                          message={`推荐上架位置：U${mountValidation.recommendedStartU}-U${mountValidation.recommendedEndU}`}
                          action={
                            <Button
                              size="small"
                              type="link"
                              onClick={() =>
                                setSelectedStartU(
                                  mountValidation.recommendedStartU,
                                )
                              }
                            >
                              使用推荐
                            </Button>
                          }
                        />
                      )}
                  </>
                )}
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

      <DeviceDetailDrawer
        device={currentRow}
        template={templates.find((t) => t.id === currentRow?.templateId)}
        cabinet={cabinets.find((c) => c.id === currentRow?.cabinetId)}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onOpenPorts={() => {
          if (!currentRow) return;
          setDetailDrawerOpen(false);
          setPortViewDevice(currentRow);
          setPortViewOpen(true);
        }}
      />

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

      <DeviceUnmountModal
        device={unmountTarget}
        confirmLoading={unmounting}
        onCancel={() => setUnmountTarget(undefined)}
        onConfirm={async (confirmDependencies) => {
          if (!unmountTarget) return;
          setUnmounting(true);
          try {
            const response = await unmountDevice(
              unmountTarget.id,
              confirmDependencies,
            );
            if (response.success) {
              message.success('设备已下架，资产记录和历史信息已保留');
              setUnmountTarget(undefined);
              actionRef.current?.reload();
            }
          } finally {
            setUnmounting(false);
          }
        }}
      />
    </PageContainer>
  );
};

export default DevicePage;

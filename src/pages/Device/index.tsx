import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, Button, message } from 'antd';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DevicePortView from '@/components/DevicePortView';
import { getCabinets, getCabinetUUsage } from '@/services/idc/cabinet';
import {
  getDevices,
  unmountDevice,
  validateDeviceMount,
} from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { DeviceBatchLifecycle } from './components/DeviceBatchLifecycle';
import DeviceDetailDrawer from './components/DeviceDetailDrawer';
import {
  DeviceCreateForm,
  DeviceEditForm,
  type MountValidationSummary,
} from './components/DeviceForms';
import DeviceUnmountModal from './components/DeviceUnmountModal';
import type { CabinetSlot } from './components/USlotSelector';
import { deviceStatusConfig, getDeviceColumns } from './deviceColumns';

const DevicePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedDeviceId = searchParams.get('deviceId') || undefined;
  const requestedStatus = searchParams.get('status') || undefined;
  const requestedDatacenterId = searchParams.get('datacenterId') || undefined;
  const actionRef = useRef<ActionType>(null);
  const openedDeepLinkDeviceRef = useRef<string | undefined>(undefined);

  const [templates, setTemplates] = useState<IDC.DeviceTemplate[]>([]);
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [currentRow, setCurrentRow] = useState<IDC.Device>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [portViewOpen, setPortViewOpen] = useState(false);
  const [portViewDevice, setPortViewDevice] = useState<IDC.Device | null>(null);
  const [unmountTarget, setUnmountTarget] = useState<IDC.Device>();
  const [unmounting, setUnmounting] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<React.Key[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>();
  const [selectedStartU, setSelectedStartU] = useState<number>();
  const [cabinetSlots, setCabinetSlots] = useState<CabinetSlot[]>([]);
  const [cabinetSlotsLoading, setCabinetSlotsLoading] = useState(false);
  const [mountValidation, setMountValidation] =
    useState<IDC.DeviceMountValidationResult | null>(null);
  const [mountValidationLoading, setMountValidationLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      getAllDeviceTemplates(),
      getCabinets({ pageSize: 1000 }),
    ]).then(([templateResponse, cabinetResponse]) => {
      if (templateResponse.success) setTemplates(templateResponse.data || []);
      if (cabinetResponse.success) setCabinets(cabinetResponse.data || []);
    });
  }, []);

  useEffect(() => {
    if (!requestedDeviceId) openedDeepLinkDeviceRef.current = undefined;
    actionRef.current?.reload();
  }, [requestedDatacenterId, requestedDeviceId, requestedStatus]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );
  const selectedCabinet = useMemo(
    () => cabinets.find((cabinet) => cabinet.id === selectedCabinetId),
    [cabinets, selectedCabinetId],
  );
  const deviceMaxPower = useMemo(() => {
    if (selectedTemplate?.maxPower) return selectedTemplate.maxPower;
    const categoryDefaults: Record<string, number> = {
      server: 800,
      storage: 1200,
      switch: 300,
      router: 300,
      firewall: 400,
      loadbalancer: 400,
      other: 200,
    };
    return selectedTemplate?.category
      ? categoryDefaults[selectedTemplate.category] || 200
      : 200;
  }, [selectedTemplate]);
  const powerPortCount = useMemo(
    () =>
      selectedTemplate?.portGroups?.reduce(
        (sum, group) =>
          group.portType === 'Power' ? sum + (group.count || 0) : sum,
        0,
      ) || 0,
    [selectedTemplate],
  );
  const totalPortCount = useMemo(
    () =>
      selectedTemplate?.portGroups?.reduce(
        (sum, group) => sum + (group.count || 0),
        0,
      ) || 0,
    [selectedTemplate],
  );

  useEffect(() => {
    if (!selectedCabinetId) {
      setCabinetSlots([]);
      setMountValidation(null);
      return;
    }
    setCabinetSlotsLoading(true);
    void getCabinetUUsage(selectedCabinetId)
      .then((response) => {
        setCabinetSlots(
          response.success && response.data
            ? (response.data.uSlots || []).map((slot) => ({
                u: slot.u,
                occupied: Boolean(slot.deviceId),
                deviceName: slot.deviceName ?? undefined,
              }))
            : [],
        );
      })
      .finally(() => setCabinetSlotsLoading(false));
  }, [selectedCabinetId]);

  useEffect(() => {
    if (
      !selectedCabinetId ||
      !selectedTemplateId ||
      !selectedCabinet ||
      !selectedTemplate
    ) {
      setMountValidation(null);
      return;
    }
    const deviceUHeight = selectedTemplate.uHeight || 1;
    setMountValidationLoading(true);
    void validateDeviceMount({
      cabinetId: selectedCabinetId,
      cabinetUHeight: selectedCabinet.uHeight,
      cabinetMaxPower: selectedCabinet.maxPower,
      cabinetCurrentPower: selectedCabinet.currentPower,
      templateId: selectedTemplateId,
      deviceUHeight,
      deviceMaxPower,
      powerPortCount,
      totalPortCount,
      startU: selectedStartU,
      endU:
        selectedStartU === undefined
          ? undefined
          : selectedStartU + deviceUHeight - 1,
    })
      .then((response) =>
        setMountValidation(
          response.success && response.data ? response.data : null,
        ),
      )
      .finally(() => setMountValidationLoading(false));
  }, [
    deviceMaxPower,
    powerPortCount,
    selectedCabinet,
    selectedCabinetId,
    selectedStartU,
    selectedTemplate,
    selectedTemplateId,
    totalPortCount,
  ]);

  const cabinetOptions = useMemo(() => {
    const deviceUHeight = selectedTemplate?.uHeight || 1;
    return cabinets
      .map((cabinet) => {
        const availableU = (cabinet.uHeight || 42) - (cabinet.usedU || 0);
        const headroom = (cabinet.maxPower || 0) - (cabinet.currentPower || 0);
        return {
          value: cabinet.id,
          label: `${cabinet.name} (${cabinet.code}) - 剩余${availableU}U | 余功率${Math.max(0, headroom)}W`,
          score:
            (availableU >= deviceUHeight ? 1_000_000 : 0) +
            Math.max(0, availableU) * 1000 +
            Math.max(0, headroom),
        };
      })
      .sort((left, right) => right.score - left.score)
      .map(({ value, label }) => ({ value, label }));
  }, [cabinets, selectedTemplate]);

  const validationSummary = useMemo<MountValidationSummary | null>(() => {
    if (!selectedTemplate || !selectedCabinet) return null;
    const errors: string[] = [];
    const warnings: string[] = [];
    const endU =
      selectedStartU === undefined
        ? undefined
        : selectedStartU + (selectedTemplate.uHeight || 1) - 1;
    if (selectedStartU !== undefined && endU !== undefined) {
      if (endU > selectedCabinet.uHeight) errors.push('U 位超出机柜高度');
      if (
        cabinetSlots.some(
          (slot) => slot.occupied && slot.u >= selectedStartU && slot.u <= endU,
        )
      ) {
        errors.push('所选 U 位区间存在占用冲突');
      }
    }
    const maxPower = selectedCabinet.maxPower || 0;
    const nextPower = (selectedCabinet.currentPower || 0) + deviceMaxPower;
    if (maxPower && nextPower > maxPower) errors.push('功率将超过机柜最大承载');
    else if (maxPower && nextPower / maxPower >= 0.8) {
      warnings.push('功率负载较高，可能存在散热压力');
    }
    if (!totalPortCount) warnings.push('设备模板未定义端口信息');
    if (powerPortCount < 2) warnings.push('设备电源口可能不支持 A/B 双路冗余');
    warnings.push('A/B 路电源来源未配置，建议在电力拓扑中补齐冗余链路');
    return { errors, warnings };
  }, [
    cabinetSlots,
    deviceMaxPower,
    powerPortCount,
    selectedCabinet,
    selectedStartU,
    selectedTemplate,
    totalPortCount,
  ]);

  const resetCreateForm = () => {
    setSelectedTemplateId(undefined);
    setSelectedCabinetId(undefined);
    setSelectedStartU(undefined);
    setCabinetSlots([]);
    setMountValidation(null);
  };
  const reload = () => actionRef.current?.reload();
  const columns = getDeviceColumns({
    templates,
    cabinets,
    onOpenDetail: (device) => {
      setCurrentRow(device);
      setDetailDrawerOpen(true);
    },
    onOpenPorts: (device) => {
      setPortViewDevice(device);
      setPortViewOpen(true);
    },
    onEdit: (device) => {
      setCurrentRow(device);
      setEditModalOpen(true);
    },
    onUnmount: setUnmountTarget,
    onReload: reload,
  });

  return (
    <PageContainer
      header={{ title: '设备管理', subTitle: '管理设备上架、关系与生命周期' }}
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
                ? `已按“${deviceStatusConfig[requestedStatus]?.text || requestedStatus}”状态筛选设备`
                : `已恢复站点上下文 ${requestedDatacenterId}`
          }
          description={
            requestedDeviceId
              ? '设备详情将在数据加载完成后自动展开。'
              : '列表仅展示与来源指标一致的设备，可继续叠加其他筛选条件。'
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
        rowSelection={{
          selectedRowKeys: selectedDeviceIds,
          preserveSelectedRowKeys: true,
          onChange: setSelectedDeviceIds,
        }}
        request={async (params) => {
          const response = await getDevices({
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
            ? response.data?.[0]
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
            data: response.data || [],
            success: response.success,
            total: response.total || 0,
          };
        }}
        toolBarRender={() => [
          <DeviceBatchLifecycle
            key="batch-lifecycle"
            selectedDeviceIds={selectedDeviceIds}
            onCompleted={() => {
              setSelectedDeviceIds([]);
              reload();
            }}
          />,
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
      <DeviceCreateForm
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) resetCreateForm();
        }}
        onCreated={reload}
        templates={templates}
        cabinetOptions={cabinetOptions}
        selectedTemplate={selectedTemplate}
        selectedCabinet={selectedCabinet}
        selectedTemplateId={selectedTemplateId}
        selectedCabinetId={selectedCabinetId}
        selectedStartU={selectedStartU}
        cabinetSlots={cabinetSlots}
        cabinetSlotsLoading={cabinetSlotsLoading}
        mountValidation={mountValidation}
        mountValidationLoading={mountValidationLoading}
        validationSummary={validationSummary}
        onTemplateChange={(id) => {
          setSelectedTemplateId(id);
          setSelectedStartU(undefined);
        }}
        onCabinetChange={(id) => {
          setSelectedCabinetId(id);
          setSelectedStartU(undefined);
        }}
        onStartUChange={setSelectedStartU}
      />
      <DeviceEditForm
        open={editModalOpen}
        device={currentRow}
        onOpenChange={setEditModalOpen}
        onUpdated={reload}
      />
      <DeviceDetailDrawer
        device={currentRow}
        template={templates.find((item) => item.id === currentRow?.templateId)}
        cabinet={cabinets.find((item) => item.id === currentRow?.cabinetId)}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onOpenPorts={() => {
          if (!currentRow) return;
          setDetailDrawerOpen(false);
          setPortViewDevice(currentRow);
          setPortViewOpen(true);
        }}
      />
      <DevicePortView
        device={portViewDevice}
        template={
          portViewDevice
            ? templates.find((item) => item.id === portViewDevice.templateId)
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
              reload();
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

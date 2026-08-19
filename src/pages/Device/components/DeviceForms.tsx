import {
  ModalForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Modal, message, Space } from 'antd';
import { createDevice, updateDevice } from '@/services/idc/device';
import { type CabinetSlot, USlotSelector } from './USlotSelector';

const departmentOptions = [
  '网络运维部',
  '应用开发部',
  '数据库运维部',
  '安全运维部',
  '存储运维部',
  'AI研发部',
].map((value) => ({ value, label: value }));

export interface MountValidationSummary {
  errors: string[];
  warnings: string[];
}

interface DeviceCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  templates: IDC.DeviceTemplate[];
  cabinetOptions: { value: string; label: string }[];
  selectedTemplate?: IDC.DeviceTemplate;
  selectedCabinet?: IDC.Cabinet;
  selectedTemplateId?: string;
  selectedCabinetId?: string;
  selectedStartU?: number;
  cabinetSlots: CabinetSlot[];
  cabinetSlotsLoading: boolean;
  mountValidation: IDC.DeviceMountValidationResult | null;
  mountValidationLoading: boolean;
  validationSummary: MountValidationSummary | null;
  onTemplateChange: (id: string) => void;
  onCabinetChange: (id: string) => void;
  onStartUChange: (startU: number) => void;
}

export function DeviceCreateForm({
  open,
  onOpenChange,
  onCreated,
  templates,
  cabinetOptions,
  selectedTemplate,
  selectedCabinet,
  selectedTemplateId,
  selectedCabinetId,
  selectedStartU,
  cabinetSlots,
  cabinetSlotsLoading,
  mountValidation,
  mountValidationLoading,
  validationSummary,
  onTemplateChange,
  onCabinetChange,
  onStartUChange,
}: DeviceCreateFormProps) {
  return (
    <ModalForm
      title="设备上架"
      open={open}
      onOpenChange={onOpenChange}
      width={800}
      onFinish={async (values) => {
        if (selectedStartU === undefined) {
          message.error('请选择起始 U 位');
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
        const response = await createDevice({
          ...values,
          startU: selectedStartU,
          endU: selectedStartU + deviceUHeight - 1,
        } as unknown as IDC.DeviceCreateParams);
        if (!response.success) return false;
        message.success('设备上架成功');
        if (response.data) {
          const deviceId = response.data.id;
          Modal.success({
            title: '设备已上架，继续完善关系',
            content: (
              <Space wrap style={{ marginTop: 12 }}>
                <Button
                  onClick={() =>
                    history.push(`/network/port?deviceId=${deviceId}`)
                  }
                >
                  配置端口
                </Button>
                <Button
                  onClick={() => history.push(`/power?deviceId=${deviceId}`)}
                >
                  配置 A/B 路电源
                </Button>
              </Space>
            ),
            okText: '稍后处理',
          });
        }
        onCreated();
        return true;
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <ProFormSelect
            name="templateId"
            label="设备型号"
            options={templates.map((template) => ({
              value: template.id,
              label: `${template.brand} ${template.model} (${template.uHeight}U)`,
            }))}
            showSearch
            rules={[{ required: true, message: '请选择设备型号' }]}
            fieldProps={{ onChange: onTemplateChange }}
          />
          <ProFormSelect
            name="cabinetId"
            label="目标机柜"
            options={cabinetOptions}
            showSearch
            rules={[{ required: true, message: '请选择目标机柜' }]}
            fieldProps={{ onChange: onCabinetChange }}
          />
          {selectedCabinetId && selectedTemplateId && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                选择起始 U 位 <span style={{ color: '#f5222d' }}>*</span>
              </div>
              <USlotSelector
                cabinetId={selectedCabinetId}
                uHeight={selectedCabinet?.uHeight || 42}
                deviceUHeight={selectedTemplate?.uHeight || 1}
                selectedStartU={selectedStartU}
                onSelect={onStartUChange}
                uUsage={cabinetSlots}
                loading={cabinetSlotsLoading}
              />
            </div>
          )}
          {(selectedCabinetId || selectedTemplateId) && (
            <MountValidationFeedback
              loading={mountValidationLoading}
              validation={mountValidation}
              summary={validationSummary}
              onUseRecommended={onStartUChange}
            />
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
          <ProFormText name="serialNumber" label="序列号" />
          <ProFormText
            name="managementIp"
            label="管理 IP"
            placeholder="如：10.0.1.1"
          />
          <ProFormDatePicker name="purchaseDate" label="采购日期" />
          <ProFormDatePicker name="warrantyExpiry" label="质保到期" />
          <ProFormText name="vendor" label="供应商" />
          <ProFormText name="owner" label="负责人" />
          <ProFormSelect
            name="department"
            label="所属部门"
            options={departmentOptions}
          />
        </div>
      </div>
      <ProFormTextArea name="description" label="备注" />
    </ModalForm>
  );
}

function MountValidationFeedback({
  loading,
  validation,
  summary,
  onUseRecommended,
}: {
  loading: boolean;
  validation: IDC.DeviceMountValidationResult | null;
  summary: MountValidationSummary | null;
  onUseRecommended: (startU: number) => void;
}) {
  if (loading) return <div style={{ marginBottom: 24 }}>容量校验中...</div>;
  const recommendedStartU = validation?.recommendedStartU;
  const recommendedEndU = validation?.recommendedEndU;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>容量校验</div>
      <Alert
        type={summary?.errors.length ? 'error' : 'success'}
        showIcon
        message={summary?.errors.length ? '校验未通过' : '基础容量校验通过'}
        description={summary?.errors.map((error) => (
          <div key={error}>{error}</div>
        ))}
      />
      {summary?.warnings.length ? (
        <Alert
          style={{ marginTop: 8 }}
          type="warning"
          showIcon
          message="建议关注项"
          description={summary.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        />
      ) : null}
      {recommendedStartU && recommendedEndU && (
        <Alert
          style={{ marginTop: 8 }}
          type="info"
          showIcon
          message={`推荐上架位置：U${recommendedStartU}-U${recommendedEndU}`}
          action={
            <Button
              size="small"
              type="link"
              onClick={() => onUseRecommended(recommendedStartU)}
            >
              使用推荐
            </Button>
          }
        />
      )}
    </div>
  );
}

export function DeviceEditForm({
  open,
  device,
  onOpenChange,
  onUpdated,
}: {
  open: boolean;
  device?: IDC.Device;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  return (
    <ModalForm
      title="编辑设备"
      open={open}
      onOpenChange={onOpenChange}
      width={700}
      initialValues={device}
      onFinish={async (values) => {
        if (!device) return false;
        const response = await updateDevice(device.id, values);
        if (!response.success) return false;
        message.success('更新成功');
        onUpdated();
        return true;
      }}
    >
      <ProFormText name="name" label="设备名称" rules={[{ required: true }]} />
      <ProFormText
        name="assetCode"
        label="资产编码"
        rules={[{ required: true }]}
      />
      <ProFormText name="serialNumber" label="序列号" />
      <ProFormText name="managementIp" label="管理 IP" />
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
        options={departmentOptions}
      />
      <ProFormTextArea name="description" label="备注" />
    </ModalForm>
  );
}

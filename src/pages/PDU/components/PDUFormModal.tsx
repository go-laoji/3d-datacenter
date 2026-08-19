import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { useRef } from 'react';
import type { PDUDevice, PDUTemplate } from '@/services/idc/pdu';

export interface PDUFormValues {
  templateId?: string;
  name: string;
  powerPath: 'A' | 'B';
  cabinetId: string;
  startU: number;
  outputPorts: number;
  maxLoad: number;
  loadThreshold: number;
  phase: 'L1' | 'L2' | 'L3';
  currentLoad?: number;
  managementIp?: string;
  assetCode?: string;
  status?: PDUDevice['status'];
  brand?: string;
  model?: string;
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  current?: PDUDevice;
  templates: PDUTemplate[];
  cabinets: IDC.Cabinet[];
  onOpenChange: (open: boolean) => void;
  onFinish: (values: PDUFormValues) => Promise<boolean>;
}

const PDUFormModal: React.FC<Props> = ({
  open,
  mode,
  current,
  templates,
  cabinets,
  onOpenChange,
  onFinish,
}) => {
  const formRef = useRef<ProFormInstance<PDUFormValues>>(null);
  const initialValues: Partial<PDUFormValues> =
    mode === 'edit' && current
      ? {
          name: current.name,
          powerPath: current.pduData.powerPath,
          cabinetId: current.cabinetId,
          startU: current.startU,
          outputPorts: current.pduData.outputPorts,
          maxLoad: current.pduData.maxLoad,
          loadThreshold: current.pduData.loadThreshold ?? 80,
          phase: current.pduData.phase ?? 'L1',
          currentLoad: current.pduData.currentLoad,
          managementIp: current.managementIp,
          assetCode: current.assetCode,
          status: current.status,
          brand: current.pduData.brand,
          model: current.pduData.model,
        }
      : { outputPorts: 16, maxLoad: 3000, loadThreshold: 80, phase: 'L1' };

  return (
    <ModalForm<PDUFormValues>
      key={`${mode}-${current?.id ?? 'new'}-${open}`}
      formRef={formRef}
      title={mode === 'create' ? '添加 PDU' : '编辑 PDU'}
      open={open}
      onOpenChange={onOpenChange}
      initialValues={initialValues}
      width={680}
      grid
      onFinish={onFinish}
    >
      {mode === 'create' ? (
        <ProFormSelect
          name="templateId"
          label="PDU 模板"
          colProps={{ span: 24 }}
          placeholder="选择模板自动带入额定参数"
          options={templates.map((template) => ({
            value: template.id,
            label: `${template.brand} ${template.model} · ${template.specs.outputPorts}口`,
          }))}
          onChange={(templateId) => {
            const template = templates.find((item) => item.id === templateId);
            if (!template) return;
            formRef.current?.setFieldsValue({
              outputPorts: template.specs.outputPorts,
              maxLoad: Number.parseInt(template.specs.maxLoad, 10),
              loadThreshold: template.defaultThreshold,
              phase: template.phases[0],
              brand: template.brand,
              model: template.model,
            });
          }}
        />
      ) : null}
      <ProFormText
        name="name"
        label="PDU 名称"
        colProps={{ xs: 24, md: 12 }}
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="powerPath"
        label="电源路径"
        colProps={{ xs: 24, md: 12 }}
        options={[
          { value: 'A', label: 'A 路' },
          { value: 'B', label: 'B 路' },
        ]}
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="cabinetId"
        label="所在机柜"
        colProps={{ xs: 24, md: 12 }}
        options={cabinets.map((cabinet) => ({
          value: cabinet.id,
          label: `${cabinet.name} · ${cabinet.code}`,
        }))}
        showSearch
        rules={[{ required: true }]}
      />
      <ProFormDigit
        name="startU"
        label="起始 U 位"
        min={1}
        max={47}
        colProps={{ xs: 24, md: 12 }}
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="phase"
        label="默认相位"
        colProps={{ xs: 24, md: 8 }}
        options={['L1', 'L2', 'L3'].map((value) => ({ value, label: value }))}
      />
      <ProFormDigit
        name="outputPorts"
        label="输出插座"
        min={4}
        max={48}
        colProps={{ xs: 24, md: 8 }}
      />
      <ProFormDigit
        name="maxLoad"
        label="额定容量"
        min={1000}
        max={12000}
        fieldProps={{ addonAfter: 'W' }}
        colProps={{ xs: 24, md: 8 }}
      />
      <ProFormDigit
        name="loadThreshold"
        label="负载告警阈值"
        min={50}
        max={95}
        fieldProps={{ addonAfter: '%' }}
        colProps={{ xs: 24, md: 8 }}
      />
      {mode === 'edit' ? (
        <ProFormDigit
          name="currentLoad"
          label="当前负载"
          min={0}
          fieldProps={{ addonAfter: 'W' }}
          colProps={{ xs: 24, md: 8 }}
        />
      ) : null}
      {mode === 'edit' ? (
        <ProFormSelect
          name="status"
          label="状态"
          colProps={{ xs: 24, md: 8 }}
          options={['online', 'offline', 'warning', 'error'].map((value) => ({
            value,
            label: value,
          }))}
        />
      ) : null}
      <ProFormText
        name="managementIp"
        label="管理 IP"
        colProps={{ xs: 24, md: 12 }}
      />
      <ProFormText
        name="assetCode"
        label="资产编码"
        colProps={{ xs: 24, md: 12 }}
      />
      <ProFormText name="brand" label="品牌" hidden />
      <ProFormText name="model" label="型号" hidden />
    </ModalForm>
  );
};

export default PDUFormModal;

import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useRef, useState } from 'react';
import PortGroupEditor from './PortGroupEditor';
import type {
  DeviceTemplateFormValues,
  EditablePortGroup,
} from './templateFormModel';
import {
  createTemplatePayload,
  getEditablePortGroups,
  getTemplateFormInitialValues,
} from './templateFormModel';

interface DeviceTemplateFormModalProps {
  mode: 'create' | 'edit' | 'clone';
  open: boolean;
  categories: Array<{ value: string; label: string }>;
  template?: IDC.DeviceTemplate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: IDC.DeviceTemplateCreateParams) => Promise<boolean>;
}

const DeviceTemplateFormModal: React.FC<DeviceTemplateFormModalProps> = ({
  mode,
  open,
  categories,
  template,
  onOpenChange,
  onSubmit,
}) => {
  const formRef = useRef<ProFormInstance<DeviceTemplateFormValues>>(null);
  const [portGroups, setPortGroups] = useState<EditablePortGroup[]>(() =>
    getEditablePortGroups(template),
  );
  const initialValues = getTemplateFormInitialValues(
    template,
    mode === 'clone',
  );

  return (
    <ModalForm<DeviceTemplateFormValues>
      formRef={formRef}
      title={
        mode === 'edit'
          ? '编辑设备模板'
          : mode === 'clone'
            ? '克隆设备模板'
            : '新建设备模板'
      }
      open={open}
      width={760}
      initialValues={initialValues}
      modalProps={{ destroyOnClose: true }}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          formRef.current?.setFieldsValue(initialValues);
          setPortGroups(getEditablePortGroups(template));
        }
        onOpenChange(nextOpen);
      }}
      onFinish={async (values) => {
        const hasInvalidPortGroup = portGroups.some(
          (portGroup) => !portGroup.name.trim() || portGroup.count < 1,
        );
        if (hasInvalidPortGroup) {
          message.error('请完善所有端口组名称和数量');
          return false;
        }
        return onSubmit(
          createTemplatePayload({ ...initialValues, ...values }, portGroups),
        );
      }}
    >
      <ProFormSelect
        name="category"
        label="设备类型"
        options={categories}
        rules={[{ required: true, message: '请选择设备类型' }]}
      />
      <ProFormText
        name="brand"
        label="品牌"
        placeholder="如：华为、思科、H3C"
        rules={[{ required: true, message: '请输入品牌' }]}
      />
      <ProFormText
        name="model"
        label="型号"
        placeholder="如：S5735-L48T4X-A"
        rules={[{ required: true, message: '请输入型号' }]}
      />
      <ProFormText
        name="name"
        label="模板名称"
        placeholder="如：华为 S5735-L48T4X-A"
        rules={[{ required: true, message: '请输入模板名称' }]}
      />
      <ProFormDigit
        name="uHeight"
        label="U 位高度"
        min={1}
        max={48}
        rules={[{ required: true, message: '请输入 U 位高度' }]}
      />
      <ProFormDigit
        name="maxPower"
        label="最高功率（W）"
        min={0}
        max={10000}
        fieldProps={{ addonAfter: 'W' }}
      />
      <PortGroupEditor value={portGroups} onChange={setPortGroups} />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="请输入描述信息"
      />
    </ModalForm>
  );
};

export default DeviceTemplateFormModal;

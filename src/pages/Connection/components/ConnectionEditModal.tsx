import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { ConnectionView } from '@/services/idc/connection';

interface Option {
  value: string;
  label: string;
}
interface Props {
  open: boolean;
  connection?: ConnectionView;
  connectionTypes: Option[];
  cableTypes: Option[];
  onOpenChange: (open: boolean) => void;
  onFinish: (values: Partial<IDC.Connection>) => Promise<boolean>;
}

const ConnectionEditModal: React.FC<Props> = ({
  open,
  connection,
  connectionTypes,
  cableTypes,
  onOpenChange,
  onFinish,
}) => (
  <ModalForm
    key={`${connection?.id}-${open}`}
    title="编辑连接属性"
    open={open}
    onOpenChange={onOpenChange}
    initialValues={connection}
    width={620}
    onFinish={onFinish}
  >
    <ProFormText
      name="cableNumber"
      label="线缆编号"
      rules={[{ required: true }]}
    />
    <ProFormSelect
      name="connectionType"
      label="连接类型"
      options={connectionTypes}
    />
    <ProFormSelect name="cableType" label="线缆介质" options={cableTypes} />
    <ProFormSelect
      name="status"
      label="链路状态"
      options={[
        { value: 'active', label: '正常' },
        { value: 'inactive', label: '未激活' },
        { value: 'faulty', label: '故障' },
      ]}
    />
    <ProFormDigit
      name="cableLength"
      label="线缆长度"
      min={0.1}
      fieldProps={{ addonAfter: 'm' }}
    />
    <ProFormTextArea name="description" label="业务用途" />
  </ModalForm>
);

export default ConnectionEditModal;

import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, ColorPicker, Divider, Space } from 'antd';
import { useEffect, useState } from 'react';
import {
  type ConnectionValidation,
  validateConnection,
} from '@/services/idc/connection';
import PortSelector from './PortSelector';
import RemoteDeviceSelect from './RemoteDeviceSelect';

interface Option {
  value: string;
  label: string;
}
interface Props {
  open: boolean;
  connectionTypes: Option[];
  cableTypes: Option[];
  onOpenChange: (open: boolean) => void;
  onFinish: (values: IDC.ConnectionCreateParams) => Promise<boolean>;
}

const ConnectionFormModal: React.FC<Props> = ({
  open,
  connectionTypes,
  cableTypes,
  onOpenChange,
  onFinish,
}) => {
  const [sourceDeviceId, setSourceDeviceId] = useState<string>();
  const [targetDeviceId, setTargetDeviceId] = useState<string>();
  const [sourcePortId, setSourcePortId] = useState<string>();
  const [targetPortId, setTargetPortId] = useState<string>();
  const [cableType, setCableType] = useState<IDC.CableType>('Cat6a');
  const [color, setColor] = useState('#3498db');
  const [validation, setValidation] = useState<ConnectionValidation>();
  const [validating, setValidating] = useState(false);

  const reset = () => {
    setSourceDeviceId(undefined);
    setTargetDeviceId(undefined);
    setSourcePortId(undefined);
    setTargetPortId(undefined);
    setCableType('Cat6a');
    setValidation(undefined);
    setColor('#3498db');
  };

  useEffect(() => {
    let active = true;
    if (
      !sourceDeviceId ||
      !targetDeviceId ||
      !sourcePortId ||
      !targetPortId ||
      !cableType
    ) {
      setValidation(undefined);
      return;
    }
    setValidating(true);
    validateConnection({
      sourceDeviceId,
      targetDeviceId,
      sourcePortId,
      targetPortId,
      cableType,
    })
      .then((result) => {
        if (active && result.success) setValidation(result.data);
      })
      .finally(() => {
        if (active) setValidating(false);
      });
    return () => {
      active = false;
    };
  }, [sourceDeviceId, targetDeviceId, sourcePortId, targetPortId, cableType]);

  return (
    <ModalForm
      key={String(open)}
      title="新建物理连接"
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      width={920}
      initialValues={{
        connectionType: 'network',
        cableType: 'Cat6a',
        cableLength: 3,
      }}
      submitter={{
        submitButtonProps: { disabled: validating || !validation?.valid },
        searchConfig: {
          submitText: validation?.valid ? '创建连接' : '请完成连接校验',
        },
      }}
      onFinish={async (values) => {
        if (!sourcePortId || !targetPortId || !validation?.valid) return false;
        return onFinish({
          ...(values as IDC.ConnectionCreateParams),
          sourceDeviceId: values.sourceDeviceId,
          targetDeviceId: values.targetDeviceId,
          sourcePortId,
          targetPortId,
          cableColor: color,
        });
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <ProFormText
            name="cableNumber"
            label="线缆编号"
            rules={[{ required: true, message: '请输入现场可核对的唯一编号' }]}
          />
          <ProFormSelect
            name="connectionType"
            label="连接类型"
            options={connectionTypes}
            rules={[{ required: true }]}
          />
          <ProFormSelect
            name="cableType"
            label="线缆介质"
            options={cableTypes}
            rules={[{ required: true }]}
            fieldProps={{ onChange: setCableType }}
          />
          <ProFormDigit
            name="cableLength"
            label="长度"
            min={0.1}
            fieldProps={{ addonAfter: 'm', step: 0.5 }}
          />
          <ProForm.Item label="线缆颜色">
            <ColorPicker
              value={color}
              onChange={(value) => setColor(value.toHexString())}
            />
          </ProForm.Item>
          <ProFormTextArea
            name="description"
            label="业务用途"
            placeholder="例如：应用服务器生产网络"
          />
        </div>
        <Divider orientation="left">源端设备与端口</Divider>
        <ProForm.Item
          name="sourceDeviceId"
          label="源设备"
          rules={[{ required: true }]}
        >
          <RemoteDeviceSelect
            onChange={(value) => {
              setSourceDeviceId(value);
              setSourcePortId(undefined);
            }}
          />
        </ProForm.Item>
        <PortSelector
          deviceId={sourceDeviceId}
          value={sourcePortId}
          excludePortId={targetPortId}
          onChange={setSourcePortId}
        />
        <Divider orientation="left">目标端设备与端口</Divider>
        <ProForm.Item
          name="targetDeviceId"
          label="目标设备"
          rules={[{ required: true }]}
        >
          <RemoteDeviceSelect
            onChange={(value) => {
              setTargetDeviceId(value);
              setTargetPortId(undefined);
            }}
          />
        </ProForm.Item>
        <PortSelector
          deviceId={targetDeviceId}
          value={targetPortId}
          excludePortId={sourcePortId}
          onChange={setTargetPortId}
        />
        {validating ? (
          <Alert
            type="info"
            showIcon
            message="正在校验端口占用、介质、速率与环路风险…"
          />
        ) : null}
        {validation ? (
          <Alert
            type={
              validation.valid
                ? validation.warnings.length
                  ? 'warning'
                  : 'success'
                : 'error'
            }
            showIcon
            message={validation.valid ? '连接校验通过' : '存在阻断项，不能创建'}
            description={
              [...validation.blockers, ...validation.warnings].join('；') ||
              '端口空闲，未发现速率、介质或环路冲突'
            }
          />
        ) : null}
      </Space>
    </ModalForm>
  );
};

export default ConnectionFormModal;

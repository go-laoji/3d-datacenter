import { Form, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';
import type { AutoLayoutOptions } from './layoutEditorModel';

interface AutoLayoutDialogProps {
  open: boolean;
  cabinetCount: number;
  onClose: () => void;
  onPreview: (options: AutoLayoutOptions) => void;
}

export function AutoLayoutDialog({
  open,
  cabinetCount,
  onClose,
  onPreview,
}: AutoLayoutDialogProps) {
  const [form] = Form.useForm<AutoLayoutOptions>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      columns: Math.max(1, Math.ceil(Math.sqrt(cabinetCount))),
      spacingX: 1.2,
      spacingY: 1.8,
      startX: 2,
      startY: 2,
    });
  }, [cabinetCount, form, open]);

  return (
    <Modal
      title="自动布局预览参数"
      open={open}
      okText="生成预览"
      cancelText="取消"
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => {
          onPreview(values);
          onClose();
        });
      }}
    >
      <p>生成结果只会进入预览层，点击“接受预览”后才写入工作副本。</p>
      <Form form={form} layout="vertical">
        <Form.Item name="columns" label="每排行数" rules={[{ required: true }]}>
          <InputNumber min={1} max={20} precision={0} />
        </Form.Item>
        <Form.Item name="spacingX" label="横向间距（m）">
          <InputNumber min={0.6} max={10} step={0.1} />
        </Form.Item>
        <Form.Item name="spacingY" label="纵向间距（m）">
          <InputNumber min={0.8} max={10} step={0.1} />
        </Form.Item>
        <Form.Item name="startX" label="起始 X（m）">
          <InputNumber min={0} max={100} step={0.1} />
        </Form.Item>
        <Form.Item name="startY" label="起始 Y（m）">
          <InputNumber min={0} max={100} step={0.1} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { Button, Input, Modal, Space } from 'antd';
import { useEffect, useState } from 'react';

interface LayoutTransferModalProps {
  mode: 'import' | 'export' | null;
  layout: IDC.DatacenterLayout;
  onClose: () => void;
  onImport: (layout: IDC.DatacenterLayout) => void;
  onFeedback: (message: string, type: 'success' | 'error') => void;
}

export function LayoutTransferModal({
  mode,
  layout,
  onClose,
  onImport,
  onFeedback,
}: LayoutTransferModalProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (mode === 'export') setText(JSON.stringify(layout, null, 2));
    if (mode === 'import') setText('');
  }, [layout, mode]);

  const importLayout = () => {
    try {
      const parsed = JSON.parse(text) as IDC.DatacenterLayout;
      if (
        !Array.isArray(parsed.cabinets) ||
        !Array.isArray(parsed.zones) ||
        !Array.isArray(parsed.facilities) ||
        typeof parsed.canvasWidth !== 'number' ||
        typeof parsed.canvasHeight !== 'number'
      ) {
        throw new Error('invalid layout');
      }
      onImport({ ...parsed, datacenterId: layout.datacenterId });
      onFeedback('JSON 已导入工作副本，请检查后保存', 'success');
      onClose();
    } catch {
      onFeedback('JSON 格式或布局字段不完整', 'error');
    }
  };

  return (
    <Modal
      width={760}
      title={mode === 'import' ? '导入布局 JSON' : '导出布局 JSON'}
      open={Boolean(mode)}
      onCancel={onClose}
      footer={
        mode === 'import' ? (
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={importLayout}>
              导入工作副本
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button
              type="primary"
              onClick={() => {
                void navigator.clipboard.writeText(text).then(() => {
                  onFeedback('布局 JSON 已复制', 'success');
                });
              }}
            >
              复制 JSON
            </Button>
          </Space>
        )
      }
    >
      <Input.TextArea
        aria-label="布局 JSON"
        rows={22}
        value={text}
        readOnly={mode === 'export'}
        onChange={(event) => setText(event.target.value)}
        placeholder="粘贴完整的布局 JSON"
      />
    </Modal>
  );
}

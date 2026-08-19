import { Alert, Button, Modal, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import {
  applyConnectionImport,
  type ConnectionImportRow,
  previewConnectionImport,
} from '@/services/idc/connection';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}

const sample = `cableNumber,sourceDevice,sourcePort,targetDevice,targetPort
BJ-CAT6A-011,dev-002,GE1/0/31,dev-004,eth3
BJ-FIBER-001,dev-001,XGE1/0/1,dev-006,SFP1
BJ-CAT6A-012,dev-002,GE1/0/32,dev-005,eth3`;

const ConnectionImportModal: React.FC<Props> = ({
  open,
  onClose,
  onApplied,
}) => {
  const [content, setContent] = useState(sample);
  const [rows, setRows] = useState<ConnectionImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const ready = rows.filter((row) => row.status === 'ready').length;

  const preview = async () => {
    setLoading(true);
    try {
      const result = await previewConnectionImport(content);
      if (result.success) setRows(result.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  };
  const apply = async () => {
    setLoading(true);
    try {
      const result = await applyConnectionImport(rows);
      if (result.success) {
        onApplied();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="批量导入物理连接"
      open={open}
      onCancel={onClose}
      width={820}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={preview} loading={loading}>
            差异预览
          </Button>
          <Button
            type="primary"
            disabled={!ready}
            loading={loading}
            onClick={apply}
          >
            创建 {ready} 条有效连接
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="演示 CSV 导入"
        description="先校验必填列、重复编号和冲突；只有状态为“可创建”的行会进入任务。"
        style={{ marginBottom: 12 }}
      />
      <Typography.Text strong>CSV 内容</Typography.Text>
      <textarea
        aria-label="连接 CSV 内容"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        style={{
          width: '100%',
          minHeight: 120,
          marginBlock: 8,
          fontFamily: 'monospace',
        }}
      />
      {rows.length ? (
        <Table
          size="small"
          rowKey="row"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: '行', dataIndex: 'row', width: 55 },
            { title: '线缆编号', dataIndex: 'cableNumber' },
            { title: '源端', dataIndex: 'source' },
            { title: '目标端', dataIndex: 'target' },
            {
              title: '校验',
              dataIndex: 'status',
              render: (value, row) => (
                <Space>
                  <Tag color={value === 'ready' ? 'success' : 'error'}>
                    {value === 'ready' ? '可创建' : '冲突'}
                  </Tag>
                  {row.message}
                </Space>
              ),
            },
          ]}
        />
      ) : null}
    </Modal>
  );
};

export default ConnectionImportModal;

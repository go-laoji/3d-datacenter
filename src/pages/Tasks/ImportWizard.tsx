import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { FileSpreadsheet, Play, UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  type BatchResultItem,
  BatchResultPanel,
} from '@/components/operations';
import {
  applyImport,
  type ImportPreview,
  previewImport,
  type TaskWorkspace,
} from '@/services/platform';
import { summarizeImportRows } from './taskModel';

interface ImportWizardProps {
  supportedImports: TaskWorkspace['supportedImports'];
  onApplied: () => Promise<void>;
}

export function ImportWizard({
  supportedImports,
  onApplied,
}: ImportWizardProps) {
  const { message } = App.useApp();
  const [entityType, setEntityType] = useState('device');
  const [fileName, setFileName] = useState('devices-demo.xlsx');
  const [preview, setPreview] = useState<ImportPreview>();
  const [applying, setApplying] = useState(false);
  const definition =
    supportedImports.find((item) => item.value === entityType) ??
    supportedImports[0];
  const mapping = useMemo(
    () => Object.fromEntries(definition.fields.map((field) => [field, field])),
    [definition],
  );
  const summary = preview ? summarizeImportRows(preview.rows) : undefined;
  const resultItems: BatchResultItem[] =
    preview?.rows.map((row) => ({
      id: String(row.rowNumber),
      name: `第 ${row.rowNumber} 行 · ${row.name}`,
      success: row.action !== 'error',
      reason: row.error,
    })) ?? [];

  const parse = async () => {
    const response = await previewImport({ entityType, fileName, mapping });
    setPreview(response.data);
    message.success('文件已解析，差异预览已生成');
  };
  const apply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      const response = await applyImport(preview.id);
      message.success(`任务 ${response.data.id} 已进入后台执行`);
      await onApplied();
    } finally {
      setApplying(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Steps
        current={preview ? 2 : fileName ? 1 : 0}
        items={[
          { title: '选择文件' },
          { title: '字段映射' },
          { title: '差异预览' },
          { title: '后台执行' },
        ]}
      />
      <Card title="1. 文件与导入对象" size="small">
        <Space wrap align="start">
          <Select
            value={entityType}
            style={{ width: 180 }}
            options={supportedImports}
            onChange={(value) => {
              setEntityType(value);
              setPreview(undefined);
            }}
          />
          <Upload.Dragger
            maxCount={1}
            beforeUpload={(file) => {
              setFileName(file.name);
              setPreview(undefined);
              return false;
            }}
            showUploadList={false}
            style={{ width: 360 }}
          >
            <UploadCloud size={24} />
            <p>点击或拖入 CSV / Excel 文件</p>
            <Typography.Text type="secondary">当前：{fileName}</Typography.Text>
          </Upload.Dragger>
        </Space>
      </Card>
      <Card title="2. 字段映射" size="small">
        <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
          {definition.fields.map((field) => (
            <Descriptions.Item key={field} label={`文件列 ${field}`}>
              <Tag color="blue">系统字段 {mapping[field]}</Tag>
            </Descriptions.Item>
          ))}
        </Descriptions>
        <Button
          icon={<FileSpreadsheet size={15} />}
          type="primary"
          onClick={() => void parse()}
          style={{ marginTop: 16 }}
        >
          解析并生成差异预览
        </Button>
      </Card>
      {preview && summary && (
        <Card
          title="3. 差异与错误预览"
          size="small"
          extra={
            <Space>
              <Tag color="success">新增 {summary.create}</Tag>
              <Tag color="processing">更新 {summary.update}</Tag>
              <Tag>跳过 {summary.skip}</Tag>
              <Tag color="error">错误 {summary.error}</Tag>
            </Space>
          }
        >
          <Alert
            showIcon
            type="info"
            message="只有新增和更新行会写入；错误行会生成结果文件，跳过行保持不变。"
          />
          <Table
            rowKey="rowNumber"
            size="small"
            pagination={false}
            dataSource={preview.rows}
            columns={[
              { title: '行', dataIndex: 'rowNumber', width: 60 },
              { title: '业务键', dataIndex: 'key', width: 140 },
              { title: '名称', dataIndex: 'name' },
              {
                title: '动作',
                render: (_, row) => (
                  <Tag
                    color={
                      row.action === 'create'
                        ? 'success'
                        : row.action === 'update'
                          ? 'processing'
                          : row.action === 'error'
                            ? 'error'
                            : 'default'
                    }
                  >
                    {row.action}
                  </Tag>
                ),
              },
              {
                title: '差异 / 错误',
                render: (_, row) => row.error ?? row.differences.join('；'),
              },
            ]}
          />
          <BatchResultPanel
            items={resultItems}
            onRetryFailed={(items) =>
              message.info(
                `已筛选 ${items.length} 个失败行，请修正源文件后重新解析`,
              )
            }
          />
          <Button
            type="primary"
            icon={<Play size={15} />}
            loading={applying}
            onClick={() => void apply()}
            style={{ marginTop: 16 }}
          >
            应用有效行并创建任务
          </Button>
        </Card>
      )}
    </Space>
  );
}

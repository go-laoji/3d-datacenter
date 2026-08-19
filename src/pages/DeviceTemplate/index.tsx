import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  List,
  Modal,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import {
  Copy,
  Cpu,
  Database,
  Edit3,
  Eye,
  HardDrive,
  Layers,
  Monitor,
  Plus,
  Router,
  Shield,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  createDeviceTemplate,
  deleteDeviceTemplate,
  getDeviceBrands,
  getDeviceCategories,
  getDeviceTemplates,
  updateDeviceTemplate,
} from '@/services/idc/deviceTemplate';
import DeviceTemplateFormModal from './components/DeviceTemplateFormModal';

interface TemplateEditorState {
  mode: 'create' | 'edit' | 'clone';
  template?: IDC.DeviceTemplate;
}

const categoryIcons: Record<string, React.ReactNode> = {
  switch: <Monitor size={16} style={{ color: '#1890ff' }} />,
  router: <Router size={16} style={{ color: '#52c41a' }} />,
  server: <Cpu size={16} style={{ color: '#722ed1' }} />,
  storage: <Database size={16} style={{ color: '#faad14' }} />,
  firewall: <Shield size={16} style={{ color: '#f5222d' }} />,
  loadbalancer: <Layers size={16} style={{ color: '#13c2c2' }} />,
  other: <HardDrive size={16} style={{ color: '#8c8c8c' }} />,
};

const categoryLabels: Record<string, string> = {
  switch: '交换机',
  router: '路由器',
  server: '服务器',
  storage: '存储',
  firewall: '防火墙',
  loadbalancer: '负载均衡',
  other: '其他',
};

const DeviceTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [editor, setEditor] = useState<TemplateEditorState>();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<IDC.DeviceTemplate>();
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [brands, setBrands] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getDeviceCategories().then((res) => {
      if (res.success) setCategories(res.data || []);
    });
    getDeviceBrands().then((res) => {
      if (res.success) setBrands(res.data || []);
    });
  }, []);

  const columns: ProColumns<IDC.DeviceTemplate>[] = [
    {
      title: '模板名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space>
          {categoryIcons[record.category] || categoryIcons.other}
          <span style={{ fontWeight: 500 }}>{record.name}</span>
          {record.isBuiltin && <Tag color="blue">内置</Tag>}
        </Space>
      ),
    },
    {
      title: '设备类型',
      dataIndex: 'category',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(categoryLabels).map(([k, v]) => [k, { text: v }]),
      ),
      render: (_, record) => (
        <Tag>{categoryLabels[record.category] || record.category}</Tag>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      width: 100,
      valueType: 'select',
      fieldProps: { options: brands },
    },
    {
      title: '型号',
      dataIndex: 'model',
      width: 180,
      copyable: true,
    },
    {
      title: 'U位高度',
      dataIndex: 'uHeight',
      width: 80,
      search: false,
      render: (_, record) => `${record.uHeight}U`,
    },
    {
      title: '端口配置',
      dataIndex: 'portGroups',
      width: 250,
      search: false,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.portGroups.map((pg, i) => (
            <Tag key={`${pg.portType}-${pg.name}-${i}`} color="purple">
              {pg.count}×{pg.portType} {pg.speed}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 200,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => {
            setCurrentRow(record);
            setDetailModalOpen(true);
          }}
        >
          详情
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<Edit3 size={14} />}
          disabled={record.isBuiltin}
          onClick={() => {
            setEditor({ mode: 'edit', template: record });
          }}
        >
          编辑
        </Button>,
        <Button
          key="clone"
          type="link"
          size="small"
          icon={<Copy size={14} />}
          onClick={() => {
            setEditor({ mode: 'clone', template: record });
          }}
        >
          克隆
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个设备模板吗？"
          disabled={record.isBuiltin}
          onConfirm={async () => {
            const res = await deleteDeviceTemplate(record.id);
            if (res.success) {
              message.success('删除成功');
              actionRef.current?.reload();
            } else {
              message.error(res.errorMessage || '删除失败');
            }
          }}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            disabled={record.isBuiltin}
          >
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '设备模板管理',
        subTitle: '管理设备类型、品牌、型号及端口配置',
      }}
    >
      <ProTable<IDC.DeviceTemplate>
        headerTitle="设备模板列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1400 }}
        request={async (params) => {
          const res = await getDeviceTemplates({
            current: params.current,
            pageSize: params.pageSize,
            category: params.category,
            brand: params.brand,
            name: params.name,
          });
          return {
            data: res.data || [],
            success: res.success,
            total: res.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setEditor({ mode: 'create' })}
          >
            新建设备模板
          </Button>,
        ]}
      />

      {editor && (
        <DeviceTemplateFormModal
          key={`${editor.mode}-${editor.template?.id ?? 'new'}`}
          mode={editor.mode}
          open
          categories={categories}
          template={editor.template}
          onOpenChange={(open) => {
            if (!open) setEditor(undefined);
          }}
          onSubmit={async (payload) => {
            const response =
              editor.mode === 'edit' && editor.template
                ? await updateDeviceTemplate(editor.template.id, payload)
                : await createDeviceTemplate(payload);
            if (!response.success) return false;

            message.success(
              editor.mode === 'edit'
                ? '更新成功'
                : editor.mode === 'clone'
                  ? '克隆成功'
                  : '创建成功',
            );
            actionRef.current?.reload();
            return true;
          }}
        />
      )}

      {/* 详情模态框 */}
      <Modal
        title="设备模板详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {currentRow && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="模板名称" span={2}>
                <Space>
                  {categoryIcons[currentRow.category]}
                  {currentRow.name}
                  {currentRow.isBuiltin && <Tag color="blue">内置模板</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="设备类型">
                {categoryLabels[currentRow.category]}
              </Descriptions.Item>
              <Descriptions.Item label="品牌">
                {currentRow.brand}
              </Descriptions.Item>
              <Descriptions.Item label="型号">
                {currentRow.model}
              </Descriptions.Item>
              <Descriptions.Item label="U位高度">
                {currentRow.uHeight}U
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {currentRow.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="端口配置" size="small" style={{ marginTop: 16 }}>
              <List
                dataSource={currentRow.portGroups}
                renderItem={(pg) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge
                          count={pg.count}
                          style={{ backgroundColor: '#722ed1' }}
                        />
                      }
                      title={pg.name || `${pg.portType}端口`}
                      description={`${pg.portType} | ${pg.speed}${pg.poe ? ' | 支持PoE' : ''}`}
                    />
                  </List.Item>
                )}
              />
            </Card>

            {currentRow.specs && Object.keys(currentRow.specs).length > 0 && (
              <Card title="规格参数" size="small" style={{ marginTop: 16 }}>
                <Descriptions column={2} size="small">
                  {Object.entries(currentRow.specs).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default DeviceTemplatePage;

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
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
} from '@/services/idc/deviceTemplate';

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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [_editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<IDC.DeviceTemplate>();
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [brands, setBrands] = useState<{ value: string; label: string }[]>([]);
  const [portGroups, setPortGroups] = useState<Omit<IDC.PortGroup, 'id'>[]>([
    { name: '', portType: 'RJ45', count: 1, speed: '1G' },
  ]);

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
            setCurrentRow(record);
            setPortGroups(record.portGroups);
            setEditModalOpen(true);
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
            setPortGroups(record.portGroups.map((pg) => ({ ...pg })));
            setCreateModalOpen(true);
            // 延迟设置表单值，让模态框先打开
            setTimeout(() => {
              message.info('已复制模板配置，请修改名称后保存');
            }, 300);
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

  const addPortGroup = () => {
    setPortGroups([
      ...portGroups,
      { name: '', portType: 'RJ45', count: 1, speed: '1G' },
    ]);
  };

  const removePortGroup = (index: number) => {
    setPortGroups(portGroups.filter((_, i) => i !== index));
  };

  const updatePortGroup = (index: number, field: string, value: any) => {
    const newGroups = [...portGroups];
    (newGroups[index] as any)[field] = value;
    setPortGroups(newGroups);
  };

  const portTypeOptions = [
    { value: 'RJ45', label: 'RJ45电口' },
    { value: 'SFP', label: 'SFP光口' },
    { value: 'SFP+', label: 'SFP+万兆光口' },
    { value: 'QSFP+', label: 'QSFP+ 40G光口' },
    { value: 'QSFP28', label: 'QSFP28 100G光口' },
    { value: 'FC', label: 'FC光纤通道' },
    { value: 'Console', label: 'Console控制台' },
    { value: 'Power', label: '电源接口' },
  ];

  const speedOptions = [
    { value: '100M', label: '100Mbps' },
    { value: '1G', label: '1Gbps' },
    { value: '10G', label: '10Gbps' },
    { value: '25G', label: '25Gbps' },
    { value: '40G', label: '40Gbps' },
    { value: '100G', label: '100Gbps' },
    { value: 'N/A', label: '不适用' },
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
            onClick={() => {
              setPortGroups([
                { name: '', portType: 'RJ45', count: 1, speed: '1G' },
              ]);
              setCreateModalOpen(true);
            }}
          >
            新建设备模板
          </Button>,
        ]}
      />

      {/* 新建模态框 */}
      <ModalForm
        title="新建设备模板"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width={700}
        onFinish={async (values) => {
          const data = {
            ...values,
            portGroups: portGroups.filter((pg) => pg.name && pg.count > 0),
          } as IDC.DeviceTemplateCreateParams;
          const res = await createDeviceTemplate(data);
          if (res.success) {
            message.success('创建成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
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
          placeholder="如：华为S5735-L48T4X-A"
          rules={[{ required: true, message: '请输入模板名称' }]}
        />
        <ProFormDigit
          name="uHeight"
          label="U位高度"
          initialValue={1}
          min={1}
          max={48}
          rules={[{ required: true, message: '请输入U位高度' }]}
        />
        <ProFormDigit
          name="maxPower"
          label="最高功率(W)"
          initialValue={0}
          min={0}
          max={10000}
          fieldProps={{ addonAfter: 'W' }}
        />

        <Card
          title="端口配置"
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Button
              type="link"
              onClick={addPortGroup}
              icon={<Plus size={14} />}
            >
              添加端口组
            </Button>
          }
        >
          {portGroups.map((pg, index) => (
            <div
              key={`${pg.portType}-${pg.name}-${index}`}
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                alignItems: 'center',
              }}
            >
              <input
                placeholder="端口组名称"
                value={pg.name}
                onChange={(e) => updatePortGroup(index, 'name', e.target.value)}
                style={{
                  width: 120,
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              />
              <select
                value={pg.portType}
                onChange={(e) =>
                  updatePortGroup(index, 'portType', e.target.value)
                }
                style={{
                  width: 130,
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              >
                {portTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="数量"
                value={pg.count}
                min={1}
                onChange={(e) =>
                  updatePortGroup(
                    index,
                    'count',
                    parseInt(e.target.value, 10) || 1,
                  )
                }
                style={{
                  width: 60,
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              />
              <select
                value={pg.speed}
                onChange={(e) =>
                  updatePortGroup(index, 'speed', e.target.value)
                }
                style={{
                  width: 100,
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              >
                {speedOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {portGroups.length > 1 && (
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => removePortGroup(index)}
                >
                  删除
                </Button>
              )}
            </div>
          ))}
        </Card>

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入描述信息"
        />
      </ModalForm>

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

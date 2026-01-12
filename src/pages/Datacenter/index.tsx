import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag, Space, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import {
    Building2,
    Plus,
    Edit3,
    Trash2,
    Eye,
    MapPin,
    Phone,
    User,
} from 'lucide-react';
import {
    getDatacenters,
    createDatacenter,
    updateDatacenter,
    deleteDatacenter
} from '@/services/idc';
import { history } from '@umijs/max';

const DatacenterPage: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<IDC.Datacenter>();

    const statusMap: Record<string, { color: string; text: string }> = {
        active: { color: 'success', text: '运行中' },
        maintenance: { color: 'warning', text: '维护中' },
        offline: { color: 'default', text: '已下线' },
    };

    const columns: ProColumns<IDC.Datacenter>[] = [
        {
            title: '机房名称',
            dataIndex: 'name',
            ellipsis: true,
            render: (_, record) => (
                <Space>
                    <Building2 size={16} style={{ color: '#1890ff' }} />
                    <span style={{ fontWeight: 500 }}>{record.name}</span>
                </Space>
            ),
        },
        {
            title: '机房编码',
            dataIndex: 'code',
            width: 150,
            copyable: true,
        },
        {
            title: '地址',
            dataIndex: 'address',
            ellipsis: true,
            search: false,
            render: (_, record) => (
                <Tooltip title={record.address}>
                    <Space>
                        <MapPin size={14} style={{ color: '#8c8c8c' }} />
                        {record.address}
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: '面积(㎡)',
            dataIndex: 'area',
            width: 100,
            search: false,
            sorter: true,
        },
        {
            title: '机柜使用',
            dataIndex: 'usedCabinets',
            width: 120,
            search: false,
            render: (_, record) => (
                <span>
                    <span style={{ color: '#1890ff', fontWeight: 500 }}>{record.usedCabinets}</span>
                    <span style={{ color: '#8c8c8c' }}> / {record.totalCabinets}</span>
                </span>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            valueType: 'select',
            valueEnum: {
                active: { text: '运行中', status: 'Success' },
                maintenance: { text: '维护中', status: 'Warning' },
                offline: { text: '已下线', status: 'Default' },
            },
            render: (_, record) => (
                <Tag color={statusMap[record.status]?.color}>
                    {statusMap[record.status]?.text}
                </Tag>
            ),
        },
        {
            title: '联系人',
            dataIndex: 'contact',
            width: 100,
            search: false,
            render: (_, record) => record.contact && (
                <Space>
                    <User size={14} style={{ color: '#8c8c8c' }} />
                    {record.contact}
                </Space>
            ),
        },
        {
            title: '联系电话',
            dataIndex: 'phone',
            width: 130,
            search: false,
            render: (_, record) => record.phone && (
                <Space>
                    <Phone size={14} style={{ color: '#8c8c8c' }} />
                    {record.phone}
                </Space>
            ),
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 170,
            valueType: 'dateTime',
            search: false,
            sorter: true,
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
                        history.push(`/datacenter3d?id=${record.id}`);
                    }}
                >
                    3D视图
                </Button>,
                <Button
                    key="edit"
                    type="link"
                    size="small"
                    icon={<Edit3 size={14} />}
                    onClick={() => {
                        setCurrentRow(record);
                        setEditModalOpen(true);
                    }}
                >
                    编辑
                </Button>,
                <Popconfirm
                    key="delete"
                    title="确定要删除这个数据中心吗？"
                    onConfirm={async () => {
                        const res = await deleteDatacenter(record.id);
                        if (res.success) {
                            message.success('删除成功');
                            actionRef.current?.reload();
                        }
                    }}
                >
                    <Button type="link" size="small" danger icon={<Trash2 size={14} />}>
                        删除
                    </Button>
                </Popconfirm>,
            ],
        },
    ];

    return (
        <PageContainer
            header={{
                title: '数据中心管理',
                subTitle: '管理IDC机房基础信息',
            }}
        >
            <ProTable<IDC.Datacenter>
                headerTitle="数据中心列表"
                actionRef={actionRef}
                rowKey="id"
                columns={columns}
                scroll={{ x: 1300 }}
                request={async (params, _sort) => {
                    const res = await getDatacenters({
                        current: params.current,
                        pageSize: params.pageSize,
                        name: params.name,
                        status: params.status,
                        code: params.code,
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
                        onClick={() => setCreateModalOpen(true)}
                    >
                        新建数据中心
                    </Button>,
                ]}
            />

            {/* 新建模态框 */}
            <ModalForm
                title="新建数据中心"
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                width={600}
                onFinish={async (values) => {
                    const res = await createDatacenter(values as IDC.DatacenterCreateParams);
                    if (res.success) {
                        message.success('创建成功');
                        actionRef.current?.reload();
                        return true;
                    }
                    return false;
                }}
            >
                <ProFormText
                    name="name"
                    label="机房名称"
                    placeholder="请输入机房名称"
                    rules={[{ required: true, message: '请输入机房名称' }]}
                />
                <ProFormText
                    name="code"
                    label="机房编码"
                    placeholder="如：BJ-YZ-DC01"
                    rules={[{ required: true, message: '请输入机房编码' }]}
                />
                <ProFormText
                    name="address"
                    label="地址"
                    placeholder="请输入详细地址"
                    rules={[{ required: true, message: '请输入地址' }]}
                />
                <ProFormText
                    name="area"
                    label="面积(平方米)"
                    placeholder="请输入面积"
                    fieldProps={{ type: 'number' }}
                />
                <ProFormText
                    name="contact"
                    label="联系人"
                    placeholder="请输入联系人姓名"
                />
                <ProFormText
                    name="phone"
                    label="联系电话"
                    placeholder="请输入联系电话"
                />
                <ProFormTextArea
                    name="description"
                    label="描述"
                    placeholder="请输入描述信息"
                />
            </ModalForm>

            {/* 编辑模态框 */}
            <ModalForm
                title="编辑数据中心"
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                width={600}
                initialValues={currentRow}
                onFinish={async (values) => {
                    if (!currentRow) return false;
                    const res = await updateDatacenter(currentRow.id, values);
                    if (res.success) {
                        message.success('更新成功');
                        actionRef.current?.reload();
                        return true;
                    }
                    return false;
                }}
            >
                <ProFormText
                    name="name"
                    label="机房名称"
                    rules={[{ required: true, message: '请输入机房名称' }]}
                />
                <ProFormText
                    name="code"
                    label="机房编码"
                    rules={[{ required: true, message: '请输入机房编码' }]}
                />
                <ProFormText
                    name="address"
                    label="地址"
                    rules={[{ required: true, message: '请输入地址' }]}
                />
                <ProFormText
                    name="area"
                    label="面积(平方米)"
                    fieldProps={{ type: 'number' }}
                />
                <ProFormSelect
                    name="status"
                    label="状态"
                    options={[
                        { value: 'active', label: '运行中' },
                        { value: 'maintenance', label: '维护中' },
                        { value: 'offline', label: '已下线' },
                    ]}
                />
                <ProFormText name="contact" label="联系人" />
                <ProFormText name="phone" label="联系电话" />
                <ProFormTextArea name="description" label="描述" />
            </ModalForm>
        </PageContainer>
    );
};

export default DatacenterPage;

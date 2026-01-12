import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect, ProFormDigit, } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag, Space, ColorPicker, Alert, Divider } from 'antd';
import { useRef, useState, useEffect, useMemo } from 'react';
import {
    Cable,
    Plus,
    Edit3,
    Trash2,
    ArrowRight,
    Monitor,
} from 'lucide-react';
import {
    getConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    getConnectionTypes,
    getCableTypes,
} from '@/services/idc/connection';
import { getDevices } from '@/services/idc/device';
import { getPortsByDevice } from '@/services/idc/port';

// 端口选择器组件
const PortSelector: React.FC<{
    deviceId: string | undefined;
    value?: string;
    onChange?: (value: string) => void;
    label: string;
    excludePortId?: string;  // 排除已选端口
}> = ({ deviceId, value, onChange, label, excludePortId }) => {
    const [ports, setPorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (deviceId) {
            setLoading(true);
            getPortsByDevice(deviceId).then(res => {
                if (res.success) {
                    setPorts(res.data || []);
                }
            }).finally(() => setLoading(false));
        } else {
            setPorts([]);
        }
    }, [deviceId]);

    // 可用端口（未占用 且 非已排除端口）
    const availablePorts = useMemo(() => {
        return ports.filter(p =>
            p.status !== 'connected' &&
            p.id !== excludePortId
        );
    }, [ports, excludePortId]);

    if (!deviceId) {
        return <Alert message={`请先选择${label}`} type="info" showIcon style={{ marginBottom: 16 }} />;
    }

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{label}端口 <span style={{ color: '#f5222d' }}>*</span></div>
            {loading ? (
                <div>加载端口列表...</div>
            ) : (
                <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                        共 {ports.length} 个端口，可用 {availablePorts.length} 个
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                        {ports.map(port => {
                            const isSelected = value === port.id;
                            const isOccupied = port.status === 'connected';
                            const isExcluded = port.id === excludePortId;
                            const canSelect = !isOccupied && !isExcluded;

                            return (
                                <div
                                    key={port.id}
                                    onClick={() => canSelect && onChange?.(port.id)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        cursor: canSelect ? 'pointer' : 'not-allowed',
                                        backgroundColor: isSelected ? '#1890ff' : isOccupied ? '#fff1f0' : '#f5f5f5',
                                        color: isSelected ? '#fff' : isOccupied ? '#999' : '#333',
                                        border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                        opacity: isExcluded ? 0.5 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                    title={isOccupied ? '端口已被占用' : port.name}
                                >
                                    <div style={{ fontWeight: 500 }}>{port.name}</div>
                                    <div style={{ fontSize: 10, color: isSelected ? '#fff' : '#8c8c8c' }}>
                                        {port.type} | {port.speed}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {value && (
                        <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                            ✓ 已选择: {ports.find(p => p.id === value)?.name}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ConnectionPage: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<IDC.Connection>();
    const [devices, setDevices] = useState<any[]>([]);
    const [connectionTypes, setConnectionTypes] = useState<{ value: string; label: string; color: string }[]>([]);
    const [cableTypes, setCableTypes] = useState<{ value: string; label: string }[]>([]);
    const [cableColor, setCableColor] = useState('#3498db');

    // 级联选择状态
    const [selectedSourceDevice, setSelectedSourceDevice] = useState<string>();
    const [selectedTargetDevice, setSelectedTargetDevice] = useState<string>();
    const [selectedSourcePort, setSelectedSourcePort] = useState<string>();
    const [selectedTargetPort, setSelectedTargetPort] = useState<string>();

    useEffect(() => {
        getDevices({ pageSize: 1000 }).then(res => {
            if (res.success) setDevices(res.data || []);
        });
        getConnectionTypes().then(res => {
            if (res.success) setConnectionTypes(res.data || []);
        });
        getCableTypes().then(res => {
            if (res.success) setCableTypes(res.data || []);
        });
    }, []);

    const statusMap: Record<string, { color: string; text: string }> = {
        active: { color: 'success', text: '正常' },
        inactive: { color: 'default', text: '未激活' },
        faulty: { color: 'error', text: '故障' },
    };

    const resetCreateForm = () => {
        setSelectedSourceDevice(undefined);
        setSelectedTargetDevice(undefined);
        setSelectedSourcePort(undefined);
        setSelectedTargetPort(undefined);
        setCableColor('#3498db');
    };

    const columns: ProColumns<IDC.Connection>[] = [
        {
            title: '线缆编号',
            dataIndex: 'cableNumber',
            width: 150,
            copyable: true,
            render: (_, record) => (
                <Space>
                    <Cable size={16} style={{ color: record.cableColor || '#3498db' }} />
                    <span style={{ fontWeight: 500 }}>{record.cableNumber}</span>
                </Space>
            ),
        },
        {
            title: '连线类型',
            dataIndex: 'connectionType',
            width: 100,
            valueType: 'select',
            valueEnum: Object.fromEntries(
                connectionTypes.map(ct => [ct.value, { text: ct.label }])
            ),
            render: (_, record) => {
                const ct = connectionTypes.find(c => c.value === record.connectionType);
                return <Tag color={ct?.color}>{ct?.label || record.connectionType}</Tag>;
            },
        },
        {
            title: '线缆类型',
            dataIndex: 'cableType',
            width: 120,
            valueType: 'select',
            valueEnum: Object.fromEntries(
                cableTypes.map(ct => [ct.value, { text: ct.label }])
            ),
            render: (_, record) => {
                const ct = cableTypes.find(c => c.value === record.cableType);
                return ct?.label || record.cableType;
            },
        },
        {
            title: '源设备',
            dataIndex: 'sourceDeviceId',
            width: 180,
            search: false,
            render: (_, record) => {
                const dev = devices.find(d => d.id === record.sourceDeviceId);
                return (
                    <Space>
                        <Monitor size={14} style={{ color: '#8c8c8c' }} />
                        <span>{dev?.name || record.sourceDeviceId}</span>
                    </Space>
                );
            },
        },
        {
            title: '',
            width: 40,
            search: false,
            render: () => <ArrowRight size={16} style={{ color: '#8c8c8c' }} />,
        },
        {
            title: '目标设备',
            dataIndex: 'targetDeviceId',
            width: 180,
            search: false,
            render: (_, record) => {
                const dev = devices.find(d => d.id === record.targetDeviceId);
                return (
                    <Space>
                        <Monitor size={14} style={{ color: '#8c8c8c' }} />
                        <span>{dev?.name || record.targetDeviceId}</span>
                    </Space>
                );
            },
        },
        {
            title: '长度(m)',
            dataIndex: 'cableLength',
            width: 80,
            search: false,
            render: (_, record) => record.cableLength ? `${record.cableLength}m` : '-',
        },
        {
            title: '颜色',
            dataIndex: 'cableColor',
            width: 60,
            search: false,
            render: (_, record) => (
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: record.cableColor || '#3498db',
                        border: '1px solid #d9d9d9',
                    }}
                />
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            valueType: 'select',
            valueEnum: {
                active: { text: '正常', status: 'Success' },
                inactive: { text: '未激活', status: 'Default' },
                faulty: { text: '故障', status: 'Error' },
            },
            render: (_, record) => (
                <Tag color={statusMap[record.status]?.color}>
                    {statusMap[record.status]?.text}
                </Tag>
            ),
        },
        {
            title: '操作',
            valueType: 'option',
            width: 120,
            fixed: 'right',
            render: (_, record) => [
                <Button
                    key="edit"
                    type="link"
                    size="small"
                    icon={<Edit3 size={14} />}
                    onClick={() => {
                        setCurrentRow(record);
                        setCableColor(record.cableColor || '#3498db');
                        setEditModalOpen(true);
                    }}
                >
                    编辑
                </Button>,
                <Popconfirm
                    key="delete"
                    title="确定要删除这条连线吗？"
                    onConfirm={async () => {
                        const res = await deleteConnection(record.id);
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
                title: '连线管理',
                subTitle: '管理设备之间的物理连线',
            }}
        >
            <ProTable<IDC.Connection>
                headerTitle="连线列表"
                actionRef={actionRef}
                rowKey="id"
                columns={columns}
                scroll={{ x: 1400 }}
                request={async (params) => {
                    const res = await getConnections({
                        current: params.current,
                        pageSize: params.pageSize,
                        connectionType: params.connectionType,
                        cableType: params.cableType,
                        status: params.status,
                        cableNumber: params.cableNumber,
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
                            resetCreateForm();
                            setCreateModalOpen(true);
                        }}
                    >
                        新建连线
                    </Button>,
                ]}
            />

            {/* 新建模态框 - 带端口级联选择 */}
            <ModalForm
                title="新建连线"
                open={createModalOpen}
                onOpenChange={(open) => {
                    setCreateModalOpen(open);
                    if (!open) resetCreateForm();
                }}
                width={800}
                onFinish={async (values) => {
                    if (!selectedSourcePort || !selectedTargetPort) {
                        message.error('请选择源端口和目标端口');
                        return false;
                    }
                    const data = {
                        ...values,
                        sourcePortId: selectedSourcePort,
                        targetPortId: selectedTargetPort,
                        cableColor,
                    } as IDC.ConnectionCreateParams;
                    const res = await createConnection(data);
                    if (res.success) {
                        message.success('创建成功');
                        actionRef.current?.reload();
                        return true;
                    }
                    return false;
                }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* 左侧：连线基本信息 */}
                    <div>
                        <ProFormText
                            name="cableNumber"
                            label="线缆编号"
                            placeholder="如：BJ-FIBER-001"
                            rules={[{ required: true, message: '请输入线缆编号' }]}
                        />
                        <ProFormSelect
                            name="connectionType"
                            label="连线类型"
                            options={connectionTypes.map(ct => ({ value: ct.value, label: ct.label }))}
                            rules={[{ required: true, message: '请选择连线类型' }]}
                        />
                        <ProFormSelect
                            name="cableType"
                            label="线缆类型"
                            options={cableTypes}
                            rules={[{ required: true, message: '请选择线缆类型' }]}
                        />
                        <ProFormDigit
                            name="cableLength"
                            label="线缆长度(米)"
                            min={0.1}
                            fieldProps={{ step: 0.5 }}
                        />
                        <div style={{ marginBottom: 24 }}>
                            <span style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>线缆颜色</span>
                            <ColorPicker
                                value={cableColor}
                                onChange={(color) => setCableColor(color.toHexString())}
                            />
                        </div>
                        <ProFormTextArea
                            name="description"
                            label="描述"
                            placeholder="请输入描述信息"
                        />
                    </div>

                    {/* 右侧：设备和端口选择 */}
                    <div>
                        <Divider orientation="left">源端</Divider>
                        <ProFormSelect
                            name="sourceDeviceId"
                            label="源设备"
                            options={devices.map(d => ({
                                value: d.id,
                                label: `${d.name} (${d.managementIp || d.assetCode})`
                            }))}
                            showSearch
                            rules={[{ required: true, message: '请选择源设备' }]}
                            fieldProps={{
                                onChange: (value: string) => {
                                    setSelectedSourceDevice(value);
                                    setSelectedSourcePort(undefined);
                                },
                            }}
                        />
                        <PortSelector
                            deviceId={selectedSourceDevice}
                            value={selectedSourcePort}
                            onChange={setSelectedSourcePort}
                            label="源设备"
                            excludePortId={selectedTargetPort}
                        />

                        <Divider orientation="left">目标端</Divider>
                        <ProFormSelect
                            name="targetDeviceId"
                            label="目标设备"
                            options={devices.map(d => ({
                                value: d.id,
                                label: `${d.name} (${d.managementIp || d.assetCode})`
                            }))}
                            showSearch
                            rules={[{ required: true, message: '请选择目标设备' }]}
                            fieldProps={{
                                onChange: (value: string) => {
                                    setSelectedTargetDevice(value);
                                    setSelectedTargetPort(undefined);
                                },
                            }}
                        />
                        <PortSelector
                            deviceId={selectedTargetDevice}
                            value={selectedTargetPort}
                            onChange={setSelectedTargetPort}
                            label="目标设备"
                            excludePortId={selectedSourcePort}
                        />
                    </div>
                </div>
            </ModalForm>

            {/* 编辑模态框 */}
            <ModalForm
                title="编辑连线"
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                width={600}
                initialValues={currentRow}
                onFinish={async (values) => {
                    if (!currentRow) return false;
                    const data = {
                        ...values,
                        cableColor,
                    };
                    const res = await updateConnection(currentRow.id, data);
                    if (res.success) {
                        message.success('更新成功');
                        actionRef.current?.reload();
                        return true;
                    }
                    return false;
                }}
            >
                <ProFormText name="cableNumber" label="线缆编号" rules={[{ required: true }]} />
                <ProFormSelect
                    name="connectionType"
                    label="连线类型"
                    options={connectionTypes.map(ct => ({ value: ct.value, label: ct.label }))}
                />
                <ProFormSelect name="cableType" label="线缆类型" options={cableTypes} />
                <ProFormSelect
                    name="status"
                    label="状态"
                    options={[
                        { value: 'active', label: '正常' },
                        { value: 'inactive', label: '未激活' },
                        { value: 'faulty', label: '故障' },
                    ]}
                />
                <ProFormDigit name="cableLength" label="线缆长度(米)" min={0.1} />
                <div style={{ marginBottom: 24 }}>
                    <span style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>线缆颜色</span>
                    <ColorPicker
                        value={cableColor}
                        onChange={(color) => setCableColor(color.toHexString())}
                    />
                </div>
                <ProFormTextArea name="description" label="描述" />
            </ModalForm>
        </PageContainer>
    );
};

export default ConnectionPage;

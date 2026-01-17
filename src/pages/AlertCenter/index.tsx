import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Box,
  Building2,
  Check,
  CheckCheck,
  Clock,
  Info,
  Server,
  Settings,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  acknowledgeAlert,
  batchAcknowledgeAlerts,
  getAlertStats,
  getAlerts,
  resolveAlert,
} from '@/services/idc/alert';
import styles from './index.less';

const { TextArea } = Input;

// 告警级别图标
const levelIcons: Record<string, React.ReactNode> = {
  critical: <XCircle size={18} className={styles.levelCritical} />,
  error: <AlertCircle size={18} className={styles.levelError} />,
  warning: <AlertTriangle size={18} className={styles.levelWarning} />,
  info: <Info size={18} className={styles.levelInfo} />,
};

// 告警级别配置
const levelConfig: Record<string, { color: string; text: string }> = {
  critical: { color: 'error', text: '紧急' },
  error: { color: 'volcano', text: '错误' },
  warning: { color: 'warning', text: '警告' },
  info: { color: 'processing', text: '提示' },
};

// 告警类型配置
const typeConfig: Record<string, string> = {
  temperature: '温度告警',
  humidity: '湿度告警',
  power: '功率告警',
  device_status: '设备状态',
  port_status: '端口状态',
  capacity: '容量预警',
};

const AlertCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<IDC.AlertDetail[]>([]);
  const [stats, setStats] = useState<IDC.AlertStats | null>(null);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedAck, setSelectedAck] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [ackModalVisible, setAckModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<IDC.AlertDetail | null>(
    null,
  );
  const [ackNotes, setAckNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [current, pageSize, selectedLevel, selectedAck, selectedType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertRes, statsRes] = await Promise.all([
        getAlerts({
          current,
          pageSize,
          level: selectedLevel as IDC.Alert['level'] | undefined,
          acknowledged: selectedAck === '' ? undefined : selectedAck === 'true',
          type: selectedType || undefined,
        }),
        getAlertStats(),
      ]);

      if (alertRes.success && alertRes.data) {
        setAlerts(alertRes.data);
        setTotal(alertRes.total || 0);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alert: IDC.AlertDetail) => {
    setCurrentAlert(alert);
    setAckNotes('');
    setAckModalVisible(true);
  };

  const handleAckSubmit = async () => {
    if (!currentAlert) return;

    setSubmitting(true);
    try {
      const res = await acknowledgeAlert(currentAlert.id, ackNotes);
      if (res.success) {
        message.success('告警已确认');
        setAckModalVisible(false);
        fetchData();
      }
    } catch (_error) {
      message.error('确认失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (alert: IDC.AlertDetail) => {
    try {
      const res = await resolveAlert(alert.id);
      if (res.success) {
        message.success('告警已解决');
        fetchData();
      }
    } catch (_error) {
      message.error('操作失败');
    }
  };

  const handleBatchAcknowledge = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要确认的告警');
      return;
    }

    try {
      const res = await batchAcknowledgeAlerts(selectedRows);
      if (res.success) {
        message.success(`已批量确认 ${selectedRows.length} 条告警`);
        setSelectedRows([]);
        fetchData();
      }
    } catch (_error) {
      message.error('批量确认失败');
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

    return date.toLocaleString('zh-CN');
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tooltip title={levelConfig[level]?.text}>{levelIcons[level]}</Tooltip>
      ),
    },
    {
      title: '告警内容',
      dataIndex: 'message',
      key: 'message',
      render: (_: any, record: IDC.AlertDetail) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.message}</div>
          <div
            style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginTop: 4 }}
          >
            <Space size={16}>
              {record.deviceName && (
                <span>
                  <Server size={12} /> {record.deviceName}
                </span>
              )}
              {record.cabinetName && (
                <span>
                  <Box size={12} /> {record.cabinetName}
                </span>
              )}
              {record.datacenterName && (
                <span>
                  <Building2 size={12} /> {record.datacenterName}
                </span>
              )}
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{typeConfig[type] || type}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => (
        <Tooltip title={new Date(time).toLocaleString('zh-CN')}>
          <span>
            <Clock size={12} /> {formatTime(time)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      width: 100,
      render: (ack: boolean, record: IDC.AlertDetail) => {
        if (record.resolvedAt) {
          return (
            <Tag color="success" icon={<CheckCheck size={12} />}>
              已解决
            </Tag>
          );
        }
        return ack ? (
          <Tooltip
            title={`确认人: ${record.acknowledgedBy} | ${formatTime(record.acknowledgedAt || '')}`}
          >
            <Tag color="processing" icon={<Check size={12} />}>
              已确认
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="error">未确认</Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: IDC.AlertDetail) => (
        <Space>
          {!record.acknowledged && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAcknowledge(record)}
            >
              确认
            </Button>
          )}
          {record.acknowledged && !record.resolvedAt && (
            <Popconfirm
              title="确认已解决该告警？"
              onConfirm={() => handleResolve(record)}
            >
              <Button type="link" size="small">
                解决
              </Button>
            </Popconfirm>
          )}
          <Button type="link" size="small">
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.alertCenterPage}
      extra={[
        <Button
          key="rules"
          icon={<Settings size={14} />}
          onClick={() => history.push('/monitor/alert/rules')}
        >
          告警规则
        </Button>,
        <Button
          key="history"
          onClick={() => history.push('/monitor/alert/history')}
        >
          历史记录
        </Button>,
      ]}
    >
      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.critical}`}>
            <XCircle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.critical || 0}</div>
            <div className={styles.statLabel}>紧急告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.error}`}>
            <AlertCircle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.error || 0}</div>
            <div className={styles.statLabel}>错误告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.warning}`}>
            <AlertTriangle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.warning || 0}</div>
            <div className={styles.statLabel}>警告告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.info}`}>
            <Info className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.unacknowledged || 0}</div>
            <div className={styles.statLabel}>待处理</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选和列表 */}
      <Card
        title={
          <span>
            <Bell size={16} /> 告警列表
          </span>
        }
        className={styles.alertList}
        extra={
          <Space>
            <Select
              value={selectedLevel}
              onChange={setSelectedLevel}
              style={{ width: 120 }}
              placeholder="告警级别"
              allowClear
            >
              <Select.Option value="critical">紧急</Select.Option>
              <Select.Option value="error">错误</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="info">提示</Select.Option>
            </Select>
            <Select
              value={selectedAck}
              onChange={setSelectedAck}
              style={{ width: 120 }}
              placeholder="处理状态"
              allowClear
            >
              <Select.Option value="false">未确认</Select.Option>
              <Select.Option value="true">已确认</Select.Option>
            </Select>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 120 }}
              placeholder="告警类型"
              allowClear
            >
              {Object.entries(typeConfig).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            {selectedRows.length > 0 && (
              <Button type="primary" onClick={handleBatchAcknowledge}>
                批量确认 ({selectedRows.length})
              </Button>
            )}
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (keys) => setSelectedRows(keys as string[]),
            getCheckboxProps: (record) => ({
              disabled: record.acknowledged,
            }),
          }}
          rowClassName={(record) =>
            !record.acknowledged ? styles.unacknowledged : ''
          }
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* 确认告警弹窗 */}
      <Modal
        title="确认告警"
        open={ackModalVisible}
        onCancel={() => setAckModalVisible(false)}
        onOk={handleAckSubmit}
        confirmLoading={submitting}
      >
        {currentAlert && (
          <div>
            <p>
              <strong>告警内容：</strong>
              {currentAlert.message}
            </p>
            {currentAlert.deviceName && (
              <p>
                <strong>设备：</strong>
                {currentAlert.deviceName}
              </p>
            )}
            <p>
              <strong>时间：</strong>
              {new Date(currentAlert.createdAt).toLocaleString('zh-CN')}
            </p>
            <div style={{ marginTop: 16 }}>
              <p>
                <strong>处理备注：</strong>
              </p>
              <TextArea
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="请输入处理备注（可选）"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AlertCenter;

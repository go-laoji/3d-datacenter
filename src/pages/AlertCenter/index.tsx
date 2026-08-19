import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import {
  Alert,
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
import { useEffect, useRef, useState } from 'react';
import {
  acknowledgeAlert,
  batchAcknowledgeAlerts,
  batchResolveAlerts,
  getAlertStats,
  getAlerts,
  resolveAlert,
} from '@/services/idc/alert';
import AlertDetailDrawer from './AlertDetailDrawer';
import {
  alertLevelConfig,
  alertTypeLabels,
  getAlertActionableIds,
} from './alertPresentation';
import styles from './index.less';

const { TextArea } = Input;

// 告警级别图标
const levelIcons: Record<string, React.ReactNode> = {
  critical: <XCircle size={18} className={styles.levelCritical} />,
  error: <AlertCircle size={18} className={styles.levelError} />,
  warning: <AlertTriangle size={18} className={styles.levelWarning} />,
  info: <Info size={18} className={styles.levelInfo} />,
};

const showBatchResult = (
  actionLabel: string,
  result: IDC.BatchAlertOperationResult,
) => {
  if (result.failed.length === 0) {
    message.success(
      `已批量${actionLabel} ${result.succeededIds.length} 条告警`,
    );
    return;
  }
  Modal.warning({
    title: `批量${actionLabel}部分完成`,
    content: (
      <div>
        <p>
          成功 {result.succeededIds.length} 条，失败 {result.failed.length} 条。
        </p>
        <ul style={{ paddingLeft: 20 }}>
          {result.failed.map((item) => (
            <li key={item.id}>
              {item.id}：{item.reason}
            </li>
          ))}
        </ul>
      </div>
    ),
  });
};

// 告警级别配置
const AlertCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedDatacenterId = searchParams.get('datacenterId') || undefined;
  const requestedAcknowledged = searchParams.get('acknowledged');
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
  const [detailAlert, setDetailAlert] = useState<IDC.AlertDetail>();
  const [ackNotes, setAckNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { acknowledgeableIds, resolvableIds } = getAlertActionableIds(
    alerts,
    selectedRows,
  );

  useEffect(() => {
    setSelectedAck(
      requestedAcknowledged === 'true' || requestedAcknowledged === 'false'
        ? requestedAcknowledged
        : '',
    );
    setCurrent(1);
    setSelectedRows([]);
  }, [requestedAcknowledged, requestedDatacenterId]);

  // 自动刷新（30秒轮询）
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchData(true); // 静默刷新
    }, 30000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [
    current,
    pageSize,
    requestedDatacenterId,
    selectedLevel,
    selectedAck,
    selectedType,
  ]);

  useEffect(() => {
    fetchData();
  }, [
    current,
    pageSize,
    requestedDatacenterId,
    selectedLevel,
    selectedAck,
    selectedType,
  ]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [alertRes, statsRes] = await Promise.all([
        getAlerts({
          current,
          pageSize,
          level: selectedLevel as IDC.Alert['level'] | undefined,
          acknowledged: selectedAck === '' ? undefined : selectedAck === 'true',
          type: selectedType || undefined,
          datacenterId: requestedDatacenterId,
        }),
        getAlertStats(),
      ]);

      if (alertRes.success && alertRes.data) {
        setAlerts(alertRes.data);
        setTotal(alertRes.total ?? 0);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      if (!silent) message.error('获取告警数据失败');
    } finally {
      if (!silent) setLoading(false);
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
        void fetchData();
      } else {
        message.error(res.errorMessage || '确认失败');
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
        void fetchData();
      } else {
        message.error(res.errorMessage || '操作失败');
      }
    } catch (_error) {
      message.error('操作失败');
    }
  };

  const handleBatchAcknowledge = async () => {
    if (acknowledgeableIds.length === 0) {
      message.warning('请选择要确认的告警');
      return;
    }

    try {
      const res = await batchAcknowledgeAlerts(acknowledgeableIds);
      if (res.success && res.data) {
        showBatchResult('确认', res.data);
        setSelectedRows([]);
        void fetchData();
      }
    } catch (_error) {
      message.error('批量确认失败');
    }
  };

  const handleBatchResolve = async () => {
    if (resolvableIds.length === 0) {
      message.warning('请选择已确认且未解决的告警');
      return;
    }
    try {
      const res = await batchResolveAlerts(resolvableIds);
      if (res.success && res.data) {
        showBatchResult('解决', res.data);
        setSelectedRows([]);
        void fetchData();
      }
    } catch (_error) {
      message.error('批量解决失败');
    }
  };

  // 格式化上次刷新时间
  const formatLastRefresh = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000);
    if (diff < 5) return '刚刚更新';
    if (diff < 60) return `${diff}秒前更新`;
    return `${Math.floor(diff / 60)}分钟前更新`;
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
        <Tooltip title={alertLevelConfig[level as IDC.Alert['level']]?.text}>
          {levelIcons[level]}
        </Tooltip>
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
      render: (type: string) => <Tag>{alertTypeLabels[type] || type}</Tag>,
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
          <Button
            type="link"
            size="small"
            onClick={() => setDetailAlert(record)}
          >
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
      {(requestedDatacenterId || requestedAcknowledged !== null) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            requestedDatacenterId
              ? `已恢复站点上下文 ${requestedDatacenterId}`
              : requestedAcknowledged === 'false'
                ? '已定位全部待确认告警'
                : '已按确认状态筛选告警'
          }
          description="告警列表已按 URL 上下文筛选，可继续叠加级别和类型条件。"
          action={
            <Button size="small" onClick={() => history.push('/monitor/alert')}>
              清除定位
            </Button>
          }
        />
      )}
      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.critical}`}>
            <XCircle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.critical ?? '--'}</div>
            <div className={styles.statLabel}>紧急告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.error}`}>
            <AlertCircle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.error ?? '--'}</div>
            <div className={styles.statLabel}>错误告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.warning}`}>
            <AlertTriangle className={styles.statIcon} />
            <div className={styles.statValue}>{stats?.warning ?? '--'}</div>
            <div className={styles.statLabel}>警告告警</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className={`${styles.statCard} ${styles.info}`}>
            <Info className={styles.statIcon} />
            <div className={styles.statValue}>
              {stats?.unacknowledged ?? '--'}
            </div>
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
              onChange={(value) => {
                setCurrent(1);
                setSelectedRows([]);
                setSelectedLevel(value || '');
              }}
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
              onChange={(value) => {
                setCurrent(1);
                setSelectedRows([]);
                setSelectedAck(value || '');
              }}
              style={{ width: 120 }}
              placeholder="处理状态"
              allowClear
            >
              <Select.Option value="false">未确认</Select.Option>
              <Select.Option value="true">已确认</Select.Option>
            </Select>
            <Select
              value={selectedType}
              onChange={(value) => {
                setCurrent(1);
                setSelectedRows([]);
                setSelectedType(value || '');
              }}
              style={{ width: 120 }}
              placeholder="告警类型"
              allowClear
            >
              {Object.entries(alertTypeLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            {selectedRows.length > 0 && (
              <>
                <Button
                  type="primary"
                  disabled={acknowledgeableIds.length === 0}
                  onClick={handleBatchAcknowledge}
                >
                  批量确认 ({acknowledgeableIds.length})
                </Button>
                <Button
                  disabled={resolvableIds.length === 0}
                  onClick={handleBatchResolve}
                >
                  批量解决 ({resolvableIds.length})
                </Button>
              </>
            )}
            <Tooltip title={formatLastRefresh()}>
              <Button
                icon={<Clock size={14} />}
                onClick={() => fetchData()}
                size="small"
                type="text"
              >
                {formatLastRefresh()}
              </Button>
            </Tooltip>
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
              disabled: Boolean(record.resolvedAt),
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
              setSelectedRows([]);
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

      <AlertDetailDrawer
        alert={detailAlert}
        onClose={() => setDetailAlert(undefined)}
        onAcknowledge={(alert) => {
          setDetailAlert(undefined);
          handleAcknowledge(alert);
        }}
        onResolve={(alert) => {
          setDetailAlert(undefined);
          handleResolve(alert);
        }}
      />
    </PageContainer>
  );
};

export default AlertCenter;

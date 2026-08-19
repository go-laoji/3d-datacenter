import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { Dayjs } from 'dayjs';
import {
  ArrowLeft,
  Box,
  CheckCheck,
  Clock,
  Search,
  Server,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAlerts } from '@/services/idc/alert';
import { alertLevelConfig, alertTypeLabels } from './alertPresentation';
import styles from './index.less';

const { RangePicker } = DatePicker;

const AlertHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<IDC.AlertDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    fetchData();
  }, [
    current,
    pageSize,
    selectedLevel,
    selectedType,
    appliedKeyword,
    dateRange,
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAlerts({
        current,
        pageSize,
        level: selectedLevel as IDC.Alert['level'] | undefined,
        type: selectedType || undefined,
        keyword: appliedKeyword || undefined,
        startTime: dateRange?.[0].toISOString(),
        endTime: dateRange?.[1].toISOString(),
      });

      if (res.success && res.data) {
        setAlerts(res.data);
        setTotal(res.total ?? 0);
      }
    } catch (_error) {
      message.error('获取告警历史失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => (
        <span>
          <Clock size={12} style={{ marginRight: 4 }} />
          {new Date(time).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const cfg = alertLevelConfig[level as IDC.Alert['level']] || {
          color: 'default',
          text: level,
        };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{alertTypeLabels[type] || type}</Tag>,
    },
    {
      title: '告警内容',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '来源',
      key: 'source',
      width: 200,
      render: (_: any, record: IDC.AlertDetail) => (
        <Space direction="vertical" size={0}>
          {record.deviceName && (
            <span style={{ fontSize: 12 }}>
              <Server size={12} /> {record.deviceName}
            </span>
          )}
          {record.cabinetName && (
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              <Box size={12} /> {record.cabinetName}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '处理状态',
      key: 'status',
      width: 150,
      render: (_: any, record: IDC.AlertDetail) => {
        if (record.resolvedAt) {
          return (
            <div>
              <Tag color="success" icon={<CheckCheck size={12} />}>
                已解决
              </Tag>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.45)',
                  marginTop: 4,
                }}
              >
                {record.resolvedBy} |{' '}
                {new Date(record.resolvedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          );
        }
        if (record.acknowledged) {
          return (
            <div>
              <Tag color="processing">已确认</Tag>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.45)',
                  marginTop: 4,
                }}
              >
                {record.acknowledgedBy}
              </div>
            </div>
          );
        }
        return <Tag color="error">未处理</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <PageContainer
      className={styles.alertCenterPage}
      header={{
        title: '告警历史记录',
        breadcrumb: {},
      }}
      extra={[
        <Button
          key="back"
          icon={<ArrowLeft size={14} />}
          onClick={() => history.push('/monitor/alert')}
        >
          返回告警中心
        </Button>,
      ]}
    >
      <Card className={styles.historyTable}>
        {/* 筛选栏 */}
        <div className={styles.filterBar}>
          <Space wrap>
            <Input.Search
              placeholder="搜索告警内容/设备/机柜"
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => {
                setCurrent(1);
                setAppliedKeyword(value.trim());
              }}
              enterButton={<Search size={14} />}
            />
            <Select
              value={selectedLevel}
              onChange={(value) => {
                setCurrent(1);
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
              value={selectedType}
              onChange={(value) => {
                setCurrent(1);
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
            <RangePicker
              value={dateRange}
              placeholder={['开始时间', '结束时间']}
              showTime
              onChange={(value) => {
                setCurrent(1);
                setDateRange(value as [Dayjs, Dayjs] | null);
              }}
            />
          </Space>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size);
            },
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default AlertHistory;

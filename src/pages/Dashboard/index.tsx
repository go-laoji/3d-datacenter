import { Area } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  List,
  message,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  Activity,
  ArrowRight,
  Bell,
  Cable,
  CheckCircle,
  Droplets,
  Gauge,
  HardDrive,
  Network,
  Server,
  Thermometer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getCabinetUsageRank,
  getDashboardStats,
  getDeviceTrend,
  getRecentOperations,
} from '@/services/idc';
import { acknowledgeAlert } from '@/services/idc/alert';
import { getEnvironmentOverview } from '@/services/idc/environment';
import styles from './index.less';

const { Text } = Typography;

interface EnergyOverview {
  avgTemperature: number;
  avgHumidity: number;
  totalPower: number;
  avgPue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<IDC.DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [cabinetRank, setCabinetRank] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [energyOverview, setEnergyOverview] = useState<EnergyOverview | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, trendRes, rankRes, opsRes, energyRes] =
          await Promise.all([
            getDashboardStats(),
            getDeviceTrend(7),
            getCabinetUsageRank(5),
            getRecentOperations(5),
            getEnvironmentOverview(),
          ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (trendRes.success && trendRes.data) {
          // 转换为图表需要的格式
          const formatted = trendRes.data.flatMap((item) => [
            { date: item.date, value: item.online, type: '在线' },
            { date: item.date, value: item.warning, type: '告警' },
            { date: item.date, value: item.offline, type: '离线' },
          ]);
          setTrendData(formatted);
        }
        if (rankRes.success && rankRes.data) setCabinetRank(rankRes.data);
        if (opsRes.success && opsRes.data) setOperations(opsRes.data);
        if (energyRes.success && energyRes.data) {
          setEnergyOverview({
            avgTemperature: energyRes.data.avgTemperature,
            avgHumidity: energyRes.data.avgHumidity,
            totalPower: energyRes.data.totalPower,
            avgPue: energyRes.data.avgPue,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 快速确认告警
  const handleAcknowledge = async (alertId: string) => {
    const res = await acknowledgeAlert(alertId);
    if (res.success) {
      message.success('告警已确认');
      // 重新加载数据
      const statsRes = await getDashboardStats();
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    }
  };

  const alertColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const colors: Record<string, string> = {
          info: 'blue',
          warning: 'orange',
          error: 'red',
          critical: 'magenta',
        };
        return <Tag color={colors[level]}>{level.toUpperCase()}</Tag>;
      },
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 150,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) =>
        record.acknowledged ? (
          <Tag color="green">已确认</Tag>
        ) : (
          <Button
            type="link"
            size="small"
            onClick={() => handleAcknowledge(record.id)}
          >
            确认
          </Button>
        ),
    },
  ];

  const trendConfig = {
    data: trendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#52c41a', '#faad14', '#ff4d4f'],
    areaStyle: {
      fillOpacity: 0.3,
    },
    legend: {
      position: 'top-right' as const,
    },
    xAxis: {
      tickCount: 7,
    },
    height: 200,
  };

  return (
    <PageContainer
      header={{
        title: 'IDC机房管理仪表板',
        subTitle: '数据中心资源概览与监控',
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Server size={28} color="#fff" />
            </div>
            <Statistic
              title="数据中心"
              value={stats?.datacenterCount || 0}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              }}
            >
              <HardDrive size={28} color="#fff" />
            </div>
            <Statistic
              title="机柜总数"
              value={stats?.cabinetCount || 0}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
              }}
            >
              <Network size={28} color="#fff" />
            </div>
            <Statistic
              title="设备总数"
              value={stats?.deviceCount || 0}
              suffix="台"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              }}
            >
              <Cable size={28} color="#fff" />
            </div>
            <Statistic
              title="连线数量"
              value={stats?.connectionCount || 0}
              suffix="条"
            />
          </Card>
        </Col>
      </Row>

      {/* 能耗概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              }}
            >
              <Thermometer size={28} color="#fff" />
            </div>
            <Statistic
              title="平均温度"
              value={energyOverview?.avgTemperature || 0}
              precision={1}
              suffix="°C"
              valueStyle={{
                color:
                  (energyOverview?.avgTemperature || 0) > 28
                    ? '#cf1322'
                    : (energyOverview?.avgTemperature || 0) > 26
                      ? '#faad14'
                      : '#3f8600',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              }}
            >
              <Droplets size={28} color="#fff" />
            </div>
            <Statistic
              title="平均湿度"
              value={energyOverview?.avgHumidity || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#0984e3' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #ffd93d 0%, #ff9500 100%)',
              }}
            >
              <Zap size={28} color="#fff" />
            </div>
            <Statistic
              title="总功耗"
              value={energyOverview?.totalPower || 0}
              precision={1}
              suffix="kW"
              valueStyle={{ color: '#ff9500' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} loading={loading}>
            <div
              className={styles.statIcon}
              style={{
                background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
              }}
            >
              <Gauge size={28} color="#fff" />
            </div>
            <Statistic
              title="平均PUE"
              value={energyOverview?.avgPue || 0}
              precision={2}
              valueStyle={{
                color:
                  (energyOverview?.avgPue || 0) > 1.8
                    ? '#cf1322'
                    : (energyOverview?.avgPue || 0) > 1.5
                      ? '#faad14'
                      : '#3f8600',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 设备状态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card
            title={
              <span>
                <Activity size={16} style={{ marginRight: 8 }} />
                设备状态趋势
              </span>
            }
            loading={loading}
          >
            {trendData.length > 0 && <Area {...trendConfig} />}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={
              <span>
                <TrendingUp size={16} style={{ marginRight: 8 }} />
                设备状态分布
              </span>
            }
            loading={loading}
          >
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <Badge status="success" />
                <span className={styles.statusLabel}>在线</span>
                <span
                  className={styles.statusValue}
                  style={{ color: '#52c41a' }}
                >
                  {stats?.onlineDevices || 0}
                </span>
              </div>
              <div className={styles.statusItem}>
                <Badge status="warning" />
                <span className={styles.statusLabel}>告警</span>
                <span
                  className={styles.statusValue}
                  style={{ color: '#faad14' }}
                >
                  {stats?.warningDevices || 0}
                </span>
              </div>
              <div className={styles.statusItem}>
                <Badge status="error" />
                <span className={styles.statusLabel}>故障</span>
                <span
                  className={styles.statusValue}
                  style={{ color: '#ff4d4f' }}
                >
                  {stats?.errorDevices || 0}
                </span>
              </div>
              <div className={styles.statusItem}>
                <Badge status="default" />
                <span className={styles.statusLabel}>离线</span>
                <span
                  className={styles.statusValue}
                  style={{ color: '#8c8c8c' }}
                >
                  {stats?.offlineDevices || 0}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">机柜使用率</Text>
                <Text strong style={{ float: 'right' }}>
                  {((stats?.cabinetUsageRate || 0) * 100).toFixed(1)}%
                </Text>
              </div>
              <Progress
                percent={(stats?.cabinetUsageRate || 0) * 100}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                showInfo={false}
              />
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <Text type="secondary">U位使用率</Text>
                <Text strong style={{ float: 'right' }}>
                  {((stats?.uUsageRate || 0) * 100).toFixed(1)}%
                </Text>
              </div>
              <Progress
                percent={(stats?.uUsageRate || 0) * 100}
                strokeColor={{ '0%': '#722ed1', '100%': '#eb2f96' }}
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 告警和操作记录 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <Bell size={16} />
                最近告警
                {(stats?.recentAlerts?.filter((a: any) => !a.acknowledged)
                  .length || 0) > 0 && (
                  <Badge
                    count={
                      stats?.recentAlerts?.filter((a: any) => !a.acknowledged)
                        .length || 0
                    }
                    style={{ backgroundColor: '#ff4d4f' }}
                  />
                )}
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => history.push('/monitor/alert')}
              >
                查看更多 <ArrowRight size={14} />
              </Button>
            }
            loading={loading}
          >
            <Table
              dataSource={stats?.recentAlerts || []}
              columns={alertColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                机柜使用率TOP5
              </span>
            }
            loading={loading}
          >
            <List
              dataSource={cabinetRank}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>
                        <Badge
                          count={index + 1}
                          style={{
                            backgroundColor: index < 3 ? '#f5222d' : '#8c8c8c',
                            marginRight: 8,
                          }}
                        />
                        {item.cabinetName}
                      </span>
                      <Text strong>{(item.usage * 100).toFixed(1)}%</Text>
                    </div>
                    <Progress
                      percent={item.usage * 100}
                      size="small"
                      strokeColor={
                        item.usage > 0.9
                          ? '#f5222d'
                          : item.usage > 0.7
                            ? '#faad14'
                            : '#52c41a'
                      }
                      showInfo={false}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近操作 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近操作记录" loading={loading}>
            <List
              dataSource={operations}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        <Tag color="blue">{item.type}</Tag>
                        {item.target}
                      </span>
                    }
                    description={item.description}
                  />
                  <div>
                    <Text type="secondary">{item.operator}</Text>
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;

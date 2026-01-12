import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Progress, Table, Tag, List, Badge, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
    Server,
    HardDrive,
    Network,
    Cable,
    CheckCircle,
    Activity,
    TrendingUp,
    Bell,
} from 'lucide-react';
import { getDashboardStats, getDeviceTrend, getCabinetUsageRank, getRecentOperations } from '@/services/idc';
import { Area } from '@ant-design/charts';
import styles from './index.less';

const { Text } = Typography;

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<IDC.DashboardStats | null>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [cabinetRank, setCabinetRank] = useState<any[]>([]);
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, trendRes, rankRes, opsRes] = await Promise.all([
                    getDashboardStats(),
                    getDeviceTrend(7),
                    getCabinetUsageRank(5),
                    getRecentOperations(5),
                ]);
                if (statsRes.success && statsRes.data) setStats(statsRes.data);
                if (trendRes.success && trendRes.data) {
                    // 转换为图表需要的格式
                    const formatted = trendRes.data.flatMap(item => [
                        { date: item.date, value: item.online, type: '在线' },
                        { date: item.date, value: item.warning, type: '告警' },
                        { date: item.date, value: item.offline, type: '离线' },
                    ]);
                    setTrendData(formatted);
                }
                if (rankRes.success && rankRes.data) setCabinetRank(rankRes.data);
                if (opsRes.success && opsRes.data) setOperations(opsRes.data);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        },
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (time: string) => new Date(time).toLocaleString('zh-CN'),
        },
        {
            title: '状态',
            dataIndex: 'acknowledged',
            key: 'acknowledged',
            width: 80,
            render: (ack: boolean) => (
                ack ? <Tag color="green">已确认</Tag> : <Tag color="orange">待处理</Tag>
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
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
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
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
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
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
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
                                <span className={styles.statusValue} style={{ color: '#52c41a' }}>
                                    {stats?.onlineDevices || 0}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <Badge status="warning" />
                                <span className={styles.statusLabel}>告警</span>
                                <span className={styles.statusValue} style={{ color: '#faad14' }}>
                                    {stats?.warningDevices || 0}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <Badge status="error" />
                                <span className={styles.statusLabel}>故障</span>
                                <span className={styles.statusValue} style={{ color: '#ff4d4f' }}>
                                    {stats?.errorDevices || 0}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <Badge status="default" />
                                <span className={styles.statusLabel}>离线</span>
                                <span className={styles.statusValue} style={{ color: '#8c8c8c' }}>
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
                            <span>
                                <Bell size={16} style={{ marginRight: 8 }} />
                                最近告警
                            </span>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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
                                            strokeColor={item.usage > 0.9 ? '#f5222d' : item.usage > 0.7 ? '#faad14' : '#52c41a'}
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
                    <Card
                        title="最近操作记录"
                        loading={loading}
                    >
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

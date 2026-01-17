import { Area, Line } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  Activity,
  AlertTriangle,
  Droplets,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  getCabinetEnvironments,
  getEnergyStats,
  getEnvironmentOverview,
  getPueTrend,
  getTemperatureTrend,
} from '@/services/idc/environment';
import styles from './index.less';

const Environment: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [cabinetEnvs, setCabinetEnvs] = useState<IDC.CabinetEnvironment[]>([]);
  const [tempTrend, setTempTrend] = useState<IDC.TemperatureTrend[]>([]);
  const [pueTrend, setPueTrend] = useState<IDC.PueData[]>([]);
  const [energyStats, setEnergyStats] = useState<IDC.EnergyStats | null>(null);
  const [datacenters, setDatacenters] = useState<any[]>([]);
  const [selectedDc, setSelectedDc] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDc) {
      fetchPueTrend(selectedDc);
    }
  }, [selectedDc]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, cabinetRes, tempRes, pueRes, energyRes, dcRes] =
        await Promise.all([
          getEnvironmentOverview(),
          getCabinetEnvironments(),
          getTemperatureTrend(24),
          getPueTrend(30),
          getEnergyStats(),
          getAllDatacenters(),
        ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (cabinetRes.success && cabinetRes.data) {
        setCabinetEnvs(cabinetRes.data);
      }
      if (tempRes.success && tempRes.data) {
        setTempTrend(tempRes.data);
      }
      if (pueRes.success && pueRes.data) {
        setPueTrend(pueRes.data);
      }
      if (energyRes.success && energyRes.data) {
        setEnergyStats(energyRes.data);
      }
      if (dcRes.success && dcRes.data) {
        setDatacenters(dcRes.data);
        if (dcRes.data.length > 0) {
          setSelectedDc(dcRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch environment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPueTrend = async (datacenterId: string) => {
    try {
      const res = await getPueTrend(30, datacenterId);
      if (res.success && res.data) {
        setPueTrend(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch PUE trend:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      normal: { color: 'success', text: '正常' },
      warning: { color: 'warning', text: '警告' },
      critical: { color: 'error', text: '严重' },
    };
    const cfg = config[status] || { color: 'default', text: status };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const getTemperatureProgress = (temp: number) => {
    // 温度范围：15-35℃，正常范围20-26℃
    const percent = Math.min(100, Math.max(0, ((temp - 15) / 20) * 100));
    let status: 'success' | 'normal' | 'exception' = 'success';
    if (temp > 28) status = 'exception';
    else if (temp > 26) status = 'normal';

    return (
      <div className={styles.tempBar}>
        <span className={styles.tempValue}>{temp}℃</span>
        <Progress
          className={styles.tempProgress}
          percent={percent}
          status={status}
          showInfo={false}
          size="small"
        />
      </div>
    );
  };

  const columns = [
    {
      title: '机柜名称',
      dataIndex: 'cabinetName',
      key: 'cabinetName',
    },
    {
      title: '数据中心',
      dataIndex: 'datacenterName',
      key: 'datacenterName',
    },
    {
      title: '平均温度',
      dataIndex: 'avgTemperature',
      key: 'avgTemperature',
      sorter: (a: IDC.CabinetEnvironment, b: IDC.CabinetEnvironment) =>
        a.avgTemperature - b.avgTemperature,
      render: (temp: number) => getTemperatureProgress(temp),
    },
    {
      title: '最高温度',
      dataIndex: 'maxTemperature',
      key: 'maxTemperature',
      sorter: (a: IDC.CabinetEnvironment, b: IDC.CabinetEnvironment) =>
        a.maxTemperature - b.maxTemperature,
      render: (temp: number) => (
        <span
          style={{
            color: temp > 28 ? '#f5222d' : temp > 26 ? '#faad14' : '#52c41a',
          }}
        >
          {temp}℃
        </span>
      ),
    },
    {
      title: '平均湿度',
      dataIndex: 'avgHumidity',
      key: 'avgHumidity',
      sorter: (a: IDC.CabinetEnvironment, b: IDC.CabinetEnvironment) =>
        a.avgHumidity - b.avgHumidity,
      render: (humidity: number) => `${humidity}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '正常', value: 'normal' },
        { text: '警告', value: 'warning' },
        { text: '严重', value: 'critical' },
      ],
      onFilter: (value: any, record: IDC.CabinetEnvironment) =>
        record.status === value,
      render: (status: string) => getStatusTag(status),
    },
  ];

  // 温度趋势图配置
  const tempChartData = tempTrend.flatMap((item) => [
    {
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: item.avgTemperature,
      type: '平均温度',
    },
    {
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: item.maxTemperature,
      type: '最高温度',
    },
    {
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: item.minTemperature,
      type: '最低温度',
    },
  ]);

  const tempChartConfig = {
    data: tempChartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    height: 300,
    yAxis: {
      title: { text: '温度 (℃)' },
    },
    legend: {
      position: 'top' as const,
    },
    color: ['#1890ff', '#f5222d', '#52c41a'],
    areaStyle: () => ({
      fillOpacity: 0.15,
    }),
  };

  // PUE趋势图配置
  const pueChartConfig = {
    data: pueTrend,
    xField: 'date',
    yField: 'pue',
    smooth: true,
    height: 300,
    yAxis: {
      min: 1,
      max: 2,
      title: { text: 'PUE' },
    },
    point: {
      size: 3,
      shape: 'circle',
    },
    annotations: [
      {
        type: 'line',
        start: ['min', 1.4],
        end: ['max', 1.4],
        style: {
          stroke: '#52c41a',
          lineDash: [4, 4],
        },
        text: {
          content: '优秀线 (PUE=1.4)',
          position: 'start',
          style: { fill: '#52c41a', fontSize: 10 },
        },
      },
    ],
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={styles.environmentPage}>
      {/* 概览统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.overviewCard} ${styles.temperatureCard}`}>
            <Thermometer className={styles.statusIcon} />
            <div className={styles.cardValue}>
              {overview?.avgTemperature || 0}℃
            </div>
            <div className={styles.cardLabel}>平均温度</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              最高: {overview?.maxTemperature || 0}℃ (
              {overview?.maxTemperatureCabinet || '-'})
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.overviewCard} ${styles.humidityCard}`}>
            <Droplets className={styles.statusIcon} />
            <div className={styles.cardValue}>
              {overview?.avgHumidity || 0}%
            </div>
            <div className={styles.cardLabel}>平均湿度</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              {overview?.normalCabinets || 0} 正常 /{' '}
              {overview?.warningCabinets || 0} 警告 /{' '}
              {overview?.criticalCabinets || 0} 严重
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.overviewCard} ${styles.powerCard}`}>
            <Zap className={styles.statusIcon} />
            <div className={styles.cardValue}>
              {overview?.totalPower || 0} kW
            </div>
            <div className={styles.cardLabel}>总功率</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              共 {overview?.totalCabinets || 0} 个机柜
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.overviewCard} ${styles.pueCard}`}>
            <Activity className={styles.statusIcon} />
            <div className={styles.cardValue}>{overview?.avgPue || 0}</div>
            <div className={styles.cardLabel}>平均 PUE</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              {overview?.avgPue <= 1.4
                ? '优秀'
                : overview?.avgPue <= 1.6
                  ? '良好'
                  : '待优化'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 能耗统计 */}
      {energyStats && (
        <Card title="本月能耗统计" className={styles.chartCard}>
          <Row gutter={16} className={styles.energyStats}>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {(energyStats.totalEnergy / 1000).toFixed(1)}
                </div>
                <div className={styles.statLabel}>总电量 (MWh)</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  ¥{(energyStats.totalCost / 10000).toFixed(2)}万
                </div>
                <div className={styles.statLabel}>电费成本</div>
                <div
                  className={`${styles.statCompare} ${energyStats.comparedLastMonth < 0 ? styles.negative : styles.positive}`}
                >
                  {energyStats.comparedLastMonth < 0 ? (
                    <TrendingDown size={12} />
                  ) : (
                    <TrendingUp size={12} />
                  )}{' '}
                  {Math.abs(energyStats.comparedLastMonth)}% 较上月
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{energyStats.avgPue}</div>
                <div className={styles.statLabel}>平均 PUE</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {(energyStats.carbonEmission / 1000).toFixed(1)}
                </div>
                <div className={styles.statLabel}>碳排放 (吨)</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 温度趋势图 */}
      <Card title="24小时温度趋势" className={styles.chartCard}>
        <Area {...tempChartConfig} />
      </Card>

      {/* PUE趋势图 */}
      <Card
        title="PUE趋势 (近30天)"
        className={styles.chartCard}
        extra={
          <Select
            value={selectedDc}
            onChange={setSelectedDc}
            style={{ width: 200 }}
            placeholder="选择数据中心"
          >
            {datacenters.map((dc) => (
              <Select.Option key={dc.id} value={dc.id}>
                {dc.name}
              </Select.Option>
            ))}
          </Select>
        }
      >
        <Line {...pueChartConfig} />
      </Card>

      {/* 机柜温度列表 */}
      <Card
        title="机柜环境监控"
        className={styles.cabinetTable}
        extra={
          <Space>
            <Tooltip title="警告: 温度或湿度接近阈值">
              <Tag color="warning" icon={<AlertTriangle size={12} />}>
                {cabinetEnvs.filter((c) => c.status === 'warning').length} 警告
              </Tag>
            </Tooltip>
            <Tooltip title="严重: 温度或湿度超过阈值">
              <Tag color="error" icon={<AlertTriangle size={12} />}>
                {cabinetEnvs.filter((c) => c.status === 'critical').length} 严重
              </Tag>
            </Tooltip>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={cabinetEnvs}
          rowKey="cabinetId"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default Environment;

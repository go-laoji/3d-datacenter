import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  Activity,
  AlertTriangle,
  Box,
  Database,
  HardDrive,
  LayoutDashboard,
  Network,
  Server,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/services/idc/dashboard';

const { Title, Text } = Typography;

// 快捷入口配置
const quickLinks = [
  {
    title: '仪表盘',
    desc: '系统总览与实时监控',
    icon: <LayoutDashboard size={28} />,
    color: '#1890ff',
    path: '/dashboard',
  },
  {
    title: '数据中心',
    desc: '机房信息管理',
    icon: <Database size={28} />,
    color: '#13c2c2',
    path: '/datacenter',
  },
  {
    title: '机柜管理',
    desc: '机柜与U位管理',
    icon: <Server size={28} />,
    color: '#52c41a',
    path: '/cabinet',
  },
  {
    title: '设备管理',
    desc: '设备上下架与监控',
    icon: <HardDrive size={28} />,
    color: '#722ed1',
    path: '/device',
  },
  {
    title: '告警中心',
    desc: '系统告警与通知',
    icon: <AlertTriangle size={28} />,
    color: '#f5222d',
    path: '/alert-center',
  },
  {
    title: '网络拓扑',
    desc: '设备连接关系可视化',
    icon: <Network size={28} />,
    color: '#fa8c16',
    path: '/topology',
  },
  {
    title: '3D视图',
    desc: '数据中心3D可视化',
    icon: <Box size={28} />,
    color: '#2f54eb',
    path: '/datacenter3d',
  },
  {
    title: '电源管理',
    desc: '电源拓扑与冗余监控',
    icon: <Zap size={28} />,
    color: '#eb2f96',
    path: '/power',
  },
  {
    title: '环境监控',
    desc: '温度、湿度、PUE监控',
    icon: <Activity size={28} />,
    color: '#faad14',
    path: '/environment',
  },
  {
    title: '资源树',
    desc: '层级资源浏览',
    icon: <Shield size={28} />,
    color: '#a0d911',
    path: '/resource-tree',
  },
  {
    title: '设备模板',
    desc: '设备类型与端口定义',
    icon: <Settings size={28} />,
    color: '#597ef7',
    path: '/device-template',
  },
  {
    title: '连接管理',
    desc: '物理线缆连接管理',
    icon: <Network size={28} />,
    color: '#36cfc9',
    path: '/connection',
  },
];

const Welcome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <PageContainer
      header={{
        title: '欢迎使用 TDDC 数据中心管理平台',
        subTitle: '一站式数据中心基础设施管理',
      }}
    >
      {/* 概览统计 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => history.push('/datacenter')}
            >
              <Statistic
                title="数据中心"
                value={stats.datacenterCount || 0}
                prefix={<Database size={16} style={{ color: '#13c2c2' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => history.push('/cabinet')}
            >
              <Statistic
                title="机柜"
                value={stats.cabinetCount || 0}
                prefix={<Server size={16} style={{ color: '#52c41a' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => history.push('/device')}
            >
              <Statistic
                title="设备"
                value={stats.deviceCount || 0}
                prefix={<HardDrive size={16} style={{ color: '#722ed1' }} />}
                suffix="台"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => history.push('/alert-center')}
            >
              <Statistic
                title="活跃告警"
                value={stats.alertCount || 0}
                valueStyle={{
                  color: (stats.alertCount || 0) > 0 ? '#f5222d' : '#52c41a',
                }}
                prefix={<AlertTriangle size={16} />}
                suffix="条"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 快捷入口 */}
      <Card>
        <Title level={5} style={{ marginBottom: 20 }}>
          <Space>
            <LayoutDashboard size={18} />
            功能导航
          </Space>
        </Title>
        <Row gutter={[16, 16]}>
          {quickLinks.map((item) => (
            <Col xs={12} sm={8} md={6} lg={4} key={item.path}>
              <Card
                hoverable
                size="small"
                onClick={() => history.push(item.path)}
                style={{
                  textAlign: 'center',
                  borderRadius: 8,
                  transition: 'all 0.3s',
                }}
                styles={{
                  body: { padding: '20px 12px' },
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {item.title}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.desc}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </PageContainer>
  );
};

export default Welcome;

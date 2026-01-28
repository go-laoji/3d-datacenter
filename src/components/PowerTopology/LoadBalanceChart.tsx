/**
 * 负载均衡监控面板
 * 显示A/B路电源负载对比和均衡状态
 */

import {
  Alert,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
} from 'antd';
import { Activity, BarChart2, Minus, TrendingDown, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import { usePowerStore } from '@/stores/powerStore';

// 负载级别配置
const loadLevels = {
  low: { color: '#52c41a', label: '低负载', threshold: 40 },
  normal: { color: '#1890ff', label: '正常', threshold: 70 },
  high: { color: '#faad14', label: '较高', threshold: 85 },
  critical: { color: '#f5222d', label: '过载', threshold: 100 },
};

const getLoadLevel = (percent: number) => {
  if (percent < loadLevels.low.threshold) return loadLevels.low;
  if (percent < loadLevels.normal.threshold) return loadLevels.normal;
  if (percent < loadLevels.high.threshold) return loadLevels.high;
  return loadLevels.critical;
};

// 单路负载卡片
const PathLoadCard: React.FC<{
  path: 'A' | 'B';
  load: number;
  capacity: number;
  linkCount: number;
}> = ({ path, load, capacity, linkCount }) => {
  const percent = capacity > 0 ? Math.round((load / capacity) * 100) : 0;
  const level = getLoadLevel(percent);
  const pathColor = path === 'A' ? '#1890ff' : '#52c41a';
  const pathBg = path === 'A' ? '#e6f7ff' : '#f6ffed';

  return (
    <Card
      size="small"
      style={{
        background: pathBg,
        border: `1px solid ${pathColor}`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <Tag color={path === 'A' ? 'blue' : 'green'} style={{ margin: 0 }}>
          {path}路电源
        </Tag>
        <Tooltip title={level.label}>
          <Tag color={level.color} style={{ marginLeft: 8 }}>
            {level.label}
          </Tag>
        </Tooltip>
      </div>

      <Row gutter={8}>
        <Col span={12}>
          <Statistic
            title="当前负载"
            value={load}
            suffix="W"
            valueStyle={{ fontSize: 20, color: level.color }}
            prefix={<Zap size={16} />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="链路数"
            value={linkCount}
            suffix="条"
            valueStyle={{ fontSize: 20 }}
            prefix={<BarChart2 size={16} />}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 12, color: '#666' }}>负载率</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: level.color }}>
            {percent}%
          </span>
        </div>
        <Progress
          percent={percent}
          strokeColor={level.color}
          showInfo={false}
          size="small"
        />
      </div>
    </Card>
  );
};

// 负载均衡指示器
const BalanceIndicator: React.FC<{ balanceRate: number }> = ({
  balanceRate,
}) => {
  const percent = Math.round(balanceRate * 100);
  const isBalanced = percent >= 85;
  const isAcceptable = percent >= 60;

  let statusColor = '#52c41a';
  let statusLabel = '均衡';
  let StatusIcon = Minus;

  if (!isBalanced) {
    if (isAcceptable) {
      statusColor = '#faad14';
      statusLabel = '轻微不均衡';
      StatusIcon = TrendingDown;
    } else {
      statusColor = '#f5222d';
      statusLabel = '严重不均衡';
      StatusIcon = TrendingDown;
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        background: '#fafafa',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <StatusIcon size={20} style={{ color: statusColor, marginRight: 8 }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: statusColor }}>
        {percent}%
      </div>
      <div style={{ fontSize: 12, color: '#999' }}>均衡率</div>
    </div>
  );
};

export const LoadBalanceChart: React.FC = () => {
  const { getLoadBalance, getPDUsByPath } = usePowerStore();
  const balance = getLoadBalance();

  // 获取A/B路PDU总容量
  const pathACapacity = useMemo(() => {
    const pdus = getPDUsByPath('A');
    return pdus.reduce((sum, pdu) => sum + (pdu.maxLoad || 0), 0) || 10000; // 默认10kW
  }, [getPDUsByPath]);

  const pathBCapacity = useMemo(() => {
    const pdus = getPDUsByPath('B');
    return pdus.reduce((sum, pdu) => sum + (pdu.maxLoad || 0), 0) || 10000;
  }, [getPDUsByPath]);

  const totalLoad = balance.pathALoad + balance.pathBLoad;
  const loadDifference = Math.abs(balance.pathALoad - balance.pathBLoad);
  const isPathAHigher = balance.pathALoad > balance.pathBLoad;

  return (
    <Card
      title={
        <Space>
          <Activity size={16} style={{ color: '#722ed1' }} />
          负载均衡监控
        </Space>
      }
      extra={
        <Statistic
          title="总负载"
          value={totalLoad}
          suffix="W"
          valueStyle={{ fontSize: 14 }}
        />
      }
    >
      <Row gutter={16}>
        {/* A路负载 */}
        <Col span={8}>
          <PathLoadCard
            path="A"
            load={balance.pathALoad}
            capacity={pathACapacity}
            linkCount={balance.pathALinks}
          />
        </Col>

        {/* 均衡指示器 */}
        <Col span={8}>
          <BalanceIndicator balanceRate={balance.balanceRate} />
          {/* 负载差异提示 */}
          {loadDifference > 500 && (
            <Alert
              type="info"
              showIcon={false}
              message={
                <div style={{ fontSize: 12, textAlign: 'center' }}>
                  {isPathAHigher ? 'A' : 'B'}路比{isPathAHigher ? 'B' : 'A'}路高{' '}
                  {loadDifference}W
                </div>
              }
              style={{ marginTop: 12, padding: '4px 8px' }}
            />
          )}
        </Col>

        {/* B路负载 */}
        <Col span={8}>
          <PathLoadCard
            path="B"
            load={balance.pathBLoad}
            capacity={pathBCapacity}
            linkCount={balance.pathBLinks}
          />
        </Col>
      </Row>

      {/* 优化建议 */}
      {balance.balanceRate < 0.6 && (
        <Alert
          type="warning"
          showIcon
          message="负载不均衡警告"
          description={`建议将部分设备从${isPathAHigher ? 'A' : 'B'}路迁移到${isPathAHigher ? 'B' : 'A'}路,以优化负载均衡。`}
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default LoadBalanceChart;

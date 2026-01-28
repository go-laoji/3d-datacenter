/**
 * A/B路电源标识组件
 * 用于在设备列表或详情中显示电源路径状态
 */

import { Badge, Space, Tag, Tooltip } from 'antd';
import { Zap, ZapOff } from 'lucide-react';
import React from 'react';

interface PowerPathIndicatorProps {
  /** 设备连接的电源路径列表 */
  powerPaths: ('A' | 'B')[];
  /** 显示模式: 'tag' 使用Tag组件, 'badge' 使用Badge组件, 'icon' 使用图标 */
  mode?: 'tag' | 'badge' | 'icon';
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否显示冗余状态提示 */
  showRedundancy?: boolean;
}

// 电源路径颜色配置
const pathConfig = {
  A: { color: '#1890ff', bg: '#e6f7ff', name: 'A路电源' },
  B: { color: '#52c41a', bg: '#f6ffed', name: 'B路电源' },
};

export const PowerPathIndicator: React.FC<PowerPathIndicatorProps> = ({
  powerPaths,
  mode = 'tag',
  size = 'default',
  showRedundancy = true,
}) => {
  const hasPathA = powerPaths.includes('A');
  const hasPathB = powerPaths.includes('B');
  const isDualPower = hasPathA && hasPathB;
  const hasPower = hasPathA || hasPathB;

  // 冗余状态提示
  const redundancyTip = isDualPower
    ? '双路电源冗余,可靠性高'
    : hasPower
      ? '单路电源,存在单点故障风险'
      : '无电源连接';

  const renderContent = () => {
    if (mode === 'icon') {
      return (
        <Space size={4}>
          <Tooltip title={hasPathA ? 'A路电源已连接' : 'A路电源未连接'}>
            {hasPathA ? (
              <Zap
                size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
                style={{ color: pathConfig.A.color }}
              />
            ) : (
              <ZapOff
                size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
                style={{ color: '#d9d9d9' }}
              />
            )}
          </Tooltip>
          <Tooltip title={hasPathB ? 'B路电源已连接' : 'B路电源未连接'}>
            {hasPathB ? (
              <Zap
                size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
                style={{ color: pathConfig.B.color }}
              />
            ) : (
              <ZapOff
                size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
                style={{ color: '#d9d9d9' }}
              />
            )}
          </Tooltip>
        </Space>
      );
    }

    if (mode === 'badge') {
      return (
        <Space size={4}>
          <Badge
            status={hasPathA ? 'processing' : 'default'}
            text={
              <span style={{ fontSize: size === 'small' ? 10 : 12 }}>A</span>
            }
          />
          <Badge
            status={hasPathB ? 'success' : 'default'}
            text={
              <span style={{ fontSize: size === 'small' ? 10 : 12 }}>B</span>
            }
          />
        </Space>
      );
    }

    // 默认 tag 模式
    return (
      <Space size={4}>
        {hasPathA && (
          <Tag
            color="blue"
            style={{
              margin: 0,
              fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
              padding: size === 'small' ? '0 4px' : undefined,
            }}
          >
            A路
          </Tag>
        )}
        {hasPathB && (
          <Tag
            color="green"
            style={{
              margin: 0,
              fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
              padding: size === 'small' ? '0 4px' : undefined,
            }}
          >
            B路
          </Tag>
        )}
        {!hasPower && (
          <Tag
            color="default"
            style={{
              margin: 0,
              fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
            }}
          >
            无
          </Tag>
        )}
      </Space>
    );
  };

  if (showRedundancy) {
    return (
      <Tooltip title={redundancyTip}>
        <span style={{ cursor: 'help' }}>{renderContent()}</span>
      </Tooltip>
    );
  }

  return renderContent();
};

/**
 * 电源冗余状态标签
 * 显示设备的电源冗余级别
 */
interface RedundancyTagProps {
  powerPaths: ('A' | 'B')[];
  showLabel?: boolean;
}

export const RedundancyTag: React.FC<RedundancyTagProps> = ({
  powerPaths,
  showLabel = true,
}) => {
  const isDualPower = powerPaths.includes('A') && powerPaths.includes('B');
  const hasPower = powerPaths.length > 0;

  if (isDualPower) {
    return (
      <Tag color="success" icon={<Zap size={12} />}>
        {showLabel ? '双路冗余' : '冗余'}
      </Tag>
    );
  }

  if (hasPower) {
    return <Tag color="warning">{showLabel ? '单路电源' : '单路'}</Tag>;
  }

  return <Tag color="error">{showLabel ? '无电源' : '无'}</Tag>;
};

/**
 * 电源路径指示条
 * 用于在设备3D模型或机柜视图中显示电源路径
 */
interface PowerPathBarProps {
  powerPaths: ('A' | 'B')[];
  width?: number;
  height?: number;
}

export const PowerPathBar: React.FC<PowerPathBarProps> = ({
  powerPaths,
  width = 60,
  height = 6,
}) => {
  const hasPathA = powerPaths.includes('A');
  const hasPathB = powerPaths.includes('B');

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        width,
        height,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          background: hasPathA ? pathConfig.A.color : '#e8e8e8',
          borderRadius: `${height / 2}px 0 0 ${height / 2}px`,
        }}
      />
      <div
        style={{
          flex: 1,
          background: hasPathB ? pathConfig.B.color : '#e8e8e8',
          borderRadius: `0 ${height / 2}px ${height / 2}px 0`,
        }}
      />
    </div>
  );
};

export default PowerPathIndicator;

/**
 * 电源冗余状态面板
 * 显示双路电源和单路电源设备状态
 */

import {
  Alert,
  Badge,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, CheckCircle, Shield, ShieldAlert } from 'lucide-react';
import React, { useMemo } from 'react';
import { useDeviceStore } from '@/stores/deviceStore';
import { usePowerStore } from '@/stores/powerStore';

interface RedundancyDevice {
  id: string;
  name: string;
  powerPaths: ('A' | 'B')[];
  isDualPower: boolean;
  status: 'safe' | 'risk';
}

export const RedundancyStatus: React.FC = () => {
  const { getRedundancyStatus, powerTopology } = usePowerStore();
  const { devices } = useDeviceStore();
  const redundancy = getRedundancyStatus();

  // 构建设备冗余详情
  const redundancyDevices = useMemo<RedundancyDevice[]>(() => {
    const devicePowerPaths = new Map<string, Set<'A' | 'B'>>();

    // 统计每个设备的电源路径
    powerTopology.links.forEach((link) => {
      if (link.status === 'active') {
        if (!devicePowerPaths.has(link.target)) {
          devicePowerPaths.set(link.target, new Set());
        }
        devicePowerPaths.get(link.target)?.add(link.powerPath);
      }
    });

    return Array.from(devicePowerPaths.entries()).map(([deviceId, paths]) => {
      const device = devices.find((d) => d.id === deviceId);
      const pathsArray = Array.from(paths);
      const isDualPower = pathsArray.length >= 2;

      return {
        id: deviceId,
        name: device?.name || deviceId,
        powerPaths: pathsArray,
        isDualPower,
        status: isDualPower ? 'safe' : 'risk',
      };
    });
  }, [powerTopology.links, devices]);

  const columns: ColumnsType<RedundancyDevice> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          {record.isDualPower ? (
            <Shield size={16} style={{ color: '#52c41a' }} />
          ) : (
            <ShieldAlert size={16} style={{ color: '#faad14' }} />
          )}
          {name}
        </Space>
      ),
    },
    {
      title: '电源路径',
      dataIndex: 'powerPaths',
      key: 'powerPaths',
      render: (paths: ('A' | 'B')[]) => (
        <Space>
          {paths.includes('A') && <Tag color="blue">A路</Tag>}
          {paths.includes('B') && <Tag color="green">B路</Tag>}
        </Space>
      ),
    },
    {
      title: '冗余状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) =>
        status === 'safe' ? (
          <Badge status="success" text="双路冗余" />
        ) : (
          <Badge status="warning" text="单点风险" />
        ),
    },
  ];

  const dualPowerCount = redundancy.dualPowerDevices.length;
  const singlePowerCount = redundancy.singlePowerDevices.length;
  const totalCount = dualPowerCount + singlePowerCount;
  const redundancyPercent =
    totalCount > 0 ? Math.round(redundancy.redundancyRate * 100) : 0;

  return (
    <Card
      title={
        <Space>
          <Shield size={16} style={{ color: '#722ed1' }} />
          电源冗余状态
        </Space>
      }
    >
      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title="冗余覆盖率"
            value={redundancyPercent}
            suffix="%"
            valueStyle={{
              color:
                redundancyPercent >= 80
                  ? '#52c41a'
                  : redundancyPercent >= 50
                    ? '#faad14'
                    : '#f5222d',
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={
              <Space>
                <CheckCircle size={14} style={{ color: '#52c41a' }} />
                双路电源
              </Space>
            }
            value={dualPowerCount}
            suffix="台"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={
              <Space>
                <AlertTriangle size={14} style={{ color: '#faad14' }} />
                单路电源
              </Space>
            }
            value={singlePowerCount}
            suffix="台"
            valueStyle={{ color: singlePowerCount > 0 ? '#faad14' : '#52c41a' }}
          />
        </Col>
      </Row>

      {/* 冗余进度条 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
          电源冗余进度
        </div>
        <Progress
          percent={redundancyPercent}
          status={
            redundancyPercent >= 80
              ? 'success'
              : redundancyPercent >= 50
                ? 'normal'
                : 'exception'
          }
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </div>

      {/* 风险提示 */}
      {singlePowerCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle size={16} />}
          message={`存在 ${singlePowerCount} 台设备仅有单路电源供电,建议检查并添加冗余电源`}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 设备冗余详情表格 */}
      <Table
        columns={columns}
        dataSource={redundancyDevices}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 5 }}
        rowClassName={(record) =>
          record.status === 'risk' ? 'ant-table-row-warning' : ''
        }
      />
    </Card>
  );
};

export default RedundancyStatus;

import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { ArrowRight, Network } from 'lucide-react';
import type { ConnectionView } from '@/services/idc/connection';

interface Props {
  open: boolean;
  connection?: ConnectionView;
  onClose: () => void;
}

const Endpoint: React.FC<{
  side: 'source' | 'target';
  connection: ConnectionView;
}> = ({ side, connection }) => {
  const source = side === 'source';
  const deviceId = source
    ? connection.sourceDeviceId
    : connection.targetDeviceId;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        padding: 14,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
      }}
    >
      <Typography.Text type="secondary">
        {source ? '源端' : '目标端'}
      </Typography.Text>
      <div>
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => history.push(`/idc/device?deviceId=${deviceId}`)}
        >
          {source ? connection.sourceDeviceName : connection.targetDeviceName}
        </Button>
      </div>
      <strong>
        {source ? connection.sourcePortName : connection.targetPortName}
      </strong>{' '}
      · {source ? connection.sourcePortSpeed : connection.targetPortSpeed}
      <div>
        <Typography.Text type="secondary">
          {source
            ? connection.sourceDeviceLocation
            : connection.targetDeviceLocation}
        </Typography.Text>
      </div>
    </div>
  );
};

const ConnectionDetailDrawer: React.FC<Props> = ({
  open,
  connection,
  onClose,
}) => (
  <Drawer
    title={connection ? `${connection.cableNumber} · 物理连接详情` : '连接详情'}
    open={open}
    onClose={onClose}
    width={720}
  >
    {connection ? (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%' }} align="center">
          <Endpoint side="source" connection={connection} />
          <ArrowRight />
          <Endpoint side="target" connection={connection} />
        </Space>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="介质">
            {connection.cableType}
          </Descriptions.Item>
          <Descriptions.Item label="长度">
            {connection.cableLength ?? '-'} m
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={connection.status === 'active' ? 'success' : 'error'}>
              {connection.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {connection.updatedAt}
          </Descriptions.Item>
          <Descriptions.Item label="用途" span={2}>
            {connection.description ?? '-'}
          </Descriptions.Item>
        </Descriptions>
        <Alert
          type="warning"
          showIcon
          message="断开影响"
          description={connection.impact.join('、')}
        />
        <Space>
          <Button
            icon={<Network size={15} />}
            onClick={() =>
              history.push(`/network/topology?connectionId=${connection.id}`)
            }
          >
            在拓扑中定位
          </Button>
          <Button
            onClick={() =>
              history.push(
                `/network/port?deviceId=${connection.sourceDeviceId}&portId=${connection.sourcePortId}`,
              )
            }
          >
            查看源端口
          </Button>
        </Space>
        <div>
          <Typography.Title level={5}>变更与巡检记录</Typography.Title>
          <Timeline
            items={connection.history.map((item) => ({
              children: (
                <>
                  <strong>{item.action}</strong> · {item.operator}
                  <div>
                    <Typography.Text type="secondary">
                      {item.occurredAt} · {item.detail}
                    </Typography.Text>
                  </div>
                </>
              ),
            }))}
          />
        </div>
      </Space>
    ) : null}
  </Drawer>
);

export default ConnectionDetailDrawer;

import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Switch,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { Send } from 'lucide-react';
import { EntityStatus } from '@/components/operations';
import type { NotificationChannel } from '@/services/platform';

interface ChannelsTabProps {
  channels: NotificationChannel[];
  onToggle: (channel: NotificationChannel) => void;
  onTest: (channel: NotificationChannel) => void;
  testingId?: string;
}

export function ChannelsTab({
  channels,
  onToggle,
  onTest,
  testingId,
}: ChannelsTabProps) {
  return (
    <Row gutter={[16, 16]}>
      {channels.map((channel) => (
        <Col xs={24} lg={8} key={channel.id}>
          <Card
            title={channel.name}
            extra={<EntityStatus status={channel.status} />}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                {channel.type.toUpperCase()} · {channel.target}
              </Typography.Text>
              <Statistic
                title="近 7 天送达率"
                value={channel.deliveryRate}
                suffix="%"
                precision={1}
              />
              <Typography.Text type="secondary">
                最近测试：
                {channel.lastTestAt
                  ? dayjs(channel.lastTestAt).format('MM-DD HH:mm')
                  : '尚未测试'}
              </Typography.Text>
              <Space>
                <Switch
                  checked={channel.status === 'enabled'}
                  onChange={() => onToggle(channel)}
                  aria-label={`${channel.name}启用状态`}
                />
                <Button
                  icon={<Send size={14} />}
                  loading={testingId === channel.id}
                  onClick={() => onTest(channel)}
                >
                  发送测试
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

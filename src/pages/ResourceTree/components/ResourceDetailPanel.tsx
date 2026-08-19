import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Space,
  Tag,
  Typography,
} from 'antd';
import { Box, Star } from 'lucide-react';
import type { ResourceTreeItem } from '@/services/idc/resourceTree';

interface Props {
  item?: ResourceTreeItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const typeLabels = {
  datacenter: '数据中心',
  cabinet: '机柜',
  device: '设备',
  pdu: 'PDU',
  port: '端口',
  connection: '物理连接',
};
const statusLabels = {
  normal: '正常',
  warning: '警告',
  critical: '严重',
  offline: '离线',
};

export const ResourceDetailPanel = ({
  item,
  isFavorite,
  onToggleFavorite,
}: Props) => {
  if (!item) return <Empty description="选择资源查看统一上下文与可用操作" />;
  const sceneRoute =
    item.type === 'datacenter'
      ? `/datacenter3d?datacenterId=${item.id}`
      : item.cabinetId || item.type === 'cabinet'
        ? `/datacenter3d?datacenterId=${item.datacenterId}&cabinetId=${item.cabinetId || item.id}`
        : undefined;
  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div>
        <Space wrap>
          <Tag color="blue">{typeLabels[item.type]}</Tag>
          <Tag
            color={
              item.status === 'normal'
                ? 'success'
                : item.status === 'critical'
                  ? 'error'
                  : 'warning'
            }
          >
            {statusLabels[item.status]}
          </Tag>
          {item.alertCount > 0 && (
            <Tag color="error">{item.alertCount} 条活动告警</Tag>
          )}
        </Space>
        <Typography.Title level={3}>{item.name}</Typography.Title>
        <Typography.Text type="secondary">
          {item.subtitle || item.code}
        </Typography.Text>
      </div>
      {item.status !== 'normal' && (
        <Alert
          type={item.status === 'critical' ? 'error' : 'warning'}
          showIcon
          message="该对象需要关注"
          description="可从本页直接跳转到对象详情、活动告警或 3D 场景，URL 会保留所选对象。"
        />
      )}
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="资源编号">
          <Typography.Text copyable>{item.id}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="资产编码">
          <Typography.Text copyable>{item.code}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="数据中心">
          {item.datacenterId || (item.type === 'datacenter' ? item.id : '—')}
        </Descriptions.Item>
        <Descriptions.Item label="机柜">
          {item.cabinetId || (item.type === 'cabinet' ? item.id : '—')}
        </Descriptions.Item>
        <Descriptions.Item label="数据来源">{item.source}</Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {new Date(item.collectedAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
      </Descriptions>
      <Space wrap>
        <Button type="primary" onClick={() => history.push(item.route)}>
          打开对象详情
        </Button>
        {sceneRoute && (
          <Button
            icon={<Box size={14} />}
            onClick={() => history.push(sceneRoute)}
          >
            在 3D 中定位
          </Button>
        )}
        <Button
          onClick={() =>
            history.push(
              `/monitor/alert?datacenterId=${item.datacenterId || item.id}&${item.type}Id=${item.id}`,
            )
          }
        >
          相关告警
        </Button>
        <Button
          icon={<Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />}
          onClick={onToggleFavorite}
        >
          {isFavorite ? '取消收藏' : '收藏资源'}
        </Button>
      </Space>
    </Space>
  );
};

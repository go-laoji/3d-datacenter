import { Empty, Space, Tag, Typography } from 'antd';
import {
  ArrowDown,
  BatteryCharging,
  Server,
  Unplug,
  UtilityPole,
  Zap,
} from 'lucide-react';
import type { PowerLink, PowerNode } from '@/services/idc/power';
import styles from './index.less';

interface Props {
  nodes: PowerNode[];
  links: PowerLink[];
  selectedId?: string;
  pathFilter?: 'A' | 'B';
  onSelect: (node: PowerNode) => void;
}

const nodeTypes: Array<{
  type: PowerNode['type'];
  label: string;
  icon: React.ReactNode;
}> = [
  { type: 'utility', label: '市电输入', icon: <UtilityPole size={17} /> },
  { type: 'ups', label: 'UPS', icon: <BatteryCharging size={17} /> },
  { type: 'pdu', label: 'PDU 配电', icon: <Zap size={17} /> },
  { type: 'device', label: 'IT 设备', icon: <Server size={17} /> },
];

const PowerTopologyGraph = ({
  nodes,
  links,
  selectedId,
  pathFilter,
  onSelect,
}: Props) => {
  const visibleNodeIds = new Set(
    pathFilter
      ? links
          .filter((link) => link.powerPath === pathFilter)
          .flatMap((link) => [link.source, link.target])
      : nodes.map((node) => node.id),
  );
  const visibleNodes = nodes.filter((node) => visibleNodeIds.has(node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  if (!visibleNodes.length) return <Empty description="当前路径暂无拓扑数据" />;

  return (
    <div className={styles.powerTopologyContainer}>
      <div className={styles.legend}>
        <Space wrap>
          <Tag color="blue">A 路</Tag>
          <Tag color="green">B 路</Tag>
          <Tag color="success">在线</Tag>
          <Tag color="warning">告警 / 延迟</Tag>
          <Typography.Text type="secondary">
            点击节点查看完整上下游路径和影响范围
          </Typography.Text>
        </Space>
      </div>
      <div className={styles.powerLayers}>
        {nodeTypes.map((layer, layerIndex) => {
          const items = visibleNodes.filter((node) => node.type === layer.type);
          if (!items.length) return null;
          return (
            <div className={styles.powerLayer} key={layer.type}>
              <div className={styles.layerLabel}>
                {layer.icon}
                {layer.label}
              </div>
              <div className={styles.layerNodes}>
                {items.map((node) => {
                  const incomingPaths = links
                    .filter((link) => link.target === node.id)
                    .map((link) => link.powerPath);
                  const loadPercent = node.capacity
                    ? Math.round(((node.load || 0) / node.capacity) * 100)
                    : undefined;
                  return (
                    <button
                      type="button"
                      key={node.id}
                      className={`${styles.powerNode} ${selectedId === node.id ? styles.selectedNode : ''} ${node.status !== 'online' ? styles.warningNode : ''}`}
                      onClick={() => onSelect(node)}
                    >
                      <span className={styles.nodeTitle}>{node.name}</span>
                      <span>
                        {incomingPaths.map((path) => (
                          <Tag
                            key={path}
                            color={path === 'A' ? 'blue' : 'green'}
                          >
                            {path}
                          </Tag>
                        ))}
                      </span>
                      <small>
                        {loadPercent === undefined
                          ? node.assetCode
                          : node.load === undefined
                            ? `额定 ${node.capacity} W`
                            : `${node.load} W / ${loadPercent}%`}
                      </small>
                    </button>
                  );
                })}
              </div>
              {layerIndex < nodeTypes.length - 1 && (
                <ArrowDown
                  className={styles.layerArrow}
                  size={18}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.linkLedger}>
        <Typography.Title level={5}>链路台账</Typography.Title>
        <div className={styles.linkList}>
          {links
            .filter((link) => !pathFilter || link.powerPath === pathFilter)
            .map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  const target = nodeById.get(link.target);
                  if (target) onSelect(target);
                }}
              >
                <Tag color={link.powerPath === 'A' ? 'blue' : 'green'}>
                  {link.powerPath}
                </Tag>
                {nodeById.get(link.source)?.name} →{' '}
                {nodeById.get(link.target)?.name}
                {link.status !== 'active' && <Unplug size={13} />}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PowerTopologyGraph;

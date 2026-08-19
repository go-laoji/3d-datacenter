import {
  Alert,
  Badge,
  Checkbox,
  Empty,
  Input,
  List,
  Segmented,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Box, Cable, Database, Network, Server, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { ResourceTreeItem } from '@/services/idc/resourceTree';
import styles from '../index.less';
import {
  buildResourceTree,
  filterResourceIndex,
  type ResourceTreeBranch,
} from '../resourceTreeModel';

interface Props {
  items: ResourceTreeItem[];
  selectedId?: string;
  expandedIds: string[];
  favorites: string[];
  recent: string[];
  keyword: string;
  anomaliesOnly: boolean;
  view: 'tree' | 'favorites' | 'recent';
  onKeywordChange: (value: string) => void;
  onAnomaliesChange: (value: boolean) => void;
  onViewChange: (value: 'tree' | 'favorites' | 'recent') => void;
  onExpandedChange: (ids: string[]) => void;
  onSelect: (item: ResourceTreeItem) => void;
}

const icons = {
  datacenter: <Database size={15} />,
  cabinet: <Box size={15} />,
  device: <Server size={15} />,
  pdu: <Zap size={15} />,
  port: <Network size={15} />,
  connection: <Cable size={15} />,
};

const statusColors = {
  normal: 'success',
  warning: 'warning',
  critical: 'error',
  offline: 'default',
};

const title = (item: ResourceTreeItem) => (
  <Space size={6} className={styles.nodeTitle}>
    {icons[item.type]}
    <span>{item.name}</span>
    {item.alertCount > 0 && <Badge count={item.alertCount} size="small" />}
    {item.status === 'offline' && <Tag>离线</Tag>}
  </Space>
);

const toTreeNode = (branch: ResourceTreeBranch): DataNode => ({
  key: branch.item.id,
  title: title(branch.item),
  children: branch.children.map(toTreeNode),
});

export const ResourceNavigator = ({
  items,
  selectedId,
  expandedIds,
  favorites,
  recent,
  keyword,
  anomaliesOnly,
  view,
  onKeywordChange,
  onAnomaliesChange,
  onViewChange,
  onExpandedChange,
  onSelect,
}: Props) => {
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const results = filterResourceIndex(items, keyword, anomaliesOnly);
  const viewItems =
    view === 'favorites'
      ? favorites.flatMap((id) => byId.get(id) || [])
      : recent.flatMap((id) => byId.get(id) || []);
  const treeData = buildResourceTree(items).map(toTreeNode);

  return (
    <>
      <Input.Search
        allowClear
        value={keyword}
        placeholder="名称、资产编码、IP、端口、链路…"
        onChange={(event) => onKeywordChange(event.target.value)}
      />
      <div className={styles.navigatorControls}>
        <Segmented
          block
          value={view}
          options={[
            { label: '资源层级', value: 'tree' },
            { label: `收藏 ${favorites.length}`, value: 'favorites' },
            { label: '最近访问', value: 'recent' },
          ]}
          onChange={(value) => onViewChange(value as Props['view'])}
        />
        <Checkbox
          checked={anomaliesOnly}
          onChange={(event) => onAnomaliesChange(event.target.checked)}
        >
          仅显示异常对象
        </Checkbox>
      </div>
      {keyword || anomaliesOnly ? (
        <List
          className={styles.resourceResults}
          dataSource={results}
          locale={{ emptyText: <Empty description="没有匹配的资源" /> }}
          renderItem={(item) => (
            <List.Item
              className={selectedId === item.id ? styles.selectedResult : ''}
            >
              <button
                type="button"
                className={styles.resultButton}
                onClick={() => onSelect(item)}
              >
                <span>{icons[item.type]}</span>
                <span>
                  <Space>
                    {item.name}
                    <Tag color={statusColors[item.status]}>{item.code}</Tag>
                  </Space>
                  <small>
                    {item.subtitle ||
                      `${item.type} · ${item.alertCount} 条活动告警`}
                  </small>
                </span>
              </button>
            </List.Item>
          )}
        />
      ) : view === 'tree' ? (
        <Tree
          className={styles.tree}
          blockNode
          showLine
          treeData={treeData}
          selectedKeys={selectedId ? [selectedId] : []}
          expandedKeys={expandedIds}
          onExpand={(keys) => onExpandedChange(keys.map(String))}
          onSelect={(keys) => {
            const selected = byId.get(String(keys[0] || ''));
            if (selected) onSelect(selected);
          }}
        />
      ) : viewItems.length ? (
        <List
          dataSource={viewItems}
          renderItem={(item) => (
            <List.Item>
              <button
                type="button"
                className={styles.resultButton}
                onClick={() => onSelect(item)}
              >
                <span>{icons[item.type]}</span>
                <span>
                  {item.name}
                  <small>{item.subtitle || item.code}</small>
                </span>
              </button>
            </List.Item>
          )}
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message={view === 'favorites' ? '尚未收藏资源' : '尚无最近访问'}
          description="从资源详情中收藏，或打开任意对象后再返回。"
        />
      )}
      <Typography.Text type="secondary" className={styles.indexHint}>
        索引覆盖 {items.length} 个对象 · 异常优先排序
      </Typography.Text>
    </>
  );
};

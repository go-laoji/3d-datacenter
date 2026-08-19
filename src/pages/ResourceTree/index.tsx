import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, Card, message, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  getResourceIndex,
  type ResourceTreeItem,
} from '@/services/idc/resourceTree';
import { ResourceDetailPanel } from './components/ResourceDetailPanel';
import { ResourceNavigator } from './components/ResourceNavigator';
import styles from './index.less';
import { getAncestorIds } from './resourceTreeModel';

const FAVORITES_KEY = 'resource-tree-favorites';
const RECENT_KEY = 'resource-tree-recent';

const readStoredIds = (key: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
};

const ResourceTree = () => {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('entityId') || undefined;
  const [items, setItems] = useState<ResourceTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [view, setView] = useState<'tree' | 'favorites' | 'recent'>('tree');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStoredIds(FAVORITES_KEY),
  );
  const [recent, setRecent] = useState<string[]>(() =>
    readStoredIds(RECENT_KEY),
  );
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );

  useEffect(() => {
    getResourceIndex()
      .then((response) => setItems(response.data || []))
      .catch(() => message.error('资源索引加载失败'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId || !items.length) return;
    setExpandedIds((current) =>
      Array.from(new Set([...current, ...getAncestorIds(selectedId, items)])),
    );
  }, [items, selectedId]);

  const selectItem = (item: ResourceTreeItem) => {
    const params = new URLSearchParams(window.location.search);
    params.set('entityId', item.id);
    history.replace(`/resource-tree?${params.toString()}`);
    setExpandedIds((current) =>
      Array.from(new Set([...current, ...getAncestorIds(item.id, items)])),
    );
    setRecent((current) => {
      const next = [item.id, ...current.filter((id) => id !== item.id)].slice(
        0,
        8,
      );
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = () => {
    if (!selectedItem) return;
    setFavorites((current) => {
      const next = current.includes(selectedItem.id)
        ? current.filter((id) => id !== selectedItem.id)
        : [selectedItem.id, ...current];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <PageContainer
      title="资源树"
      subTitle="跨数据中心、机柜、设备、PDU、端口和连接的统一资源入口"
    >
      <Alert
        className={styles.contextNotice}
        type="info"
        showIcon
        message="全局资源索引"
        description="支持名称、资产编码、管理 IP、端口和连接搜索；URL、收藏与最近访问可恢复工作上下文。"
      />
      <Spin spinning={loading}>
        <div className={styles.container}>
          <Card className={styles.treeCard} title="资源导航">
            <ResourceNavigator
              items={items}
              selectedId={selectedId}
              expandedIds={expandedIds}
              favorites={favorites}
              recent={recent}
              keyword={keyword}
              anomaliesOnly={anomaliesOnly}
              view={view}
              onKeywordChange={setKeyword}
              onAnomaliesChange={setAnomaliesOnly}
              onViewChange={setView}
              onExpandedChange={setExpandedIds}
              onSelect={selectItem}
            />
          </Card>
          <Card className={styles.detailCard} title="资源上下文">
            <ResourceDetailPanel
              item={selectedItem}
              isFavorite={Boolean(
                selectedItem && favorites.includes(selectedItem.id),
              )}
              onToggleFavorite={toggleFavorite}
            />
          </Card>
        </div>
      </Spin>
    </PageContainer>
  );
};

export default ResourceTree;

import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, App, Card } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DatacenterSceneRef } from '@/components/3d/DatacenterScene';
import type { InfoDensity } from '@/components/3d/InfoDisplay';
import { Datacenter3DStats } from './Datacenter3DStats';
import { Datacenter3DToolbar } from './Datacenter3DToolbar';
import { DatacenterSceneCanvas } from './DatacenterSceneCanvas';
import { DatacenterSceneDetailDrawer } from './DatacenterSceneDetailDrawer';
import {
  createSceneBookmark,
  filterSceneEntities,
  getSceneStats,
  normalizeSceneBookmarks,
  projectCabinetsForMode,
  type SceneBookmark,
  type SceneLodProfile,
  type SceneStatusFilter,
  type SceneViewMode,
} from './datacenter3dModel';
import styles from './index.less';
import { useDatacenter3DData } from './useDatacenter3DData';

const bookmarkStorageKey = 'datacenter-scene-bookmarks';

function isOneOf<T extends string>(
  value: string | null,
  values: readonly T[],
): value is T {
  return Boolean(value && values.includes(value as T));
}

function Datacenter3DPage() {
  const { message: messageApi } = App.useApp();
  const [searchParams] = useSearchParams();
  const sceneRef = useRef<DatacenterSceneRef>(null);
  const [selectedDatacenterId, setSelectedDatacenterId] = useState<
    string | undefined
  >(searchParams.get('datacenterId') || searchParams.get('id') || undefined);
  const [selectedCabinetId, setSelectedCabinetId] = useState<
    string | undefined
  >(searchParams.get('cabinetId') || undefined);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    searchParams.get('deviceId') || undefined,
  );
  const [mode, setMode] = useState<SceneViewMode>(() => {
    const value = searchParams.get('mode');
    return isOneOf(value, ['operations', 'temperature', 'capacity'])
      ? value
      : 'operations';
  });
  const [statusFilter, setStatusFilter] = useState<SceneStatusFilter>(() => {
    const value = searchParams.get('status');
    return isOneOf(value, ['all', 'abnormal', 'offline']) ? value : 'all';
  });
  const [infoDensity, setInfoDensity] = useState<InfoDensity>(() => {
    const value = searchParams.get('labels');
    return isOneOf(value, ['compact', 'normal', 'detailed']) ? value : 'normal';
  });
  const [lodProfile, setLodProfile] = useState<SceneLodProfile>(() => {
    const value = searchParams.get('lod');
    return isOneOf(value, ['detail', 'balanced', 'performance'])
      ? value
      : 'balanced';
  });
  const [showConnections, setShowConnections] = useState(
    searchParams.get('connections') !== '0',
  );
  const [highlightedDeviceId, setHighlightedDeviceId] = useState<string | null>(
    null,
  );
  const [highlightedCabinetId, setHighlightedCabinetId] = useState<
    string | null
  >(null);
  const [bookmarks, setBookmarks] = useState<SceneBookmark[]>(() => {
    try {
      return normalizeSceneBookmarks(
        JSON.parse(localStorage.getItem(bookmarkStorageKey) || '[]'),
      );
    } catch {
      return [];
    }
  });
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string>();

  const data = useDatacenter3DData(selectedDatacenterId);

  useEffect(() => {
    if (!selectedDatacenterId && data.datacenters[0]) {
      setSelectedDatacenterId(data.datacenters[0].id);
    }
  }, [data.datacenters, selectedDatacenterId]);

  useEffect(() => {
    if (!selectedDatacenterId) return;
    const params = new URLSearchParams();
    params.set('datacenterId', selectedDatacenterId);
    params.set('mode', mode);
    params.set('status', statusFilter);
    params.set('labels', infoDensity);
    params.set('lod', lodProfile);
    if (!showConnections) params.set('connections', '0');
    if (selectedCabinetId) params.set('cabinetId', selectedCabinetId);
    if (selectedDeviceId) params.set('deviceId', selectedDeviceId);
    history.replace(`/datacenter3d?${params.toString()}`);
  }, [
    infoDensity,
    lodProfile,
    mode,
    selectedCabinetId,
    selectedDatacenterId,
    selectedDeviceId,
    showConnections,
    statusFilter,
  ]);

  const projectedCabinets = useMemo(
    () => projectCabinetsForMode(data.cabinets, mode, data.temperatures),
    [data.cabinets, data.temperatures, mode],
  );
  const visibleEntities = useMemo(
    () => filterSceneEntities(projectedCabinets, data.devices, statusFilter),
    [data.devices, projectedCabinets, statusFilter],
  );
  const stats = useMemo(
    () =>
      getSceneStats(
        visibleEntities.cabinets,
        visibleEntities.devices,
        showConnections ? data.connections : [],
      ),
    [data.connections, showConnections, visibleEntities],
  );
  const selectedCabinet =
    data.cabinets.find((cabinet) => cabinet.id === selectedCabinetId) || null;
  const selectedDevice =
    data.devices.find((device) => device.id === selectedDeviceId) || null;

  const focusDevice = (device: IDC.Device) => {
    const cabinet = data.cabinets.find(
      (candidate) => candidate.id === device.cabinetId,
    );
    if (!cabinet) return;
    const layoutItem = data.layout?.cabinets.find(
      (item) => item.cabinetId === cabinet.id,
    );
    const x = layoutItem?.x ?? (cabinet.column - 1) * 0.8;
    const z = layoutItem?.y ?? (cabinet.row - 1) * 1.5;
    sceneRef.current?.focusOnPosition([x, device.startU * 0.0445, z]);
  };

  const selectDevice = (device: IDC.Device) => {
    setStatusFilter('all');
    setSelectedCabinetId(undefined);
    setSelectedDeviceId(device.id);
    setHighlightedCabinetId(device.cabinetId);
    setHighlightedDeviceId(device.id);
    focusDevice(device);
    window.setTimeout(() => {
      setHighlightedCabinetId(null);
      setHighlightedDeviceId(null);
    }, 2500);
  };

  const persistBookmarks = (next: SceneBookmark[]) => {
    setBookmarks(next);
    localStorage.setItem(bookmarkStorageKey, JSON.stringify(next));
  };

  const saveBookmark = () => {
    if (!selectedDatacenterId) return;
    const datacenter = data.datacenters.find(
      (item) => item.id === selectedDatacenterId,
    );
    const bookmark = createSceneBookmark({
      name: `${datacenter?.name || selectedDatacenterId} · ${
        mode === 'temperature' ? '温度' : mode === 'capacity' ? '容量' : '运行'
      } · ${new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      datacenterId: selectedDatacenterId,
      mode,
      statusFilter,
      showConnections,
      infoDensity,
      lodProfile,
      selectedCabinetId,
      selectedDeviceId,
    });
    persistBookmarks([bookmark, ...bookmarks].slice(0, 6));
    setSelectedBookmarkId(bookmark.id);
    messageApi.success('当前场景已保存为本地书签');
  };

  const restoreBookmark = (id: string) => {
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return;
    setSelectedBookmarkId(id);
    setSelectedDatacenterId(bookmark.datacenterId);
    setMode(bookmark.mode);
    setStatusFilter(bookmark.statusFilter);
    setShowConnections(bookmark.showConnections);
    setInfoDensity(bookmark.infoDensity);
    setLodProfile(bookmark.lodProfile);
    setSelectedCabinetId(bookmark.selectedCabinetId);
    setSelectedDeviceId(bookmark.selectedDeviceId);
    messageApi.success('场景书签已恢复');
  };

  return (
    <PageContainer
      header={{
        title: '数据中心 3D 运行视图',
        subTitle: '统一查看布局、容量、环境、设备状态与物理连线',
      }}
    >
      {data.error && (
        <Alert
          className={styles.errorAlert}
          type="error"
          showIcon
          message={data.error}
          action={<a onClick={() => void data.refresh()}>重新加载</a>}
        />
      )}
      <Card className={styles.card3d}>
        <Datacenter3DToolbar
          datacenters={data.datacenters}
          devices={data.devices}
          selectedDatacenterId={selectedDatacenterId}
          selectedDeviceId={selectedDeviceId}
          mode={mode}
          statusFilter={statusFilter}
          infoDensity={infoDensity}
          lodProfile={lodProfile}
          showConnections={showConnections}
          bookmarks={bookmarks}
          selectedBookmarkId={selectedBookmarkId}
          loading={data.loading}
          onDatacenterChange={(id) => {
            setSelectedDatacenterId(id);
            setSelectedCabinetId(undefined);
            setSelectedDeviceId(undefined);
          }}
          onDeviceSelect={(id) => {
            const device = data.devices.find((item) => item.id === id);
            if (device) selectDevice(device);
          }}
          onModeChange={setMode}
          onStatusFilterChange={setStatusFilter}
          onInfoDensityChange={setInfoDensity}
          onLodProfileChange={setLodProfile}
          onConnectionsChange={setShowConnections}
          onBookmarkSelect={restoreBookmark}
          onBookmarkSave={saveBookmark}
          onBookmarkRemove={(id) => {
            persistBookmarks(bookmarks.filter((item) => item.id !== id));
            setSelectedBookmarkId(undefined);
            messageApi.success('场景书签已删除');
          }}
          onReset={() => sceneRef.current?.resetCamera()}
          onRefresh={() => void data.refresh()}
        />
        <Datacenter3DStats
          stats={stats}
          refreshedAt={data.refreshedAt}
          filtered={statusFilter !== 'all'}
        />
        <DatacenterSceneCanvas
          sceneRef={sceneRef}
          sceneKey={selectedDatacenterId || 'empty'}
          cabinets={visibleEntities.cabinets}
          devices={visibleEntities.devices}
          connections={showConnections ? data.connections : []}
          templates={data.templates}
          layout={data.layout}
          temperatures={data.temperatures}
          selectedCabinet={selectedCabinet}
          selectedDevice={selectedDevice}
          highlightedCabinetId={highlightedCabinetId}
          highlightedDeviceId={highlightedDeviceId}
          mode={mode}
          statusFilter={statusFilter}
          infoDensity={infoDensity}
          lodProfile={lodProfile}
          loading={data.loading}
          onCabinetSelect={(cabinet) => {
            setSelectedCabinetId(cabinet?.id);
            setSelectedDeviceId(undefined);
          }}
          onDeviceSelect={(device) => {
            if (device) selectDevice(device);
            else setSelectedDeviceId(undefined);
          }}
          onClearFilter={() => setStatusFilter('all')}
        />
        <div className={styles.hint}>
          单击查看详情 · 双击聚焦 · 右键拖动旋转 · 滚轮缩放 · R 重置镜头 · Esc
          清除选择
        </div>
      </Card>

      <DatacenterSceneDetailDrawer
        cabinet={selectedCabinet}
        device={selectedDevice}
        cabinets={data.cabinets}
        devices={data.devices}
        templates={data.templates}
        connections={data.connections}
        temperatures={data.temperatures}
        onClose={() => {
          setSelectedCabinetId(undefined);
          setSelectedDeviceId(undefined);
        }}
        onDeviceSelect={selectDevice}
        onFocus={focusDevice}
      />
    </PageContainer>
  );
}

export default Datacenter3DPage;

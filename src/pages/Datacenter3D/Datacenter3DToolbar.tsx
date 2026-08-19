import { Button, Segmented, Select, Space, Switch, Tooltip } from 'antd';
import {
  Bookmark,
  Cable,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import type { InfoDensity } from '@/components/3d/InfoDisplay';
import type {
  SceneBookmark,
  SceneLodProfile,
  SceneStatusFilter,
  SceneViewMode,
} from './datacenter3dModel';
import styles from './index.less';
import type { DatacenterOption } from './useDatacenter3DData';

interface Datacenter3DToolbarProps {
  datacenters: DatacenterOption[];
  devices: IDC.Device[];
  selectedDatacenterId?: string;
  selectedDeviceId?: string;
  mode: SceneViewMode;
  statusFilter: SceneStatusFilter;
  infoDensity: InfoDensity;
  lodProfile: SceneLodProfile;
  showConnections: boolean;
  bookmarks: SceneBookmark[];
  selectedBookmarkId?: string;
  loading: boolean;
  onDatacenterChange: (id: string) => void;
  onDeviceSelect: (id: string) => void;
  onModeChange: (mode: SceneViewMode) => void;
  onStatusFilterChange: (filter: SceneStatusFilter) => void;
  onInfoDensityChange: (density: InfoDensity) => void;
  onLodProfileChange: (profile: SceneLodProfile) => void;
  onConnectionsChange: (visible: boolean) => void;
  onBookmarkSelect: (id: string) => void;
  onBookmarkSave: () => void;
  onBookmarkRemove: (id: string) => void;
  onReset: () => void;
  onRefresh: () => void;
}

export function Datacenter3DToolbar({
  datacenters,
  devices,
  selectedDatacenterId,
  selectedDeviceId,
  mode,
  statusFilter,
  infoDensity,
  lodProfile,
  showConnections,
  bookmarks,
  selectedBookmarkId,
  loading,
  onDatacenterChange,
  onDeviceSelect,
  onModeChange,
  onStatusFilterChange,
  onInfoDensityChange,
  onLodProfileChange,
  onConnectionsChange,
  onBookmarkSelect,
  onBookmarkSave,
  onBookmarkRemove,
  onReset,
  onRefresh,
}: Datacenter3DToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="3D 场景控制台">
      <div className={styles.toolbarGroup}>
        <Select
          aria-label="选择数据中心"
          className={styles.datacenterSelect}
          placeholder="选择数据中心"
          value={selectedDatacenterId}
          onChange={onDatacenterChange}
          options={datacenters.map((datacenter) => ({
            value: datacenter.id,
            label: `${datacenter.name} · ${datacenter.code}`,
          }))}
        />
        <Select
          showSearch
          allowClear
          aria-label="搜索场景设备"
          className={styles.deviceSearch}
          placeholder="搜索设备名 / IP / 资产码"
          value={selectedDeviceId}
          suffixIcon={<Search size={14} />}
          optionFilterProp="searchText"
          onChange={(id) => id && onDeviceSelect(id)}
          options={devices.map((device) => ({
            value: device.id,
            searchText: [device.name, device.managementIp, device.assetCode]
              .filter(Boolean)
              .join(' '),
            label: `${device.name} · ${device.managementIp || device.assetCode}`,
          }))}
        />
        <Segmented<SceneViewMode>
          aria-label="场景视图模式"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'operations', label: '运行' },
            { value: 'temperature', label: '温度' },
            { value: 'capacity', label: '容量' },
          ]}
        />
        <Select<SceneStatusFilter>
          aria-label="状态筛选"
          className={styles.compactSelect}
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'abnormal', label: '仅告警 / 故障' },
            { value: 'offline', label: '仅离线' },
          ]}
        />
      </div>

      <div className={styles.toolbarGroup}>
        <Select<InfoDensity>
          aria-label="标签密度"
          className={styles.compactSelect}
          value={infoDensity}
          onChange={onInfoDensityChange}
          options={[
            { value: 'compact', label: '精简标签' },
            { value: 'normal', label: '标准标签' },
            { value: 'detailed', label: '详细标签' },
          ]}
        />
        <Select<SceneLodProfile>
          aria-label="场景性能档位"
          className={styles.compactSelect}
          value={lodProfile}
          onChange={onLodProfileChange}
          options={[
            { value: 'detail', label: 'LOD 精细' },
            { value: 'balanced', label: 'LOD 均衡' },
            { value: 'performance', label: 'LOD 流畅' },
          ]}
        />
        <Space size={6}>
          <Cable size={15} aria-hidden />
          <span className={styles.controlLabel}>连线</span>
          <Switch
            size="small"
            aria-label="显示场景连线"
            checked={showConnections}
            onChange={onConnectionsChange}
          />
        </Space>
        <Select
          allowClear
          aria-label="场景书签"
          className={styles.bookmarkSelect}
          placeholder="场景书签"
          value={selectedBookmarkId}
          onChange={(id) => id && onBookmarkSelect(id)}
          options={bookmarks.map((bookmark) => ({
            value: bookmark.id,
            label: bookmark.name,
          }))}
          notFoundContent="暂无书签"
        />
        <Tooltip title="保存当前筛选、标签、LOD 和选中对象">
          <Button
            aria-label="保存当前场景书签"
            icon={<Bookmark size={15} />}
            onClick={onBookmarkSave}
          >
            保存视图
          </Button>
        </Tooltip>
        {selectedBookmarkId && (
          <Tooltip title="删除当前场景书签">
            <Button
              aria-label="删除当前场景书签"
              danger
              icon={<Trash2 size={15} />}
              onClick={() => onBookmarkRemove(selectedBookmarkId)}
            />
          </Tooltip>
        )}
        <Tooltip title="重置镜头">
          <Button
            aria-label="重置 3D 镜头"
            icon={<RotateCcw size={15} />}
            onClick={onReset}
          />
        </Tooltip>
        <Tooltip title="重新加载 Mock 场景数据">
          <Button
            aria-label="刷新 3D 场景数据"
            icon={<RefreshCw size={15} />}
            loading={loading}
            onClick={onRefresh}
          />
        </Tooltip>
      </div>
    </div>
  );
}

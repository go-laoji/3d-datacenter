import { history } from '@umijs/max';
import { Button, Segmented, Select, Space, Switch, Tooltip } from 'antd';
import { Building2, Layout, RefreshCw } from 'lucide-react';
import type { CabinetDeviceFilter, CabinetViewPreset } from './cabinet3dModel';
import styles from './index.less';

interface Cabinet3DToolbarProps {
  cabinet: IDC.Cabinet;
  preset: CabinetViewPreset;
  filter: CabinetDeviceFilter;
  showDoor: boolean;
  showEmptySlots: boolean;
  exploded: boolean;
  loading: boolean;
  onPresetChange: (preset: CabinetViewPreset) => void;
  onFilterChange: (filter: CabinetDeviceFilter) => void;
  onShowDoorChange: (value: boolean) => void;
  onShowEmptySlotsChange: (value: boolean) => void;
  onExplodedChange: (value: boolean) => void;
  onRefresh: () => void;
}

export function Cabinet3DToolbar({
  cabinet,
  preset,
  filter,
  showDoor,
  showEmptySlots,
  exploded,
  loading,
  onPresetChange,
  onFilterChange,
  onShowDoorChange,
  onShowEmptySlotsChange,
  onExplodedChange,
  onRefresh,
}: Cabinet3DToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="机柜 3D 控制台">
      <Space wrap>
        <Segmented<CabinetViewPreset>
          aria-label="镜头预设"
          value={preset}
          onChange={onPresetChange}
          options={[
            { value: 'overview', label: '总览' },
            { value: 'front', label: '前视' },
            { value: 'rear', label: '后视' },
            { value: 'left', label: '侧视' },
          ]}
        />
        <Select<CabinetDeviceFilter>
          aria-label="设备状态筛选"
          className={styles.filterSelect}
          value={filter}
          onChange={onFilterChange}
          options={[
            { value: 'all', label: '全部设备' },
            { value: 'abnormal', label: '仅告警 / 故障' },
            { value: 'offline', label: '仅离线' },
          ]}
        />
      </Space>
      <Space wrap>
        <Space size={6}>
          <span>柜门</span>
          <Switch
            size="small"
            aria-label="显示机柜门"
            checked={showDoor}
            onChange={onShowDoorChange}
          />
        </Space>
        <Space size={6}>
          <span>空 U</span>
          <Switch
            size="small"
            aria-label="显示空 U 位"
            checked={showEmptySlots}
            onChange={onShowEmptySlotsChange}
          />
        </Space>
        <Space size={6}>
          <span>爆炸视图</span>
          <Switch
            size="small"
            aria-label="启用爆炸视图"
            checked={exploded}
            onChange={onExplodedChange}
          />
        </Space>
        <Tooltip title="回到数据中心 3D 并保留机柜选中状态">
          <Button
            icon={<Building2 size={15} />}
            onClick={() =>
              history.push(
                `/datacenter3d?datacenterId=${cabinet.datacenterId}&cabinetId=${cabinet.id}`,
              )
            }
          >
            数据中心 3D
          </Button>
        </Tooltip>
        <Button
          icon={<Layout size={15} />}
          onClick={() =>
            history.push(`/layout?datacenterId=${cabinet.datacenterId}`)
          }
        >
          布局定位
        </Button>
        <Tooltip title="刷新 Mock 机柜与端口数据">
          <Button
            aria-label="刷新机柜 3D 数据"
            icon={<RefreshCw size={15} />}
            loading={loading}
            onClick={onRefresh}
          />
        </Tooltip>
      </Space>
    </div>
  );
}

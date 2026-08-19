import { Canvas } from '@react-three/fiber';
import { Button, Empty } from 'antd';
import { Suspense } from 'react';
import { CabinetRackScene } from './CabinetRackScene';
import type { CabinetDeviceFilter, CabinetViewPreset } from './cabinet3dModel';
import styles from './index.less';

interface CabinetRackCanvasProps {
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  allDevices: IDC.Device[];
  templates: IDC.DeviceTemplate[];
  devicePorts: Record<string, IDC.Port[]>;
  selectedDevice: IDC.Device | null;
  preset: CabinetViewPreset;
  filter: CabinetDeviceFilter;
  showDoor: boolean;
  showEmptySlots: boolean;
  exploded: boolean;
  onDeviceSelect: (device: IDC.Device) => void;
  onClearFilter: () => void;
}

export function CabinetRackCanvas({
  cabinet,
  devices,
  allDevices,
  templates,
  devicePorts,
  selectedDevice,
  preset,
  filter,
  showDoor,
  showEmptySlots,
  exploded,
  onDeviceSelect,
  onClearFilter,
}: CabinetRackCanvasProps) {
  return (
    <div className={styles.canvasContainer}>
      {devices.length === 0 && filter !== 'all' ? (
        <Empty className={styles.emptyFilter} description="当前筛选下没有设备">
          <Button onClick={onClearFilter}>查看全部设备</Button>
        </Empty>
      ) : (
        <Canvas shadows onPointerMissed={() => undefined}>
          <Suspense fallback={null}>
            <CabinetRackScene
              cabinet={cabinet}
              devices={devices}
              allDevices={allDevices}
              templates={templates}
              devicePorts={devicePorts}
              selectedDevice={selectedDevice}
              preset={preset}
              showDoor={showDoor}
              showEmptySlots={showEmptySlots}
              exploded={exploded}
              onDeviceSelect={onDeviceSelect}
            />
          </Suspense>
        </Canvas>
      )}
      <div className={styles.hint}>
        拖动旋转 · 滚轮缩放 · 选择设备查看固定详情 · 镜头预设可快速定位前后面板
      </div>
    </div>
  );
}

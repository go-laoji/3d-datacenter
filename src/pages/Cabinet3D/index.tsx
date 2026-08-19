import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, App, Empty, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Cabinet3DToolbar } from './Cabinet3DToolbar';
import { CabinetDevicePanel } from './CabinetDevicePanel';
import { CabinetOverviewPanel } from './CabinetOverviewPanel';
import { CabinetRackCanvas } from './CabinetRackCanvas';
import {
  type CabinetDeviceFilter,
  type CabinetViewPreset,
  filterCabinetDevices,
  getCabinet3DStats,
} from './cabinet3dModel';
import styles from './index.less';
import { useCabinet3DData } from './useCabinet3DData';

function Cabinet3DPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const cabinetId = searchParams.get('id') || searchParams.get('cabinetId');
  const initialView = searchParams.get('view');
  const initialFilter = searchParams.get('filter');
  const [preset, setPreset] = useState<CabinetViewPreset>(
    initialView === 'front' || initialView === 'rear' || initialView === 'left'
      ? initialView
      : 'overview',
  );
  const [filter, setFilter] = useState<CabinetDeviceFilter>(
    initialFilter === 'abnormal' || initialFilter === 'offline'
      ? initialFilter
      : 'all',
  );
  const [showDoor, setShowDoor] = useState(searchParams.get('door') !== '0');
  const [showEmptySlots, setShowEmptySlots] = useState(
    searchParams.get('empty') !== '0',
  );
  const [exploded, setExploded] = useState(searchParams.get('explode') === '1');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    searchParams.get('deviceId') || undefined,
  );
  const data = useCabinet3DData(cabinetId);

  useEffect(() => {
    if (!cabinetId) return;
    const params = new URLSearchParams({ id: cabinetId, view: preset, filter });
    if (!showDoor) params.set('door', '0');
    if (!showEmptySlots) params.set('empty', '0');
    if (exploded) params.set('explode', '1');
    if (selectedDeviceId) params.set('deviceId', selectedDeviceId);
    history.replace(`/cabinet3d?${params.toString()}`);
  }, [
    cabinetId,
    exploded,
    filter,
    preset,
    selectedDeviceId,
    showDoor,
    showEmptySlots,
  ]);

  const visibleDevices = useMemo(
    () => filterCabinetDevices(data.devices, filter),
    [data.devices, filter],
  );
  const selectedDevice =
    data.devices.find((device) => device.id === selectedDeviceId) || null;
  const selectedTemplate = selectedDevice
    ? data.templates.find(
        (template) => template.id === selectedDevice.templateId,
      )
    : undefined;
  const stats = useMemo(
    () => (data.cabinet ? getCabinet3DStats(data.cabinet, data.devices) : null),
    [data.cabinet, data.devices],
  );

  if (!cabinetId) {
    return (
      <PageContainer>
        <Empty description="未指定机柜 ID" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: data.cabinet?.name || '机柜 3D 运行视图',
        subTitle: data.cabinet
          ? `${data.cabinet.code} · ${data.cabinet.row} 排 ${data.cabinet.column} 列`
          : '正在加载机柜上下文',
        onBack: () => history.back(),
      }}
    >
      {data.error && (
        <Alert
          type="error"
          showIcon
          className={styles.errorAlert}
          message={data.error}
          action={<a onClick={() => void data.refresh()}>重新加载</a>}
        />
      )}

      {data.cabinet && stats ? (
        <div className={styles.pageSurface}>
          <Cabinet3DToolbar
            cabinet={data.cabinet}
            preset={preset}
            filter={filter}
            showDoor={showDoor}
            showEmptySlots={showEmptySlots}
            exploded={exploded}
            loading={data.loading}
            onPresetChange={setPreset}
            onFilterChange={setFilter}
            onShowDoorChange={setShowDoor}
            onShowEmptySlotsChange={setShowEmptySlots}
            onExplodedChange={setExploded}
            onRefresh={() => {
              void data.refresh().then(() => message.success('机柜数据已刷新'));
            }}
          />
          <div className={styles.container}>
            <CabinetOverviewPanel
              cabinet={data.cabinet}
              stats={stats}
              visibleDeviceCount={visibleDevices.length}
              refreshedAt={data.refreshedAt}
            />
            <div className={styles.sceneColumn}>
              <CabinetRackCanvas
                cabinet={data.cabinet}
                devices={visibleDevices}
                allDevices={data.devices}
                templates={data.templates}
                devicePorts={data.devicePorts}
                selectedDevice={selectedDevice}
                preset={preset}
                filter={filter}
                showDoor={showDoor}
                showEmptySlots={showEmptySlots}
                exploded={exploded}
                onDeviceSelect={(device) => {
                  setSelectedDeviceId(device.id);
                  if (filter !== 'all') setFilter('all');
                }}
                onClearFilter={() => setFilter('all')}
              />
              {selectedDevice && (
                <CabinetDevicePanel
                  device={selectedDevice}
                  template={selectedTemplate}
                  ports={data.devicePorts[selectedDevice.id] || []}
                  onClose={() => setSelectedDeviceId(undefined)}
                  onFocus={() => {
                    setPreset('front');
                    setFilter('all');
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : data.loading ? (
        <div className={styles.pageLoading}>
          <Spin size="large" />
          <span>正在加载机柜 3D 数据</span>
        </div>
      ) : (
        !data.error && <Empty description="未找到机柜数据" />
      )}
    </PageContainer>
  );
}

export default Cabinet3DPage;

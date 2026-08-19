import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, App, Empty, Spin } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { AutoLayoutDialog } from './AutoLayoutDialog';
import styles from './index.less';
import { LayoutAssetPanel, type LayoutLayers } from './LayoutAssetPanel';
import { LayoutCanvas } from './LayoutCanvas';
import { LayoutEditorToolbar } from './LayoutEditorToolbar';
import { LayoutInspector } from './LayoutInspector';
import { LayoutSessionBanners } from './LayoutSessionBanners';
import { LayoutTransferModal } from './LayoutTransferModal';
import {
  type AutoLayoutOptions,
  generateAutoLayout,
  getPendingCabinets,
  type LayoutSelection,
  moveLayoutObject,
  removeLayoutObject,
  summarizeLayoutDiff,
} from './layoutEditorModel';
import { isEditableKeyboardTarget } from './layoutEditorSession';
import { useLayoutEditorSession } from './useLayoutEditorSession';

const zoneNames: Record<IDC.LayoutZoneType, string> = {
  zone: '普通区域',
  hot_aisle: '热通道',
  cold_aisle: '冷通道',
  restricted: '受限区域',
  other: '其他区域',
};

const facilityNames: Record<IDC.LayoutFacilityType, string> = {
  ups: 'UPS',
  crac: '精密空调',
  pdu: 'PDU',
  sensor: '环境传感器',
  door: '门禁',
  camera: '摄像头',
  fire_extinguisher: '消防设施',
  other: '其他设施',
};

function DatacenterLayoutPage() {
  const { message, modal } = App.useApp();
  const [searchParams] = useSearchParams();
  const [selectedDatacenterId, setSelectedDatacenterId] = useState<
    string | undefined
  >(searchParams.get('datacenterId') || searchParams.get('id') || undefined);
  const [selection, setSelection] = useState<LayoutSelection | null>(null);
  const [layers, setLayers] = useState<LayoutLayers>({
    grid: true,
    cabinets: true,
    zones: true,
    facilities: true,
  });
  const [zoom, setZoom] = useState(1);
  const [centerNonce, setCenterNonce] = useState(0);
  const [canvasActive, setCanvasActive] = useState(false);
  const [autoLayoutOpen, setAutoLayoutOpen] = useState(false);
  const [previewLayout, setPreviewLayout] =
    useState<IDC.DatacenterLayout | null>(null);
  const [transferMode, setTransferMode] = useState<'import' | 'export' | null>(
    null,
  );
  const session = useLayoutEditorSession(selectedDatacenterId);

  useEffect(() => {
    if (!selectedDatacenterId && session.datacenters[0]) {
      setSelectedDatacenterId(session.datacenters[0].id);
    }
  }, [selectedDatacenterId, session.datacenters]);

  useEffect(() => {
    if (!selectedDatacenterId) return;
    history.replace(`/layout?datacenterId=${selectedDatacenterId}`);
  }, [selectedDatacenterId]);

  const pendingCabinets = useMemo(
    () =>
      session.workingCopy
        ? getPendingCabinets(session.cabinets, session.workingCopy)
        : [],
    [session.cabinets, session.workingCopy],
  );
  const searchOptions = useMemo(() => {
    if (!session.workingCopy) return [];
    const cabinetById = new Map(
      session.cabinets.map((cabinet) => [cabinet.id, cabinet] as const),
    );
    return [
      ...session.workingCopy.cabinets.map((item) => ({
        value: `cabinet:${item.cabinetId}`,
        label:
          cabinetById.get(item.cabinetId)?.name ||
          cabinetById.get(item.cabinetId)?.code ||
          item.cabinetId,
        selection: {
          kind: 'cabinet' as const,
          id: item.cabinetId,
        },
      })),
      ...session.workingCopy.zones.map((zone) => ({
        value: `zone:${zone.id}`,
        label: zone.name || zoneNames[zone.type],
        selection: { kind: 'zone' as const, id: zone.id },
      })),
      ...session.workingCopy.facilities.map((facility) => ({
        value: `facility:${facility.id}`,
        label: facility.name || facilityNames[facility.type],
        selection: { kind: 'facility' as const, id: facility.id },
      })),
    ];
  }, [session.cabinets, session.workingCopy]);

  const save = async (force = false) => {
    const saved = await session.save(force);
    if (saved) message.success(force ? '已另存为新的布局版本' : '布局已保存');
  };

  const confirmDiscard = (action: () => void, title: string) => {
    if (!session.dirty) {
      action();
      return;
    }
    modal.confirm({
      title,
      content: '当前工作副本含有未保存修改，本地草稿仍会保留。',
      okText: '继续',
      cancelText: '留在当前布局',
      okButtonProps: { danger: true },
      onOk: action,
    });
  };

  const deleteSelection = () => {
    if (!selection || !session.workingCopy) return;
    const workingCopy = session.workingCopy;
    const highRiskFacility =
      selection.kind === 'facility' &&
      session.workingCopy.facilities.find((item) => item.id === selection.id)
        ?.type === 'fire_extinguisher';
    modal.confirm({
      title: `从布局移除 1 个${selection.kind === 'cabinet' ? '机柜' : selection.kind === 'zone' ? '区域' : '设施'}`,
      content: highRiskFacility
        ? '该对象属于消防设施。只会从布局中移除展示位置，不会删除资产记录。'
        : '此操作只修改布局工作副本，保存前仍可撤销。',
      okText: '移除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        session.apply(removeLayoutObject(workingCopy, selection));
        setSelection(null);
      },
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!canvasActive || isEditableKeyboardTarget(event.target)) return;
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (session.dirty && !session.conflictLayout) void save();
      } else if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) session.redo();
        else session.undo();
      } else if (command && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        session.redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selection) {
          event.preventDefault();
          deleteSelection();
        }
      } else if (event.key === 'Escape') {
        setSelection(null);
        setPreviewLayout(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    canvasActive,
    selection,
    session.conflictLayout,
    session.dirty,
    session.redo,
    session.undo,
  ]);

  if (!selectedDatacenterId && session.datacenters.length === 0) {
    return (
      <PageContainer>
        <Empty description="暂无可编辑的数据中心" />
      </PageContainer>
    );
  }

  const workingCopy = session.workingCopy;

  return (
    <PageContainer
      header={{
        title: '数据中心布局编辑器',
        subTitle: '版本化编辑空间、机柜、冷热通道与基础设施位置',
      }}
    >
      <LayoutEditorToolbar
        datacenters={session.datacenters}
        selectedDatacenterId={selectedDatacenterId}
        loadedVersion={session.serverLayout?.version}
        dirty={session.dirty}
        saving={session.saving}
        conflicted={Boolean(session.conflictLayout)}
        loading={session.loading}
        canUndo={session.canUndo}
        canRedo={session.canRedo}
        zoom={zoom}
        searchOptions={searchOptions}
        onDatacenterChange={(id) =>
          confirmDiscard(() => {
            setSelectedDatacenterId(id);
            setSelection(null);
            setPreviewLayout(null);
          }, '切换数据中心？')
        }
        onSearchSelect={(nextSelection) => {
          setSelection(nextSelection);
          setCenterNonce((value) => value + 1);
        }}
        onZoomChange={setZoom}
        onUndo={session.undo}
        onRedo={session.redo}
        onAutoLayout={() => setAutoLayoutOpen(true)}
        onImport={() => setTransferMode('import')}
        onExport={() => setTransferMode('export')}
        onRefresh={() =>
          confirmDiscard(() => {
            void session.load();
            setSelection(null);
            setPreviewLayout(null);
          }, '重新加载服务端布局？')
        }
        onSave={() => void save()}
      />

      <LayoutSessionBanners
        draft={session.draftCandidate}
        conflictLayout={session.conflictLayout}
        previewing={Boolean(previewLayout)}
        saving={session.saving}
        onRestoreDraft={session.restoreDraft}
        onDiscardDraft={session.discardDraft}
        onCompareConflict={() => {
          if (!session.workingCopy || !session.conflictLayout) return;
          const diff = summarizeLayoutDiff(
            session.workingCopy,
            session.conflictLayout,
          );
          modal.info({
            title: '本地与服务端差异',
            content: (
              <div>
                <p>机柜位置差异：{diff.cabinetChanges} 项</p>
                <p>区域差异：{diff.zoneChanges} 项</p>
                <p>设施差异：{diff.facilityChanges} 项</p>
                <p>画布设置：{diff.canvasChanged ? '有变化' : '无变化'}</p>
              </div>
            ),
          });
        }}
        onUseServerVersion={() => {
          session.acceptServerVersion();
          setSelection(null);
          message.success('已加载最新服务端布局');
        }}
        onForceSave={() => void save(true)}
        onAcceptPreview={() => {
          if (previewLayout) session.apply(previewLayout);
          setPreviewLayout(null);
          message.success('自动布局已写入工作副本，可继续调整或撤销');
        }}
        onCancelPreview={() => setPreviewLayout(null)}
      />

      {session.error && (
        <Alert
          type="error"
          showIcon
          className={styles.errorAlert}
          message={session.error}
          action={<a onClick={() => void session.load()}>重试</a>}
        />
      )}

      {workingCopy ? (
        <>
          {session.draftSavedAt && session.dirty && (
            <div className={styles.draftStatus}>
              本地草稿已于 {dayjs(session.draftSavedAt).format('HH:mm:ss')}{' '}
              自动保存
            </div>
          )}
          <div className={styles.editorGrid}>
            <LayoutAssetPanel
              pendingCabinets={pendingCabinets}
              layers={layers}
              onLayersChange={setLayers}
              onAddCabinet={(cabinet) => {
                const index = workingCopy.cabinets.length;
                session.apply({
                  ...workingCopy,
                  cabinets: [
                    ...workingCopy.cabinets,
                    {
                      cabinetId: cabinet.id,
                      x: 2 + (index % 8) * 1.2,
                      y: 2 + Math.floor(index / 8) * 1.8,
                      rotation: 0,
                    },
                  ],
                });
                setSelection({ kind: 'cabinet', id: cabinet.id });
              }}
              onAddZone={(type) => {
                const id = `zone-${Date.now()}`;
                session.apply({
                  ...workingCopy,
                  zones: [
                    ...workingCopy.zones,
                    {
                      id,
                      type,
                      name: zoneNames[type],
                      x: 2,
                      y: 2,
                      width: type === 'zone' ? 5 : 8,
                      height: type === 'zone' ? 4 : 1.2,
                      rotation: 0,
                    },
                  ],
                });
                setSelection({ kind: 'zone', id });
              }}
              onAddFacility={(type) => {
                const id = `facility-${Date.now()}`;
                session.apply({
                  ...workingCopy,
                  facilities: [
                    ...workingCopy.facilities,
                    {
                      id,
                      type,
                      name: facilityNames[type],
                      x: 3,
                      y: 3,
                      rotation: 0,
                    },
                  ],
                });
                setSelection({ kind: 'facility', id });
              }}
            />
            <LayoutCanvas
              layout={workingCopy}
              previewLayout={previewLayout}
              cabinets={session.cabinets}
              selection={selection}
              layers={layers}
              zoom={zoom}
              centerNonce={centerNonce}
              onSelect={setSelection}
              onMove={(object, x, y) =>
                session.apply(moveLayoutObject(workingCopy, object, x, y))
              }
              onCanvasActiveChange={setCanvasActive}
            />
            <LayoutInspector
              layout={workingCopy}
              cabinets={session.cabinets}
              selection={selection}
              onChange={session.apply}
              onDelete={deleteSelection}
              onCenter={() => setCenterNonce((value) => value + 1)}
            />
          </div>

          <AutoLayoutDialog
            open={autoLayoutOpen}
            cabinetCount={session.cabinets.length}
            onClose={() => setAutoLayoutOpen(false)}
            onPreview={(options: AutoLayoutOptions) =>
              setPreviewLayout(
                generateAutoLayout(workingCopy, session.cabinets, options),
              )
            }
          />
          <LayoutTransferModal
            mode={transferMode}
            layout={workingCopy}
            onClose={() => setTransferMode(null)}
            onImport={(layout) => session.apply(layout)}
            onFeedback={(text, type) => message[type](text)}
          />
        </>
      ) : (
        <div className={styles.loadingState}>
          <Spin size="large" />
          <span>正在建立布局编辑会话</span>
        </div>
      )}
    </PageContainer>
  );
}

export default DatacenterLayoutPage;

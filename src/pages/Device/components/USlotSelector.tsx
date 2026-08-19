import { Alert, Tooltip } from 'antd';
import { CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCabinetUUsage } from '@/services/idc/cabinet';

export interface CabinetSlot {
  u: number;
  occupied: boolean;
  deviceName?: string;
}

interface USlotSelectorProps {
  cabinetId: string;
  uHeight: number;
  deviceUHeight: number;
  selectedStartU?: number;
  onSelect: (startU: number) => void;
  uUsage?: CabinetSlot[];
  loading?: boolean;
}

export function USlotSelector({
  cabinetId,
  uHeight,
  deviceUHeight,
  selectedStartU,
  onSelect,
  uUsage,
  loading,
}: USlotSelectorProps) {
  const [innerUsage, setInnerUsage] = useState<CabinetSlot[]>([]);
  const [innerLoading, setInnerLoading] = useState(false);
  const mergedLoading = typeof loading === 'boolean' ? loading : innerLoading;
  const mergedUsage = uUsage ?? innerUsage;

  useEffect(() => {
    if (!cabinetId || uUsage) return;
    setInnerLoading(true);
    getCabinetUUsage(cabinetId)
      .then((response) => {
        if (!response.success || !response.data) return;
        setInnerUsage(
          (response.data.uSlots || []).map((slot) => ({
            u: slot.u,
            occupied: Boolean(slot.deviceId),
            deviceName: slot.deviceName ?? undefined,
          })),
        );
      })
      .finally(() => setInnerLoading(false));
  }, [cabinetId, uUsage]);

  const availableSlots = useMemo(() => {
    const isSlotAvailable = (startU: number) => {
      for (let u = startU; u < startU + deviceUHeight; u += 1) {
        if (
          u > uHeight ||
          mergedUsage.some((slot) => slot.u === u && slot.occupied)
        ) {
          return false;
        }
      }
      return true;
    };
    return Array.from(
      { length: Math.max(0, uHeight - deviceUHeight + 1) },
      (_, index) => index + 1,
    ).filter(isSlotAvailable);
  }, [deviceUHeight, mergedUsage, uHeight]);

  if (!cabinetId) {
    return <Alert message="请先选择目标机柜" type="info" showIcon />;
  }
  if (mergedLoading) return <div>加载 U 位信息...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
        可用 U 位: {availableSlots.length} 个 · 设备占用: {deviceUHeight}U
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        {Array.from({ length: uHeight }, (_, index) => uHeight - index).map(
          (u) => {
            const slot = mergedUsage.find((item) => item.u === u);
            const isOccupied = slot?.occupied;
            const isSelected =
              selectedStartU !== undefined &&
              u >= selectedStartU &&
              u < selectedStartU + deviceUHeight;
            const canStart = !isOccupied && availableSlots.includes(u);
            const description = isOccupied
              ? `已被 ${slot.deviceName || '设备'} 占用`
              : canStart
                ? '可作为起始位'
                : '不可作为起始位';

            return (
              <Tooltip key={u} title={`U${u}，${description}`}>
                <button
                  type="button"
                  disabled={!canStart}
                  aria-label={`U${u}，${description}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(u)}
                  style={{
                    width: 32,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    border: isSelected
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9',
                    borderRadius: 3,
                    backgroundColor: isSelected
                      ? '#1890ff'
                      : isOccupied
                        ? '#ffccc7'
                        : '#f0f0f0',
                    color: isSelected
                      ? '#fff'
                      : isOccupied
                        ? '#f5222d'
                        : '#333',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                >
                  {u}
                </button>
              </Tooltip>
            );
          },
        )}
      </div>
      {selectedStartU !== undefined && (
        <Alert
          type="success"
          message={`已选择: U${selectedStartU} - U${selectedStartU + deviceUHeight - 1}`}
          icon={<CheckCircle size={14} />}
          showIcon
        />
      )}
      {availableSlots.length === 0 && (
        <Alert type="error" message="该机柜没有足够的连续空闲 U 位" showIcon />
      )}
    </div>
  );
}

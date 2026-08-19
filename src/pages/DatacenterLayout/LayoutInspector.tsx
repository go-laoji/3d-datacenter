import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Space,
  Tag,
} from 'antd';
import { LocateFixed, Trash2 } from 'lucide-react';
import styles from './index.less';
import type { LayoutSelection } from './layoutEditorModel';

interface LayoutInspectorProps {
  layout: IDC.DatacenterLayout;
  cabinets: IDC.Cabinet[];
  selection: LayoutSelection | null;
  onChange: (layout: IDC.DatacenterLayout) => void;
  onDelete: () => void;
  onCenter: () => void;
}

export function LayoutInspector({
  layout,
  cabinets,
  selection,
  onChange,
  onDelete,
  onCenter,
}: LayoutInspectorProps) {
  if (!selection) {
    return (
      <aside className={styles.inspector} aria-label="布局属性检查器">
        <Card title="画布设置" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="已放置机柜">
              {layout.cabinets.length}
            </Descriptions.Item>
            <Descriptions.Item label="区域 / 通道">
              {layout.zones.length}
            </Descriptions.Item>
            <Descriptions.Item label="基础设施">
              {layout.facilities.length}
            </Descriptions.Item>
          </Descriptions>
          <PropertyNumber
            label="画布宽度"
            value={layout.canvasWidth}
            min={20}
            max={200}
            suffix="m"
            onChange={(canvasWidth) => onChange({ ...layout, canvasWidth })}
          />
          <PropertyNumber
            label="画布高度"
            value={layout.canvasHeight}
            min={20}
            max={150}
            suffix="m"
            onChange={(canvasHeight) => onChange({ ...layout, canvasHeight })}
          />
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="选择画布对象后可编辑坐标与属性"
          />
        </Card>
      </aside>
    );
  }

  const cabinetItem =
    selection.kind === 'cabinet'
      ? layout.cabinets.find((item) => item.cabinetId === selection.id)
      : undefined;
  const zone =
    selection.kind === 'zone'
      ? layout.zones.find((item) => item.id === selection.id)
      : undefined;
  const facility =
    selection.kind === 'facility'
      ? layout.facilities.find((item) => item.id === selection.id)
      : undefined;
  const cabinet = cabinetItem
    ? cabinets.find((item) => item.id === cabinetItem.cabinetId)
    : undefined;
  const object = cabinetItem || zone || facility;

  if (!object) return null;

  const updatePosition = (field: 'x' | 'y', value: number) => {
    if (cabinetItem) {
      onChange({
        ...layout,
        cabinets: layout.cabinets.map((item) =>
          item.cabinetId === cabinetItem.cabinetId
            ? { ...item, [field]: value }
            : item,
        ),
      });
    } else if (zone) {
      onChange({
        ...layout,
        zones: layout.zones.map((item) =>
          item.id === zone.id ? { ...item, [field]: value } : item,
        ),
      });
    } else if (facility) {
      onChange({
        ...layout,
        facilities: layout.facilities.map((item) =>
          item.id === facility.id ? { ...item, [field]: value } : item,
        ),
      });
    }
  };

  const updateRotation = (rotation: number) => {
    if (cabinetItem) {
      onChange({
        ...layout,
        cabinets: layout.cabinets.map((item) =>
          item.cabinetId === cabinetItem.cabinetId
            ? { ...item, rotation }
            : item,
        ),
      });
    } else if (zone) {
      onChange({
        ...layout,
        zones: layout.zones.map((item) =>
          item.id === zone.id ? { ...item, rotation } : item,
        ),
      });
    } else if (facility) {
      onChange({
        ...layout,
        facilities: layout.facilities.map((item) =>
          item.id === facility.id ? { ...item, rotation } : item,
        ),
      });
    }
  };

  return (
    <aside className={styles.inspector} aria-label="布局属性检查器">
      <Card
        title={cabinet?.name || zone?.name || facility?.name || selection.id}
        size="small"
        extra={<Tag>{selection.kind}</Tag>}
      >
        {cabinet && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="编码">{cabinet.code}</Descriptions.Item>
            <Descriptions.Item label="容量">
              {cabinet.usedU}U / {cabinet.uHeight}U
            </Descriptions.Item>
            <Descriptions.Item label="状态">{cabinet.status}</Descriptions.Item>
          </Descriptions>
        )}

        {(zone || facility) && (
          <div className={styles.propertyRow}>
            <label htmlFor="layout-object-name">名称</label>
            <Input
              id="layout-object-name"
              value={zone?.name || facility?.name || ''}
              onChange={(event) => {
                if (zone) {
                  onChange({
                    ...layout,
                    zones: layout.zones.map((item) =>
                      item.id === zone.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  });
                } else if (facility) {
                  onChange({
                    ...layout,
                    facilities: layout.facilities.map((item) =>
                      item.id === facility.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  });
                }
              }}
            />
          </div>
        )}

        <PropertyNumber
          label="X 坐标"
          value={object.x}
          min={0}
          max={layout.canvasWidth}
          suffix="m"
          onChange={(value) => updatePosition('x', value)}
        />
        <PropertyNumber
          label="Y 坐标"
          value={object.y}
          min={0}
          max={layout.canvasHeight}
          suffix="m"
          onChange={(value) => updatePosition('y', value)}
        />
        <PropertyNumber
          label="旋转"
          value={object.rotation || 0}
          min={-360}
          max={360}
          suffix="°"
          onChange={updateRotation}
        />

        {zone && (
          <>
            <PropertyNumber
              label="区域宽度"
              value={zone.width}
              min={0.5}
              max={layout.canvasWidth}
              suffix="m"
              onChange={(width) =>
                onChange({
                  ...layout,
                  zones: layout.zones.map((item) =>
                    item.id === zone.id ? { ...item, width } : item,
                  ),
                })
              }
            />
            <PropertyNumber
              label="区域高度"
              value={zone.height}
              min={0.5}
              max={layout.canvasHeight}
              suffix="m"
              onChange={(height) =>
                onChange({
                  ...layout,
                  zones: layout.zones.map((item) =>
                    item.id === zone.id ? { ...item, height } : item,
                  ),
                })
              }
            />
          </>
        )}

        <Space wrap className={styles.inspectorActions}>
          <Button icon={<LocateFixed size={14} />} onClick={onCenter}>
            居中选中对象
          </Button>
          <Button danger icon={<Trash2 size={14} />} onClick={onDelete}>
            从布局移除
          </Button>
        </Space>
      </Card>
    </aside>
  );
}

interface PropertyNumberProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}

function PropertyNumber({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: PropertyNumberProps) {
  return (
    <div className={styles.propertyRow}>
      <span>{label}</span>
      <Space.Compact>
        <InputNumber
          aria-label={label}
          value={Number(value.toFixed(2))}
          min={min}
          max={max}
          step={0.1}
          onChange={(next) => onChange(next || 0)}
        />
        <span className={styles.unitAddon}>{suffix}</span>
      </Space.Compact>
    </div>
  );
}

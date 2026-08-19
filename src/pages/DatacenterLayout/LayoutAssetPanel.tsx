import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Select,
  Space,
  Switch,
  Tag,
} from 'antd';
import { Box, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './index.less';

export interface LayoutLayers {
  grid: boolean;
  cabinets: boolean;
  zones: boolean;
  facilities: boolean;
}

interface LayoutAssetPanelProps {
  pendingCabinets: IDC.Cabinet[];
  layers: LayoutLayers;
  onLayersChange: (layers: LayoutLayers) => void;
  onAddCabinet: (cabinet: IDC.Cabinet) => void;
  onAddZone: (type: IDC.LayoutZoneType) => void;
  onAddFacility: (type: IDC.LayoutFacilityType) => void;
}

const facilityOptions: { value: IDC.LayoutFacilityType; label: string }[] = [
  { value: 'ups', label: 'UPS' },
  { value: 'crac', label: '精密空调' },
  { value: 'pdu', label: 'PDU' },
  { value: 'sensor', label: '传感器' },
  { value: 'door', label: '门禁' },
  { value: 'camera', label: '摄像头' },
  { value: 'fire_extinguisher', label: '消防设施' },
];

export function LayoutAssetPanel({
  pendingCabinets,
  layers,
  onLayersChange,
  onAddCabinet,
  onAddZone,
  onAddFacility,
}: LayoutAssetPanelProps) {
  const [query, setQuery] = useState('');
  const [facilityType, setFacilityType] =
    useState<IDC.LayoutFacilityType>('sensor');
  const visiblePending = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return pendingCabinets;
    return pendingCabinets.filter((cabinet) =>
      [cabinet.name, cabinet.code]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [pendingCabinets, query]);

  return (
    <aside className={styles.sidebar} aria-label="布局对象与图层">
      <Card title="待放置机柜" size="small">
        <Input
          allowClear
          prefix={<Search size={14} />}
          placeholder="搜索机柜"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={styles.pendingMeta}>
          <span>仅由用户确认后进入工作副本</span>
          <Tag>{pendingCabinets.length} 个</Tag>
        </div>
        {visiblePending.length ? (
          <List
            className={styles.pendingList}
            size="small"
            dataSource={visiblePending}
            renderItem={(cabinet) => (
              <List.Item
                actions={[
                  <Button
                    key="place"
                    type="link"
                    size="small"
                    icon={<Plus size={13} />}
                    onClick={() => onAddCabinet(cabinet)}
                  >
                    放置
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Box size={16} />}
                  title={cabinet.name}
                  description={`${cabinet.code} · ${cabinet.uHeight}U`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={query ? '没有匹配机柜' : '全部机柜已放置'}
          />
        )}
      </Card>

      <Card title="添加空间对象" size="small">
        <Space wrap>
          <Button onClick={() => onAddZone('zone')}>普通区域</Button>
          <Button onClick={() => onAddZone('hot_aisle')}>热通道</Button>
          <Button onClick={() => onAddZone('cold_aisle')}>冷通道</Button>
        </Space>
        <div className={styles.facilityAddRow}>
          <Select
            aria-label="设施类型"
            value={facilityType}
            onChange={setFacilityType}
            options={facilityOptions}
          />
          <Button
            icon={<Plus size={14} />}
            onClick={() => onAddFacility(facilityType)}
          >
            添加设施
          </Button>
        </div>
      </Card>

      <Card title="图层" size="small">
        {(Object.keys(layers) as (keyof LayoutLayers)[]).map((key) => {
          const label = {
            grid: '网格',
            cabinets: '机柜',
            zones: '区域 / 通道',
            facilities: '基础设施',
          }[key];
          return (
            <div className={styles.layerRow} key={key}>
              <span>{label}</span>
              <Switch
                size="small"
                aria-label={`显示${label}`}
                checked={layers[key]}
                onChange={(checked) =>
                  onLayersChange({ ...layers, [key]: checked })
                }
              />
            </div>
          );
        })}
      </Card>
    </aside>
  );
}

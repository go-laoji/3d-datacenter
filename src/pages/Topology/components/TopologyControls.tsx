import {
  Button,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { LocateFixed, Save } from 'lucide-react';
import type { NetworkTopologyNode } from '@/services/idc/dashboard';
import type { TopologyView } from '../topologyModel';

interface Props {
  view: TopologyView;
  keyword: string;
  status?: string;
  onlyAbnormal: boolean;
  nodes: NetworkTopologyNode[];
  pathSource?: string;
  pathTarget?: string;
  onViewChange: (value: TopologyView) => void;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value?: string) => void;
  onOnlyAbnormalChange: (value: boolean) => void;
  onFocus: (id: string) => void;
  onPathSourceChange: (value?: string) => void;
  onPathTargetChange: (value?: string) => void;
  onSave: () => void;
}

const TopologyControls: React.FC<Props> = ({
  view,
  keyword,
  status,
  onlyAbnormal,
  nodes,
  pathSource,
  pathTarget,
  onViewChange,
  onKeywordChange,
  onStatusChange,
  onOnlyAbnormalChange,
  onFocus,
  onPathSourceChange,
  onPathTargetChange,
  onSave,
}) => {
  const options = nodes.map((node) => ({
    value: node.id,
    label: `${node.label} · ${node.managementIp ?? node.cabinetId}`,
  }));
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Segmented
          value={view}
          onChange={(value) => onViewChange(value as TopologyView)}
          options={[
            { value: 'physical', label: '物理拓扑' },
            { value: 'business', label: '业务视图' },
            { value: 'cabinet', label: '机柜聚合' },
          ]}
        />
        <Input.Search
          aria-label="搜索拓扑对象"
          allowClear
          placeholder="设备、IP 或机柜"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          style={{ width: 230 }}
        />
        <Select
          aria-label="拓扑状态筛选"
          allowClear
          placeholder="状态"
          value={status}
          onChange={onStatusChange}
          options={[
            { value: 'online', label: '在线' },
            { value: 'warning', label: '告警' },
            { value: 'offline', label: '离线' },
          ]}
        />
        <Space>
          <Switch checked={onlyAbnormal} onChange={onOnlyAbnormalChange} />
          <Typography.Text>只看异常</Typography.Text>
        </Space>
        <Select
          aria-label="定位设备"
          showSearch
          optionFilterProp="label"
          placeholder="快速定位"
          options={options}
          onChange={onFocus}
          suffixIcon={<LocateFixed size={14} />}
          style={{ width: 220 }}
        />
        <Button icon={<Save size={14} />} onClick={onSave}>
          保存布局
        </Button>
      </Space>
      {view !== 'cabinet' ? (
        <Space wrap>
          <Typography.Text strong>路径分析</Typography.Text>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="源设备"
            value={pathSource}
            options={options}
            onChange={onPathSourceChange}
            style={{ width: 220 }}
          />
          <span>→</span>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="目标设备"
            value={pathTarget}
            options={options}
            onChange={onPathTargetChange}
            style={{ width: 220 }}
          />
        </Space>
      ) : null}
    </Space>
  );
};

export default TopologyControls;

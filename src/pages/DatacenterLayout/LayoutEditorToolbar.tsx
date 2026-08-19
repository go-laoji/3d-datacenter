import { history } from '@umijs/max';
import { Button, InputNumber, Select, Space, Tag, Tooltip } from 'antd';
import {
  Box,
  Download,
  Eye,
  Redo2,
  RefreshCw,
  Save,
  Sparkles,
  Undo2,
  Upload,
} from 'lucide-react';
import styles from './index.less';
import type { LayoutSelection } from './layoutEditorModel';

interface SearchOption {
  value: string;
  label: string;
  selection: LayoutSelection;
}

interface LayoutEditorToolbarProps {
  datacenters: { id: string; name: string; code: string }[];
  selectedDatacenterId?: string;
  loadedVersion?: number;
  dirty: boolean;
  saving: boolean;
  conflicted: boolean;
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  searchOptions: SearchOption[];
  onDatacenterChange: (id: string) => void;
  onSearchSelect: (selection: LayoutSelection) => void;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onSave: () => void;
}

export function LayoutEditorToolbar({
  datacenters,
  selectedDatacenterId,
  loadedVersion,
  dirty,
  saving,
  conflicted,
  loading,
  canUndo,
  canRedo,
  zoom,
  searchOptions,
  onDatacenterChange,
  onSearchSelect,
  onZoomChange,
  onUndo,
  onRedo,
  onAutoLayout,
  onImport,
  onExport,
  onRefresh,
  onSave,
}: LayoutEditorToolbarProps) {
  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="布局编辑器工具栏"
    >
      <Space wrap>
        <Select
          aria-label="选择布局数据中心"
          className={styles.datacenterSelect}
          value={selectedDatacenterId}
          placeholder="选择数据中心"
          onChange={onDatacenterChange}
          options={datacenters.map((datacenter) => ({
            value: datacenter.id,
            label: `${datacenter.name} · ${datacenter.code}`,
          }))}
        />
        <Select
          showSearch
          allowClear
          aria-label="搜索布局对象"
          className={styles.objectSearch}
          placeholder="搜索机柜、区域或设施"
          optionFilterProp="label"
          onChange={(value) => {
            const option = searchOptions.find((item) => item.value === value);
            if (option) onSearchSelect(option.selection);
          }}
          options={searchOptions.map(({ value, label }) => ({ value, label }))}
        />
        <Tag color={conflicted ? 'error' : dirty ? 'warning' : 'success'}>
          {conflicted
            ? '版本冲突'
            : saving
              ? '正在保存'
              : dirty
                ? '有未保存修改'
                : '已同步'}
        </Tag>
        {loadedVersion !== undefined && <Tag>服务端 v{loadedVersion}</Tag>}
      </Space>

      <Space wrap>
        <Tooltip title="撤销（画布聚焦时 Ctrl/⌘+Z）">
          <Button
            aria-label="撤销布局修改"
            icon={<Undo2 size={15} />}
            disabled={!canUndo}
            onClick={onUndo}
          />
        </Tooltip>
        <Tooltip title="重做（画布聚焦时 Ctrl/⌘+Shift+Z）">
          <Button
            aria-label="重做布局修改"
            icon={<Redo2 size={15} />}
            disabled={!canRedo}
            onClick={onRedo}
          />
        </Tooltip>
        <Button icon={<Sparkles size={15} />} onClick={onAutoLayout}>
          自动布局预览
        </Button>
        <Button icon={<Upload size={15} />} onClick={onImport}>
          导入
        </Button>
        <Button icon={<Download size={15} />} onClick={onExport}>
          导出
        </Button>
        <Space size={6}>
          <Eye size={15} aria-hidden />
          <Space.Compact>
            <InputNumber
              aria-label="画布缩放百分比"
              min={50}
              max={180}
              step={10}
              value={Math.round(zoom * 100)}
              onChange={(value) => onZoomChange((value || 100) / 100)}
            />
            <span className={styles.unitAddon}>%</span>
          </Space.Compact>
        </Space>
        <Button
          icon={<Box size={15} />}
          disabled={!selectedDatacenterId}
          onClick={() =>
            history.push(`/datacenter3d?datacenterId=${selectedDatacenterId}`)
          }
        >
          3D 查看
        </Button>
        <Tooltip title="重新加载服务端布局">
          <Button
            aria-label="重新加载服务端布局"
            icon={<RefreshCw size={15} />}
            loading={loading}
            onClick={onRefresh}
          />
        </Tooltip>
        <Button
          type="primary"
          icon={<Save size={15} />}
          loading={saving}
          disabled={!dirty || conflicted}
          onClick={onSave}
        >
          保存布局
        </Button>
      </Space>
    </div>
  );
}

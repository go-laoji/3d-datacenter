import { PageContainer } from '@ant-design/pro-components';
import { Canvas } from '@react-three/fiber';
import { history, useSearchParams } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  message,
  Progress,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import {
  Box,
  Cable,
  Crosshair,
  Eye,
  EyeOff,
  LayoutGrid,
  MonitorUp,
  RotateCcw,
  Search,
  Server,
  Settings,
  Thermometer,
} from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import CabinetFrontView3D from '@/components/3d/CabinetFrontView3D';
import {
  DatacenterScene,
  type DatacenterSceneRef,
} from '@/components/3d/DatacenterScene';
import { HeatmapLegend } from '@/components/3d/HeatmapOverlay';
import { getCabinetsByDatacenter } from '@/services/idc/cabinet';
import { getConnectionsByDatacenter } from '@/services/idc/connection';
import { getAllDatacenters } from '@/services/idc/datacenter';
import { getDevices } from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { getCabinetEnvironments } from '@/services/idc/environment';
import styles from './index.less';

// U位图组件
const USlotDiagram: React.FC<{
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  onDeviceClick: (device: IDC.Device) => void;
}> = ({ cabinet, devices, onDeviceClick }) => {
  const slots = useMemo(() => {
    const result: { u: number; device: IDC.Device | null; isStart: boolean }[] =
      [];
    for (let u = cabinet.uHeight; u >= 1; u--) {
      const foundDevice = devices.find((d) => u >= d.startU && u <= d.endU);
      const device = foundDevice || null;
      const isStart = device ? device.startU === u : false;
      result.push({ u, device, isStart });
    }
    return result;
  }, [cabinet, devices]);

  const statusColors: Record<string, string> = {
    online: '#52c41a',
    offline: '#8c8c8c',
    warning: '#faad14',
    error: '#f5222d',
    maintenance: '#1890ff',
  };

  return (
    <div className={styles.uSlotDiagram}>
      {slots.map(({ u, device, isStart }) => (
        <div
          key={u}
          className={`${styles.uSlot} ${device ? styles.occupied : ''}`}
          style={
            device
              ? {
                  backgroundColor: `${statusColors[device.status]}20`,
                  borderColor: statusColors[device.status],
                }
              : {}
          }
          onClick={() => device && onDeviceClick(device)}
        >
          <span className={styles.uNumber}>{u}</span>
          {isStart && device && (
            <span className={styles.deviceName} title={device.name}>
              {device.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// 端口面板组件
const PortPanel: React.FC<{ device: IDC.Device; template: any }> = ({
  device: _device,
  template,
}) => {
  if (!template?.portGroups) return null;

  return (
    <div className={styles.portPanel}>
      {template.portGroups.map((pg: any) => (
        <div key={pg.id} className={styles.portGroup}>
          <div className={styles.portGroupHeader}>
            <span>{pg.name}</span>
            <Tag>
              {pg.portType} × {pg.count}
            </Tag>
          </div>
          <div className={styles.portGrid}>
            {Array.from({ length: pg.count }).map((_, i) => (
              <div
                key={`${pg.name}-${i}`}
                className={styles.port}
                title={`${pg.name} #${i + 1}`}
              >
                <div className={styles.portIndicator} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Datacenter3DPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dcId = searchParams.get('id');
  const sceneRef = useRef<DatacenterSceneRef>(null);

  const [datacenters, setDatacenters] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDc, setSelectedDc] = useState<string | undefined>(
    dcId || undefined,
  );
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [devices, setDevices] = useState<IDC.Device[]>([]);
  const [connections, setConnections] = useState<IDC.Connection[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCabinet, setSelectedCabinet] = useState<IDC.Cabinet | null>(
    null,
  );
  const [selectedDevice, setSelectedDevice] = useState<IDC.Device | null>(null);
  const [cabinetDrawerOpen, setCabinetDrawerOpen] = useState(false);
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);
  const [cabinetFrontViewOpen, setCabinetFrontViewOpen] = useState(false);

  const [showConnections, setShowConnections] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [cabinetTemperatures, setCabinetTemperatures] = useState<
    {
      cabinetId: string;
      temperature: number;
      status: 'normal' | 'warning' | 'critical';
    }[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [highlightedDeviceId, setHighlightedDeviceId] = useState<string | null>(
    null,
  );
  const [highlightedCabinetId, setHighlightedCabinetId] = useState<
    string | null
  >(null);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return [];
    const keyword = searchKeyword.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(keyword) ||
        d.assetCode?.toLowerCase().includes(keyword) ||
        d.managementIp?.toLowerCase().includes(keyword),
    );
  }, [searchKeyword, devices]);

  // 加载数据中心列表
  useEffect(() => {
    getAllDatacenters().then((res) => {
      if (res.success && res.data) {
        setDatacenters(res.data);
        if (!selectedDc && res.data.length > 0) {
          setSelectedDc(res.data[0].id);
        }
      }
    });
    getAllDeviceTemplates().then((res) => {
      if (res.success) setTemplates(res.data || []);
    });
  }, []);

  // 加载选中数据中心的数据
  useEffect(() => {
    if (selectedDc) {
      setLoading(true);
      Promise.all([
        getCabinetsByDatacenter(selectedDc),
        getDevices({ pageSize: 1000 }),
        getConnectionsByDatacenter(selectedDc),
      ])
        .then(([cabRes, devRes, connRes]) => {
          if (cabRes.success) setCabinets(cabRes.data || []);
          if (devRes.success) {
            const cabinetIds = (cabRes.data || []).map((c: any) => c.id);
            setDevices(
              (devRes.data || []).filter((d: any) =>
                cabinetIds.includes(d.cabinetId),
              ),
            );
          }
          if (connRes.success) setConnections(connRes.data || []);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedDc]);

  // 加载热力图温度数据
  useEffect(() => {
    if (showHeatmap) {
      getCabinetEnvironments().then((res) => {
        if (res.success && res.data) {
          setCabinetTemperatures(
            res.data.map((env) => ({
              cabinetId: env.cabinetId,
              temperature: env.avgTemperature,
              status: env.status,
            })),
          );
        }
      });
    }
  }, [showHeatmap]);

  // 搜索定位设备
  const handleSearchSelect = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      setHighlightedDeviceId(deviceId);
      setHighlightedCabinetId(device.cabinetId);

      // 聚焦到设备位置
      const cabinet = cabinets.find((c) => c.id === device.cabinetId);
      if (cabinet && sceneRef.current) {
        const rowSpacing = 1.5;
        const colSpacing = 0.8;
        const x = (cabinet.column - 1) * colSpacing;
        const y = device.startU * 0.0445;
        const z = (cabinet.row - 1) * rowSpacing;
        sceneRef.current.focusOnPosition([x, y, z]);
      }

      // 3秒后取消高亮
      setTimeout(() => {
        setHighlightedDeviceId(null);
        setHighlightedCabinetId(null);
      }, 3000);

      setSearchKeyword('');
      message.success(`已定位到设备: ${device.name}`);
    }
  };

  const handleSelectCabinet = (cabinet: IDC.Cabinet | null) => {
    setSelectedCabinet(cabinet);
    setSelectedDevice(null);
    if (cabinet) {
      // 点击机柜显示正面大图
      setCabinetFrontViewOpen(true);
      setDeviceDrawerOpen(false);
      setCabinetDrawerOpen(false);
    }
  };

  const handleSelectDevice = (device: IDC.Device | null) => {
    setSelectedDevice(device);
    if (device) {
      setDeviceDrawerOpen(true);
      setCabinetDrawerOpen(false);
    }
  };

  const handleResetCamera = () => {
    sceneRef.current?.resetCamera();
    message.success('视角已重置');
  };

  const getTemplateName = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    return tpl ? `${tpl.brand} ${tpl.model}` : templateId;
  };

  const getTemplate = (templateId: string) => {
    return templates.find((t) => t.id === templateId);
  };

  const getCabinetName = (cabinetId: string) => {
    const cab = cabinets.find((c) => c.id === cabinetId);
    return cab?.name || cabinetId;
  };

  const getCabinetDevices = (cabinetId: string) => {
    return devices.filter((d) => d.cabinetId === cabinetId);
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    online: { color: 'success', text: '在线' },
    offline: { color: 'default', text: '离线' },
    warning: { color: 'warning', text: '告警' },
    error: { color: 'error', text: '故障' },
    maintenance: { color: 'processing', text: '维护中' },
    normal: { color: 'success', text: '正常' },
  };

  return (
    <PageContainer
      header={{
        title: '3D机房视图',
        subTitle: '可视化查看机房布局与设备状态',
      }}
    >
      <Card className={styles.card3d}>
        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <Space>
            <span>选择机房：</span>
            <Select
              placeholder="请选择机房"
              style={{ width: 200 }}
              value={selectedDc}
              onChange={setSelectedDc}
              options={datacenters.map((dc) => ({
                value: dc.id,
                label: dc.name,
              }))}
            />
            <Divider type="vertical" />
            <Select
              showSearch
              placeholder="搜索设备名/IP/资产码"
              style={{ width: 240 }}
              value={undefined}
              onChange={handleSearchSelect}
              filterOption={false}
              onSearch={setSearchKeyword}
              suffixIcon={<Search size={14} />}
              notFoundContent={searchKeyword ? '未找到匹配设备' : null}
              options={searchResults.map((d) => ({
                value: d.id,
                label: (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{d.name}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {d.managementIp || d.assetCode}
                    </span>
                  </div>
                ),
              }))}
            />
          </Space>

          <Space>
            <Tooltip title={showConnections ? '隐藏连线' : '显示连线'}>
              <Button
                icon={
                  showConnections ? <Eye size={16} /> : <EyeOff size={16} />
                }
                onClick={() => setShowConnections(!showConnections)}
              >
                连线
              </Button>
            </Tooltip>
            <Tooltip title={showHeatmap ? '关闭热力图' : '显示热力图'}>
              <Button
                icon={<Thermometer size={16} />}
                type={showHeatmap ? 'primary' : 'default'}
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                热力图
              </Button>
            </Tooltip>
            <Tooltip title="重置视角">
              <Button
                icon={<RotateCcw size={16} />}
                onClick={handleResetCamera}
              >
                重置
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* 统计信息 */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Server size={16} />
            <span>机柜: {cabinets.length}</span>
          </div>
          <div className={styles.statItem}>
            <Box size={16} />
            <span>设备: {devices.length}</span>
          </div>
          <div className={styles.statItem}>
            <Cable size={16} />
            <span>连线: {connections.length}</span>
          </div>
          <div className={styles.statItem}>
            <Badge status="success" />
            <span>
              在线: {devices.filter((d) => d.status === 'online').length}
            </span>
          </div>
          <div className={styles.statItem}>
            <Badge status="warning" />
            <span>
              告警: {devices.filter((d) => d.status === 'warning').length}
            </span>
          </div>
          <div className={styles.statItem}>
            <Badge status="error" />
            <span>
              故障: {devices.filter((d) => d.status === 'error').length}
            </span>
          </div>
        </div>

        {/* 3D画布 - 打开机柜正面图时隐藏 */}
        <div className={styles.canvasContainer}>
          {cabinetFrontViewOpen ? (
            <div className={styles.loading}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <Server size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div>正在查看机柜详情...</div>
              </div>
            </div>
          ) : loading ? (
            <div className={styles.loading}>
              <Spin size="large" tip="加载3D场景..." />
            </div>
          ) : cabinets.length > 0 ? (
            <>
              <Canvas shadows>
                <Suspense fallback={null}>
                  <DatacenterScene
                    ref={sceneRef}
                    cabinets={cabinets}
                    devices={devices}
                    connections={showConnections ? connections : []}
                    templates={templates}
                    selectedCabinet={selectedCabinet}
                    selectedDevice={selectedDevice}
                    highlightedCabinetId={highlightedCabinetId}
                    highlightedDeviceId={highlightedDeviceId}
                    onSelectCabinet={handleSelectCabinet}
                    onSelectDevice={handleSelectDevice}
                    showHeatmap={showHeatmap}
                    cabinetTemperatures={cabinetTemperatures}
                  />
                </Suspense>
              </Canvas>
              {/* 热力图图例 */}
              {showHeatmap && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 10,
                  }}
                >
                  <HeatmapLegend />
                </div>
              )}
            </>
          ) : (
            <Empty
              description="该机房暂无机柜数据"
              style={{ paddingTop: 150 }}
            />
          )}
        </div>

        {/* 操作提示 */}
        <div className={styles.hint}>
          <span>
            💡 操作提示：单击选择 | 双击聚焦 | 右键拖动旋转 | 滚轮缩放 |
            悬停查看详情
          </span>
        </div>
      </Card>

      {/* 机柜详情抽屉 */}
      <Drawer
        title={
          <Space>
            <Server size={18} />
            机柜详情
          </Space>
        }
        open={cabinetDrawerOpen}
        onClose={() => setCabinetDrawerOpen(false)}
        width={450}
      >
        {selectedCabinet && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="机柜名称">
                {selectedCabinet.name}
              </Descriptions.Item>
              <Descriptions.Item label="机柜编码">
                {selectedCabinet.code}
              </Descriptions.Item>
              <Descriptions.Item label="位置">
                {selectedCabinet.row}排{selectedCabinet.column}列
              </Descriptions.Item>
              <Descriptions.Item label="U位使用">
                <div style={{ width: '100%' }}>
                  <Progress
                    percent={Math.round(
                      (selectedCabinet.usedU / selectedCabinet.uHeight) * 100,
                    )}
                    size="small"
                    status={
                      selectedCabinet.usedU / selectedCabinet.uHeight > 0.9
                        ? 'exception'
                        : 'active'
                    }
                  />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {selectedCabinet.usedU}U / {selectedCabinet.uHeight}U
                  </span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="功率使用">
                <div style={{ width: '100%' }}>
                  <Progress
                    percent={Math.round(
                      (selectedCabinet.currentPower /
                        selectedCabinet.maxPower) *
                        100,
                    )}
                    size="small"
                    strokeColor="#faad14"
                  />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {selectedCabinet.currentPower}W / {selectedCabinet.maxPower}
                    W
                  </span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedCabinet.status]?.color}>
                  {statusConfig[selectedCabinet.status]?.text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* U位图 */}
            <Card
              title={
                <Space>
                  <LayoutGrid size={14} />
                  U位占用图
                </Space>
              }
              size="small"
              style={{ marginTop: 16 }}
            >
              <USlotDiagram
                cabinet={selectedCabinet}
                devices={getCabinetDevices(selectedCabinet.id)}
                onDeviceClick={handleSelectDevice}
              />
            </Card>
          </>
        )}
      </Drawer>

      {/* 设备详情抽屉 */}
      <Drawer
        title={
          <Space>
            <Box size={18} />
            设备详情
          </Space>
        }
        open={deviceDrawerOpen}
        onClose={() => setDeviceDrawerOpen(false)}
        width={500}
      >
        {selectedDevice && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="设备名称">
                <Space>
                  <Badge
                    status={
                      selectedDevice.status === 'online' ? 'success' : 'default'
                    }
                  />
                  {selectedDevice.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="资产编码">
                {selectedDevice.assetCode}
              </Descriptions.Item>
              <Descriptions.Item label="设备型号">
                {getTemplateName(selectedDevice.templateId)}
              </Descriptions.Item>
              <Descriptions.Item label="所在机柜">
                {getCabinetName(selectedDevice.cabinetId)}
              </Descriptions.Item>
              <Descriptions.Item label="U位">
                U{selectedDevice.startU} - U{selectedDevice.endU}
              </Descriptions.Item>
              <Descriptions.Item label="管理IP">
                {selectedDevice.managementIp || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedDevice.status]?.color}>
                  {statusConfig[selectedDevice.status]?.text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* 端口面板 */}
            <Card
              title={
                <Space>
                  <MonitorUp size={14} />
                  端口面板
                </Space>
              }
              size="small"
              style={{ marginTop: 16 }}
            >
              <PortPanel
                device={selectedDevice}
                template={getTemplate(selectedDevice.templateId)}
              />
            </Card>

            {/* 设备连线 */}
            <Card
              title={
                <Space>
                  <Cable size={14} />
                  设备连线
                </Space>
              }
              size="small"
              style={{ marginTop: 16 }}
            >
              {connections
                .filter(
                  (c) =>
                    c.sourceDeviceId === selectedDevice.id ||
                    c.targetDeviceId === selectedDevice.id,
                )
                .map((conn) => {
                  const otherDeviceId =
                    conn.sourceDeviceId === selectedDevice.id
                      ? conn.targetDeviceId
                      : conn.sourceDeviceId;
                  const otherDevice = devices.find(
                    (d) => d.id === otherDeviceId,
                  );

                  return (
                    <div key={conn.id} className={styles.connectionItem}>
                      <Cable size={14} style={{ color: conn.cableColor }} />
                      <span>{conn.cableNumber}</span>
                      <span style={{ color: '#8c8c8c' }}>→</span>
                      <span>{otherDevice?.name || '未知设备'}</span>
                      <Tag>{conn.cableType}</Tag>
                    </div>
                  );
                })}
              {connections.filter(
                (c) =>
                  c.sourceDeviceId === selectedDevice.id ||
                  c.targetDeviceId === selectedDevice.id,
              ).length === 0 && (
                <Empty
                  description="暂无连线"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>

            <div style={{ marginTop: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<Settings size={14} />}
                  onClick={() =>
                    history.push(`/network/port?device=${selectedDevice.id}`)
                  }
                >
                  配置端口
                </Button>
                <Button
                  icon={<Crosshair size={14} />}
                  onClick={() => {
                    const cabinet = cabinets.find(
                      (c) => c.id === selectedDevice.cabinetId,
                    );
                    if (cabinet && sceneRef.current) {
                      const rowSpacing = 1.5;
                      const colSpacing = 0.8;
                      const x = (cabinet.column - 1) * colSpacing;
                      const y = selectedDevice.startU * 0.0445;
                      const z = (cabinet.row - 1) * rowSpacing;
                      sceneRef.current.focusOnPosition([x, y, z]);
                    }
                  }}
                >
                  聚焦定位
                </Button>
              </Space>
            </div>
          </>
        )}
      </Drawer>

      {/* 机柜正面大图视图 - 3D版本 */}
      <CabinetFrontView3D
        cabinet={selectedCabinet}
        devices={getCabinetDevices(selectedCabinet?.id || '')}
        templates={templates}
        open={cabinetFrontViewOpen}
        onClose={() => setCabinetFrontViewOpen(false)}
        onDeviceClick={(device) => {
          setCabinetFrontViewOpen(false);
          handleSelectDevice(device);
        }}
      />
    </PageContainer>
  );
};

export default Datacenter3DPage;

/**
 * IDC机房管理系统类型定义
 */

declare namespace IDC {
  // ==================== 通用类型 ====================

  /** 通用分页参数 */
  interface PageParams {
    current?: number;
    pageSize?: number;
  }

  /** 通用分页响应 */
  interface PageResult<T> {
    data: T[];
    total: number;
    success: boolean;
  }

  /** 通用API响应 */
  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    errorMessage?: string;
    errorCode?: string;
  }

  // ==================== 数据中心 ====================

  /** 数据中心/机房 */
  interface Datacenter {
    id: string;
    name: string;
    code: string; // 机房编码
    address: string; // 地址
    area: number; // 面积(平方米)
    totalCabinets: number; // 机柜总数
    usedCabinets: number; // 已用机柜数
    status: 'active' | 'maintenance' | 'offline';
    description?: string;
    contact?: string; // 联系人
    phone?: string; // 联系电话
    createdAt: string;
    updatedAt: string;
  }

  interface DatacenterCreateParams {
    name: string;
    code: string;
    address: string;
    area?: number;
    description?: string;
    contact?: string;
    phone?: string;
  }

  // ==================== 机柜 ====================

  /** 机柜 */
  interface Cabinet {
    id: string;
    datacenterId: string;
    datacenterName?: string;
    name: string;
    code: string; // 机柜编码
    row: number; // 行号
    column: number; // 列号
    uHeight: number; // U位高度(通常42U或47U)
    usedU: number; // 已用U数
    maxPower: number; // 最大功率(W)
    currentPower: number; // 当前功率(W)
    status: 'normal' | 'warning' | 'error' | 'offline';
    description?: string;
    createdAt: string;
    updatedAt: string;
  }

  interface CabinetCreateParams {
    datacenterId: string;
    name: string;
    code: string;
    row: number;
    column: number;
    uHeight?: number;
    maxPower?: number;
    description?: string;
  }

  // ==================== 设备模板 ====================

  /** 端口组定义 */
  interface PortGroup {
    id: string;
    name: string; // 如"千兆电口组"
    portType:
      | 'RJ45'
      | 'SFP'
      | 'SFP+'
      | 'QSFP+'
      | 'QSFP28'
      | 'FC'
      | 'USB'
      | 'Console'
      | 'Power';
    count: number; // 端口数量
    speed: '100M' | '1G' | '10G' | '25G' | '40G' | '100G' | 'N/A';
    poe?: boolean; // 是否支持PoE
  }

  /** 设备模板/型号 */
  interface DeviceTemplate {
    id: string;
    name: string; // 模板名称
    category:
      | 'switch'
      | 'router'
      | 'server'
      | 'storage'
      | 'firewall'
      | 'loadbalancer'
      | 'other';
    brand: string; // 品牌
    model: string; // 型号
    uHeight: number; // U位高度
    portGroups: PortGroup[]; // 端口组
    frontColor?: string; // 前面板颜色
    rearColor?: string; // 后面板颜色
    model3dUrl?: string; // 3D模型URL
    imageUrl?: string; // 设备图片
    isBuiltin: boolean; // 是否内置模板
    description?: string;
    specs?: Record<string, string>; // 其他规格参数
    maxPower?: number; // 最高功率(W)
    createdAt: string;
    updatedAt: string;
  }

  interface DeviceTemplateCreateParams {
    name: string;
    category: DeviceTemplate['category'];
    brand: string;
    model: string;
    uHeight: number;
    portGroups: Omit<PortGroup, 'id'>[];
    frontColor?: string;
    description?: string;
    specs?: Record<string, string>;
    maxPower?: number; // 最高功率(W)
  }

  // ==================== 设备 ====================

  /** 设备实例 */
  interface Device {
    id: string;
    templateId: string;
    template?: DeviceTemplate;
    cabinetId: string;
    cabinet?: Cabinet;
    assetCode: string; // 资产编码
    name: string; // 设备名称
    serialNumber?: string; // 序列号
    startU: number; // 起始U位
    endU: number; // 结束U位(自动计算)
    managementIp?: string; // 管理IP
    status: 'online' | 'offline' | 'warning' | 'error' | 'maintenance';
    purchaseDate?: string; // 采购日期
    warrantyExpiry?: string; // 质保到期
    vendor?: string; // 供应商
    owner?: string; // 负责人
    department?: string; // 所属部门
    isMounted?: boolean; // 是否已上架
    description?: string;
    createdAt: string;
    updatedAt: string;
  }

  interface DeviceCreateParams {
    templateId: string;
    cabinetId: string;
    assetCode: string;
    name: string;
    serialNumber?: string;
    startU: number;
    managementIp?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    vendor?: string;
    owner?: string;
    department?: string;
    description?: string;
  }

  // ==================== 端口 ====================

  /** VLAN配置 */
  interface VlanConfig {
    mode: 'access' | 'trunk' | 'hybrid';
    pvid: number;
    allowedVlans?: number[];
    taggedVlans?: number[];
    untaggedVlans?: number[];
  }

  /** QoS配置 */
  interface QosConfig {
    trustMode: 'untrust' | 'dscp' | 'cos';
    defaultPriority: number; // 0-7
    ingressRateLimit?: number; // Mbps
    egressRateLimit?: number; // Mbps
  }

  /** 端口 */
  interface Port {
    id: string;
    deviceId: string;
    device?: Device;
    portGroupId: string;
    portNumber: string; // 端口编号如"GE1/0/1"
    portAlias?: string; // 端口别名
    portType: PortGroup['portType'];
    speed: PortGroup['speed'];
    status: 'up' | 'down' | 'disabled' | 'error';
    linkStatus: 'connected' | 'disconnected';
    vlanConfig?: VlanConfig;
    qosConfig?: QosConfig;
    macBindings?: string[]; // MAC地址绑定
    portSecurity?: boolean;
    maxMacCount?: number;
    dot1xEnabled?: boolean;
    connectedDeviceId?: string;
    connectedPortId?: string;
    connectionPurpose?: string; // 连接用途
    lastUpdated: string;
    description?: string;
  }

  interface PortUpdateParams {
    portAlias?: string;
    status?: Port['status'];
    vlanConfig?: VlanConfig;
    qosConfig?: QosConfig;
    macBindings?: string[];
    portSecurity?: boolean;
    maxMacCount?: number;
    dot1xEnabled?: boolean;
    connectionPurpose?: string;
    description?: string;
  }

  // ==================== 连线 ====================

  /** 连线类型 */
  type ConnectionType =
    | 'network'
    | 'power'
    | 'management'
    | 'storage'
    | 'stack';

  /** 线缆类型 */
  type CableType =
    | 'Cat5e'
    | 'Cat6'
    | 'Cat6a'
    | 'Cat7'
    | 'SingleModeFiber'
    | 'MultiModeFiber'
    | 'DAC'
    | 'AOC'
    | 'PowerCable';

  /** 连线 */
  interface Connection {
    id: string;
    cableNumber: string; // 线缆编号
    connectionType: ConnectionType;
    cableType: CableType;
    cableColor?: string; // 线缆颜色
    cableLength?: number; // 线缆长度(米)
    sourceDeviceId: string;
    sourceDevice?: Device;
    sourcePortId: string;
    sourcePort?: Port;
    targetDeviceId: string;
    targetDevice?: Device;
    targetPortId: string;
    targetPort?: Port;
    status: 'active' | 'inactive' | 'faulty';
    description?: string;
    createdAt: string;
    updatedAt: string;
  }

  interface ConnectionCreateParams {
    cableNumber: string;
    connectionType: ConnectionType;
    cableType: CableType;
    cableColor?: string;
    cableLength?: number;
    sourceDeviceId: string;
    sourcePortId: string;
    targetDeviceId: string;
    targetPortId: string;
    description?: string;
  }

  // ==================== 统计数据 ====================

  /** 仪表板统计 */
  interface DashboardStats {
    datacenterCount: number;
    cabinetCount: number;
    deviceCount: number;
    connectionCount: number;
    onlineDevices: number;
    offlineDevices: number;
    warningDevices: number;
    errorDevices: number;
    cabinetUsageRate: number; // 机柜使用率
    uUsageRate: number; // U位使用率
    recentAlerts: Alert[];
  }

  /** 告警 */
  interface Alert {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    type: string;
    deviceId?: string;
    deviceName?: string;
    message: string;
    createdAt: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
  }

  // ==================== 3D场景 ====================

  /** 3D场景设置 */
  interface Scene3DSettings {
    backgroundColor: string;
    gridVisible: boolean;
    labelsVisible: boolean;
    connectionsVisible: boolean;
    animationsEnabled: boolean;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
  }

  /** 机柜在3D场景中的位置 */
  interface CabinetPosition {
    cabinetId: string;
    x: number;
    y: number;
    z: number;
    rotation: number;
  }

  // ==================== 环境监控 ====================

  /** 环境传感器数据 */
  interface EnvironmentSensor {
    id: string;
    cabinetId: string;
    cabinetName?: string;
    position: 'front' | 'rear' | 'top' | 'bottom';
    temperature: number; // 温度(℃)
    humidity: number; // 湿度(%)
    lastUpdated: string;
  }

  /** 机柜环境摘要 */
  interface CabinetEnvironment {
    cabinetId: string;
    cabinetName: string;
    datacenterId: string;
    datacenterName: string;
    avgTemperature: number;
    maxTemperature: number;
    minTemperature: number;
    avgHumidity: number;
    status: 'normal' | 'warning' | 'critical';
  }

  /** 能耗数据 */
  interface PowerConsumption {
    id: string;
    cabinetId?: string;
    cabinetName?: string;
    datacenterId?: string;
    datacenterName?: string;
    timestamp: string;
    activePower: number; // 有功功率(kW)
    apparentPower: number; // 视在功率(kVA)
    powerFactor: number; // 功率因数
    energy: number; // 累计电量(kWh)
    current?: number; // 电流(A)
    voltage?: number; // 电压(V)
  }

  /** PUE数据 */
  interface PueData {
    datacenterId: string;
    datacenterName: string;
    date: string;
    pue: number; // PUE值
    itPower: number; // IT负载功率(kW)
    totalPower: number; // 总功率(kW)
    coolingPower: number; // 制冷功率(kW)
  }

  /** 温度趋势数据 */
  interface TemperatureTrend {
    timestamp: string;
    avgTemperature: number;
    maxTemperature: number;
    minTemperature: number;
  }

  /** 能耗统计 */
  interface EnergyStats {
    totalEnergy: number; // 总电量(kWh)
    totalCost: number; // 总成本(元)
    avgPue: number; // 平均PUE
    carbonEmission: number; // 碳排放(kg)
    comparedLastMonth: number; // 环比上月(%)
  }

  // ==================== 告警中心 ====================

  /** 告警规则 */
  interface AlertRule {
    id: string;
    name: string;
    type:
      | 'temperature'
      | 'humidity'
      | 'power'
      | 'device_status'
      | 'port_status'
      | 'capacity';
    enabled: boolean;
    condition: {
      metric: string;
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      threshold: number;
      duration?: number; // 持续时间(秒)
    };
    severity: 'info' | 'warning' | 'error' | 'critical';
    notification: {
      email?: boolean;
      sms?: boolean;
      webhook?: string;
    };
    scope?: {
      datacenterId?: string;
      cabinetId?: string;
    };
    createdAt: string;
    updatedAt: string;
  }

  interface AlertRuleCreateParams {
    name: string;
    type: AlertRule['type'];
    enabled?: boolean;
    condition: AlertRule['condition'];
    severity: AlertRule['severity'];
    notification?: AlertRule['notification'];
    scope?: AlertRule['scope'];
  }

  /** 告警详情（扩展基础Alert） */
  interface AlertDetail extends Alert {
    ruleId?: string;
    ruleName?: string;
    source: 'manual' | 'system' | 'rule';
    cabinetId?: string;
    cabinetName?: string;
    datacenterId?: string;
    datacenterName?: string;
    value?: number; // 触发时的值
    threshold?: number; // 阈值
    resolvedAt?: string;
    resolvedBy?: string;
    notes?: string; // 处理备注
  }

  /** 告警统计 */
  interface AlertStats {
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
    unacknowledged: number;
    todayNew: number;
    avgResolveTime: number; // 平均处理时间(分钟)
  }

  /** 告警查询参数 */
  interface AlertQueryParams extends PageParams {
    level?: Alert['level'];
    type?: string;
    acknowledged?: boolean;
    startTime?: string;
    endTime?: string;
    deviceId?: string;
    cabinetId?: string;
    datacenterId?: string;
  }
}

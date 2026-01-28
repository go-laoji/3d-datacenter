/**
 * 电源拓扑图节点类型注册和导出
 */

import { DEVICE_NODE_TYPE, deviceNodeStyle } from './DeviceNode';
import { PDU_NODE_TYPE, pduNodeStyle } from './PDUNode';
import { UPS_NODE_TYPE, upsNodeStyle } from './UPSNode';
import { UTILITY_NODE_TYPE, utilityNodeStyle } from './UtilityNode';

// 节点样式类型
export type NodeStyleConfig = typeof utilityNodeStyle;

// 导出所有节点类型常量
export { UTILITY_NODE_TYPE, UPS_NODE_TYPE, PDU_NODE_TYPE, DEVICE_NODE_TYPE };

// 导出所有节点样式
export { utilityNodeStyle, upsNodeStyle, pduNodeStyle, deviceNodeStyle };

// 设备类型到节点样式的映射
export const powerNodeTypeToStyle: Record<string, NodeStyleConfig> = {
  utility: utilityNodeStyle,
  ups: upsNodeStyle,
  pdu: pduNodeStyle,
  device: deviceNodeStyle,
};

// 设备类型颜色映射
export const powerTypeColors: Record<string, string> = {
  utility: '#722ed1',
  ups: '#1890ff',
  pdu: '#13c2c2',
  device: '#52c41a',
};

// 电源路径颜色映射（使用与节点类型不同的颜色避免混淆）
export const powerPathColors: Record<string, string> = {
  A: '#fa8c16', // 橙色 - A路
  B: '#2f54eb', // 靛蓝色 - B路
};

// 链路状态颜色映射
export const linkStatusColors: Record<string, string> = {
  active: '#52c41a', // 绿色 - 正常
  inactive: '#d9d9d9', // 灰色 - 断开
  fault: '#f5222d', // 红色 - 故障
};

// 根据电源节点类型获取节点样式
export const getNodeStyleByPowerType = (powerType: string): NodeStyleConfig => {
  return powerNodeTypeToStyle[powerType] || deviceNodeStyle;
};

// 获取边线颜色，根据电源路径和状态
export const getEdgeColor = (powerPath: string, status: string): string => {
  if (status === 'fault') return linkStatusColors.fault;
  if (status === 'inactive') return linkStatusColors.inactive;
  return powerPathColors[powerPath] || '#d9d9d9';
};

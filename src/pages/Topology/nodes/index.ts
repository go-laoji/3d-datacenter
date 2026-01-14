/**
 * 拓扑图节点类型注册和导出
 */

import { FIREWALL_NODE_TYPE, firewallNodeStyle } from './FirewallNode';
import {
  LOADBALANCER_NODE_TYPE,
  loadbalancerNodeStyle,
} from './LoadbalancerNode';
import { OTHER_NODE_TYPE, otherNodeStyle } from './OtherNode';
import { ROUTER_NODE_TYPE, routerNodeStyle } from './RouterNode';
import { SERVER_NODE_TYPE, serverNodeStyle } from './ServerNode';
import { STORAGE_NODE_TYPE, storageNodeStyle } from './StorageNode';
import { SWITCH_NODE_TYPE, switchNodeStyle } from './SwitchNode';

// 节点样式类型
export type NodeStyleConfig = typeof switchNodeStyle;

// 导出所有节点类型常量
export {
  SWITCH_NODE_TYPE,
  ROUTER_NODE_TYPE,
  SERVER_NODE_TYPE,
  STORAGE_NODE_TYPE,
  FIREWALL_NODE_TYPE,
  LOADBALANCER_NODE_TYPE,
  OTHER_NODE_TYPE,
};

// 导出所有节点样式
export {
  switchNodeStyle,
  routerNodeStyle,
  serverNodeStyle,
  storageNodeStyle,
  firewallNodeStyle,
  loadbalancerNodeStyle,
  otherNodeStyle,
};

// 设备类型到节点样式的映射
export const deviceTypeToNodeStyle: Record<string, NodeStyleConfig> = {
  switch: switchNodeStyle,
  router: routerNodeStyle,
  server: serverNodeStyle,
  storage: storageNodeStyle,
  firewall: firewallNodeStyle,
  loadbalancer: loadbalancerNodeStyle,
  other: otherNodeStyle,
};

// 设备类型颜色映射
export const typeColors: Record<string, string> = {
  switch: '#1890ff',
  router: '#52c41a',
  server: '#722ed1',
  storage: '#faad14',
  firewall: '#f5222d',
  loadbalancer: '#13c2c2',
  other: '#8c8c8c',
};

// 连线类型颜色映射
export const connectionColors: Record<string, string> = {
  network: '#1890ff',
  storage: '#faad14',
  management: '#52c41a',
  power: '#f5222d',
};

// 根据设备类型获取节点样式
export const getNodeStyleByType = (deviceType: string): NodeStyleConfig => {
  return deviceTypeToNodeStyle[deviceType] || otherNodeStyle;
};

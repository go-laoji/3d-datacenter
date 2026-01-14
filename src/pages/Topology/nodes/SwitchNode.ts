/**
 * 交换机节点
 * 蓝色主题 (#1890ff)
 */

export const SWITCH_NODE_TYPE = 'switch-node';

// 交换机图标 SVG
const switchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1890ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

export const switchNodeStyle = {
  type: 'rect' as const,
  size: [80, 60] as [number, number],
  radius: 8,
  fill: '#fff',
  stroke: '#1890ff',
  lineWidth: 2,
  shadowColor: 'rgba(24, 144, 255, 0.2)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  iconFill: '#1890ff',
  iconWidth: 24,
  iconHeight: 24,
  iconSrc: `data:image/svg+xml,${encodeURIComponent(switchIconSvg)}`,
};

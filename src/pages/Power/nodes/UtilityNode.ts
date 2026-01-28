/**
 * 市电节点
 * 紫色主题 (#722ed1)
 */

export const UTILITY_NODE_TYPE = 'utility-node';

// 闪电图标 SVG
const utilityIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#722ed1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

export const utilityNodeStyle = {
  type: 'rect' as const,
  size: [80, 60] as [number, number],
  radius: 8,
  fill: '#fff',
  stroke: '#722ed1',
  lineWidth: 2,
  shadowColor: 'rgba(114, 46, 209, 0.2)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  iconFill: '#722ed1',
  iconWidth: 24,
  iconHeight: 24,
  iconSrc: `data:image/svg+xml,${encodeURIComponent(utilityIconSvg)}`,
};

/**
 * 服务器节点
 * 紫色主题 (#722ed1)
 */

export const SERVER_NODE_TYPE = 'server-node';

const serverIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#722ed1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;

export const serverNodeStyle = {
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
  iconSrc: `data:image/svg+xml,${encodeURIComponent(serverIconSvg)}`,
};

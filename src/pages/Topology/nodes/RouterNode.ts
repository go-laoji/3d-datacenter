/**
 * 路由器节点
 * 绿色主题 (#52c41a)
 */

export const ROUTER_NODE_TYPE = 'router-node';

const routerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/><line x1="6" y1="18" x2="6.01" y2="18"/><line x1="10" y1="18" x2="10.01" y2="18"/></svg>`;

export const routerNodeStyle = {
  type: 'rect' as const,
  size: [80, 60] as [number, number],
  radius: 8,
  fill: '#fff',
  stroke: '#52c41a',
  lineWidth: 2,
  shadowColor: 'rgba(82, 196, 26, 0.2)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  iconFill: '#52c41a',
  iconWidth: 24,
  iconHeight: 24,
  iconSrc: `data:image/svg+xml,${encodeURIComponent(routerIconSvg)}`,
};

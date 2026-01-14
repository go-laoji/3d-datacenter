/**
 * 负载均衡节点
 * 青色主题 (#13c2c2)
 */

export const LOADBALANCER_NODE_TYPE = 'loadbalancer-node';

const loadbalancerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#13c2c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;

export const loadbalancerNodeStyle = {
  type: 'rect' as const,
  size: [80, 60] as [number, number],
  radius: 8,
  fill: '#fff',
  stroke: '#13c2c2',
  lineWidth: 2,
  shadowColor: 'rgba(19, 194, 194, 0.2)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  iconFill: '#13c2c2',
  iconWidth: 24,
  iconHeight: 24,
  iconSrc: `data:image/svg+xml,${encodeURIComponent(loadbalancerIconSvg)}`,
};

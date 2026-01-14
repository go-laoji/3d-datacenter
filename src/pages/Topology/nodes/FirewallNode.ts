/**
 * 防火墙节点
 * 红色主题 (#f5222d)
 */

export const FIREWALL_NODE_TYPE = 'firewall-node';

const firewallIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

export const firewallNodeStyle = {
  type: 'rect' as const,
  size: [80, 60] as [number, number],
  radius: 8,
  fill: '#fff',
  stroke: '#f5222d',
  lineWidth: 2,
  shadowColor: 'rgba(245, 34, 45, 0.2)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  iconFill: '#f5222d',
  iconWidth: 24,
  iconHeight: 24,
  iconSrc: `data:image/svg+xml,${encodeURIComponent(firewallIconSvg)}`,
};

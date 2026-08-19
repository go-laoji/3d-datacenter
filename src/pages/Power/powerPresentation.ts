import type { PowerLink, PowerNode } from '@/services/idc/power';

export interface PowerPathTrace {
  path: 'A' | 'B';
  nodes: PowerNode[];
  healthy: boolean;
}

export const traceUpstreamPaths = (
  nodeId: string,
  nodes: PowerNode[],
  links: PowerLink[],
): PowerPathTrace[] => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const traces: PowerPathTrace[] = [];
  const incoming = links.filter(
    (link) => link.target === nodeId && link.status !== 'inactive',
  );
  incoming.forEach((startLink) => {
    const chain: PowerNode[] = [];
    let currentId: string | undefined = nodeId;
    let healthy = startLink.status === 'active';
    const visited = new Set<string>();
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const node = byId.get(currentId);
      if (node) {
        chain.unshift(node);
        healthy = healthy && node.status === 'online';
      }
      const parent = links.find(
        (link) =>
          link.target === currentId && link.powerPath === startLink.powerPath,
      );
      if (!parent) break;
      healthy = healthy && parent.status === 'active';
      currentId = parent.source;
    }
    traces.push({ path: startLink.powerPath, nodes: chain, healthy });
  });
  return traces;
};

export const getDownstreamDeviceIds = (
  nodeId: string,
  nodes: PowerNode[],
  links: PowerLink[],
) => {
  const reachable = new Set([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    links.forEach((link) => {
      if (reachable.has(link.source) && !reachable.has(link.target)) {
        reachable.add(link.target);
        changed = true;
      }
    });
  }
  return nodes
    .filter((node) => node.type === 'device' && reachable.has(node.id))
    .map((node) => node.id);
};

export const getPowerSummary = (nodes: PowerNode[], links: PowerLink[]) => ({
  sources: nodes.filter((node) => node.type === 'utility').length,
  pduCount: nodes.filter((node) => node.type === 'pdu').length,
  warningCount: nodes.filter((node) => node.status !== 'online').length,
  faultLinks: links.filter((link) => link.status !== 'active').length,
});

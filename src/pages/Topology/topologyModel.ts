import type {
  NetworkTopologyEdge,
  NetworkTopologyNode,
} from '@/services/idc/dashboard';

export type TopologyView = 'physical' | 'business' | 'cabinet';
export interface TopologyFilters {
  keyword?: string;
  status?: string;
  onlyAbnormal?: boolean;
}

const connectedNodeIds = (edges: NetworkTopologyEdge[], ids: Set<string>) => {
  const expanded = new Set(ids);
  edges.forEach((edge) => {
    if (ids.has(edge.source) || ids.has(edge.target)) {
      expanded.add(edge.source);
      expanded.add(edge.target);
    }
  });
  return expanded;
};

export const filterTopology = (
  nodes: NetworkTopologyNode[],
  edges: NetworkTopologyEdge[],
  filters: TopologyFilters,
) => {
  const matching = new Set(
    nodes
      .filter((node) => {
        if (filters.status && node.status !== filters.status) return false;
        if (
          filters.onlyAbnormal &&
          node.status === 'online' &&
          node.alertCount === 0
        )
          return false;
        if (
          filters.keyword &&
          !`${node.label} ${node.managementIp} ${node.cabinetId}`
            .toLowerCase()
            .includes(filters.keyword.toLowerCase())
        )
          return false;
        return true;
      })
      .map((node) => node.id),
  );
  const visible =
    filters.onlyAbnormal || filters.keyword
      ? connectedNodeIds(edges, matching)
      : matching;
  return {
    nodes: nodes.filter((node) => visible.has(node.id)),
    edges: edges.filter(
      (edge) => visible.has(edge.source) && visible.has(edge.target),
    ),
  };
};

export const aggregateByCabinet = (
  nodes: NetworkTopologyNode[],
  edges: NetworkTopologyEdge[],
) => {
  const grouped = new Map<string, NetworkTopologyNode[]>();
  nodes.forEach((node) => {
    grouped.set(node.cabinetId, [...(grouped.get(node.cabinetId) ?? []), node]);
  });
  const aggregatedNodes: NetworkTopologyNode[] = Array.from(
    grouped,
    ([cabinetId, members], index) => ({
      id: `cabinet:${cabinetId}`,
      label: `${cabinetId} (${members.length})`,
      type: 'cabinet',
      status: members.some((node) => node.status === 'offline')
        ? 'offline'
        : members.some((node) => node.status === 'warning')
          ? 'warning'
          : 'online',
      cabinetId,
      alertCount: members.reduce((sum, node) => sum + node.alertCount, 0),
      x: 180 + (index % 3) * 250,
      y: 180 + Math.floor(index / 3) * 220,
    }),
  );
  const cabinetByDevice = new Map(
    nodes.map((node) => [node.id, `cabinet:${node.cabinetId}`]),
  );
  const edgeMap = new Map<string, NetworkTopologyEdge>();
  edges.forEach((edge) => {
    const source = cabinetByDevice.get(edge.source);
    const target = cabinetByDevice.get(edge.target);
    if (!source || !target) return;
    if (source === target) return;
    const key = [source, target].sort().join('--');
    const current = edgeMap.get(key);
    edgeMap.set(key, {
      ...edge,
      id: `aggregate:${key}`,
      source,
      target,
      sourcePort: current ? `${current.sourcePort}, …` : edge.sourcePort,
      targetPort: current ? `${current.targetPort}, …` : edge.targetPort,
      status:
        current?.status === 'faulty' || edge.status === 'faulty'
          ? 'faulty'
          : 'active',
    });
  });
  return { nodes: aggregatedNodes, edges: Array.from(edgeMap.values()) };
};

export const findTopologyPath = (
  edges: NetworkTopologyEdge[],
  source: string,
  target: string,
) => {
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    adjacency.set(edge.source, [
      ...(adjacency.get(edge.source) ?? []),
      edge.target,
    ]);
    adjacency.set(edge.target, [
      ...(adjacency.get(edge.target) ?? []),
      edge.source,
    ]);
  });
  const queue: string[][] = [[source]];
  const visited = new Set([source]);
  while (queue.length) {
    const path = queue.shift();
    if (!path) break;
    const last = path.at(-1);
    if (!last) continue;
    if (last === target) return path;
    for (const next of adjacency.get(last) ?? [])
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
  }
  return [];
};

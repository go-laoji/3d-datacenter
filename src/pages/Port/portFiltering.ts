import type { PortView } from '@/services/idc/port';

export interface PortFilters {
  keyword?: string;
  status?: string;
  linkStatus?: string;
  speed?: string;
  vlan?: string;
}

export const filterPorts = (ports: PortView[], filters: PortFilters) =>
  ports.filter((port) => {
    const query = filters.keyword?.toLowerCase() ?? '';
    if (
      query &&
      !`${port.portNumber} ${port.portAlias} ${port.description} ${port.connectedDeviceName}`
        .toLowerCase()
        .includes(query)
    )
      return false;
    if (filters.status && port.status !== filters.status) return false;
    if (filters.linkStatus && port.linkStatus !== filters.linkStatus)
      return false;
    if (filters.speed && port.speed !== filters.speed) return false;
    if (
      filters.vlan &&
      ![port.vlanConfig?.pvid, ...(port.vlanConfig?.allowedVlans ?? [])]
        .map(String)
        .includes(filters.vlan)
    )
      return false;
    return true;
  });

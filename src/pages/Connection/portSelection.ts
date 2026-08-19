export type PortAvailability =
  | 'available'
  | 'connected'
  | 'disabled'
  | 'error'
  | 'excluded';

export const getPortAvailability = (
  port: Pick<IDC.Port, 'id' | 'linkStatus' | 'status'>,
  excludedPortId?: string,
): PortAvailability => {
  if (port.id === excludedPortId) return 'excluded';
  if (port.linkStatus === 'connected') return 'connected';
  if (port.status === 'disabled') return 'disabled';
  if (port.status === 'error') return 'error';
  return 'available';
};

export const isPortAvailable = (
  port: Pick<IDC.Port, 'id' | 'linkStatus' | 'status'>,
  excludedPortId?: string,
) => getPortAvailability(port, excludedPortId) === 'available';

export const getPortDisplayName = (
  port: Pick<IDC.Port, 'portNumber' | 'portAlias'>,
) =>
  port.portAlias ? `${port.portNumber} · ${port.portAlias}` : port.portNumber;

export const portAvailabilityText: Record<PortAvailability, string> = {
  available: '可用',
  connected: '已连接',
  disabled: '已禁用',
  error: '端口异常',
  excluded: '已在另一端选择',
};

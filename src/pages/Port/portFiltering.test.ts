import { describe, expect, it } from 'vitest';
import type { PortView } from '@/services/idc/port';
import { filterPorts } from './portFiltering';

const port = {
  id: 'p1',
  portNumber: 'GE1/0/1',
  portAlias: 'App uplink',
  status: 'up',
  linkStatus: 'connected',
  speed: '10G',
  vlanConfig: { mode: 'trunk', pvid: 1, allowedVlans: [100, 200] },
  connectedDeviceName: '应用服务器',
  description: '生产网络',
} as PortView;

describe('port filtering', () => {
  it('searches port and peer context', () =>
    expect(filterPorts([port], { keyword: '应用服务器' })).toHaveLength(1));
  it('combines status, speed and vlan filters', () =>
    expect(
      filterPorts([port], {
        status: 'up',
        linkStatus: 'connected',
        speed: '10G',
        vlan: '200',
      }),
    ).toHaveLength(1));
  it('rejects a mismatched vlan', () =>
    expect(filterPorts([port], { vlan: '300' })).toHaveLength(0));
});

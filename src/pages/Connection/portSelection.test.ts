import {
  getPortAvailability,
  getPortDisplayName,
  isPortAvailable,
} from './portSelection';

const createPort = (
  overrides: Partial<
    Pick<IDC.Port, 'id' | 'linkStatus' | 'status' | 'portNumber' | 'portAlias'>
  > = {},
) => ({
  id: 'port-1',
  linkStatus: 'disconnected' as const,
  status: 'down' as const,
  portNumber: 'GE1/0/1',
  ...overrides,
});

describe('connection port selection', () => {
  it('allows a disconnected operational port', () => {
    expect(isPortAvailable(createPort())).toBe(true);
  });

  it('rejects connected, disabled, error and excluded ports', () => {
    expect(getPortAvailability(createPort({ linkStatus: 'connected' }))).toBe(
      'connected',
    );
    expect(getPortAvailability(createPort({ status: 'disabled' }))).toBe(
      'disabled',
    );
    expect(getPortAvailability(createPort({ status: 'error' }))).toBe('error');
    expect(getPortAvailability(createPort(), 'port-1')).toBe('excluded');
  });

  it('uses the typed port number and optional alias as its label', () => {
    expect(getPortDisplayName(createPort())).toBe('GE1/0/1');
    expect(getPortDisplayName(createPort({ portAlias: 'Core uplink' }))).toBe(
      'GE1/0/1 · Core uplink',
    );
  });
});

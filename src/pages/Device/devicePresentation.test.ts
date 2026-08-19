import {
  canPermanentlyDeleteDevice,
  getDeviceLifecycleStatus,
} from './devicePresentation';

const device = (overrides: Partial<IDC.Device> = {}): IDC.Device => ({
  id: 'dev-1',
  templateId: 'tpl-1',
  cabinetId: 'cab-1',
  assetCode: 'ASSET-1',
  name: 'Server 1',
  startU: 1,
  endU: 2,
  status: 'online',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('device lifecycle presentation', () => {
  it('maps mounted and maintenance devices', () => {
    expect(getDeviceLifecycleStatus(device())).toBe('mounted');
    expect(getDeviceLifecycleStatus(device({ status: 'maintenance' }))).toBe(
      'maintenance',
    );
  });

  it('treats unmounted assets as archived', () => {
    const archived = device({ isMounted: false });
    expect(getDeviceLifecycleStatus(archived)).toBe('archived');
    expect(canPermanentlyDeleteDevice(archived)).toBe(true);
  });

  it('does not allow permanent deletion of active assets', () => {
    expect(canPermanentlyDeleteDevice(device())).toBe(false);
  });
});

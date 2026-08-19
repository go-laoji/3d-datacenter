import { getDeviceWorldPosition } from './sceneCoordinates';

describe('datacenter scene coordinates', () => {
  it('uses the same U-slot center for focus and box selection', () => {
    const cabinet = { id: 'cab-1', uHeight: 42 } as IDC.Cabinet;
    const device = {
      id: 'device-1',
      cabinetId: 'cab-1',
      startU: 10,
      endU: 11,
    } as IDC.Device;

    const position = getDeviceWorldPosition([4, 0.9345, 7], cabinet, device);

    expect(position[0]).toBe(4);
    expect(position[1]).toBeCloseTo(0.445);
    expect(position[2]).toBeCloseTo(7.3);
  });
});

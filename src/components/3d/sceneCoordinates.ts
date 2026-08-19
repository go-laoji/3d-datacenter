const U_HEIGHT = 0.0445;

export function getDeviceWorldPosition(
  cabinetPosition: [number, number, number],
  cabinet: Pick<IDC.Cabinet, 'uHeight'>,
  device: Pick<IDC.Device, 'startU' | 'endU'>,
): [number, number, number] {
  const localCenterY =
    (device.startU - 1) * U_HEIGHT -
    (cabinet.uHeight * U_HEIGHT) / 2 +
    ((device.endU - device.startU + 1) * U_HEIGHT) / 2;
  return [
    cabinetPosition[0],
    cabinetPosition[1] + localCenterY,
    cabinetPosition[2] + 0.3,
  ];
}

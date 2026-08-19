export const lifecycleConfig: Record<
  IDC.DeviceLifecycleStatus,
  { text: string; color: string }
> = {
  inventory: { text: '库存', color: 'default' },
  pending_mount: { text: '待上架', color: 'processing' },
  mounted: { text: '在架', color: 'success' },
  maintenance: { text: '维护', color: 'warning' },
  pending_unmount: { text: '待下架', color: 'orange' },
  archived: { text: '已归档', color: 'default' },
};

export const getDeviceLifecycleStatus = (
  device: IDC.Device,
): IDC.DeviceLifecycleStatus => {
  if (device.lifecycleStatus) return device.lifecycleStatus;
  if (device.isMounted === false) return 'archived';
  if (device.status === 'maintenance') return 'maintenance';
  return 'mounted';
};

export const canPermanentlyDeleteDevice = (device: IDC.Device) =>
  getDeviceLifecycleStatus(device) === 'archived';

import type { ConnectionValidation } from '@/services/idc/connection';

type Selection = Pick<
  IDC.ConnectionCreateParams,
  | 'sourceDeviceId'
  | 'sourcePortId'
  | 'targetDeviceId'
  | 'targetPortId'
  | 'cableType'
>;

export const validateConnectionSelection = (
  selection: Selection,
  occupiedPorts: ReadonlySet<string>,
): ConnectionValidation => {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (selection.sourceDeviceId === selection.targetDeviceId)
    blockers.push('源设备和目标设备相同，可能形成设备内环路');
  if (selection.sourcePortId === selection.targetPortId)
    blockers.push('不能将同一个端口连接到自身');
  if (occupiedPorts.has(selection.sourcePortId))
    blockers.push('源端口已经存在有效物理连接');
  if (occupiedPorts.has(selection.targetPortId))
    blockers.push('目标端口已经存在有效物理连接');
  if (
    selection.cableType.includes('Fiber') &&
    (!selection.sourcePortId.toLowerCase().includes('sfp') ||
      !selection.targetPortId.toLowerCase().includes('sfp'))
  ) {
    warnings.push('光纤类型与端口命名不完全匹配，请核对模块与介质');
  }
  return { valid: blockers.length === 0, blockers, warnings };
};

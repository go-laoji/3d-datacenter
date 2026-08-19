import { getLayoutContentFingerprint } from './layoutEditorSession';

export type LayoutObjectKind = 'cabinet' | 'zone' | 'facility';

export interface LayoutSelection {
  kind: LayoutObjectKind;
  id: string;
}

export interface LayoutDraft {
  datacenterId: string;
  loadedVersion: number;
  savedAt: string;
  workingCopy: IDC.DatacenterLayout;
}

export interface AutoLayoutOptions {
  columns: number;
  spacingX: number;
  spacingY: number;
  startX: number;
  startY: number;
}

export interface LayoutDiffSummary {
  cabinetChanges: number;
  zoneChanges: number;
  facilityChanges: number;
  canvasChanged: boolean;
}

export function cloneLayout(layout: IDC.DatacenterLayout) {
  return JSON.parse(JSON.stringify(layout)) as IDC.DatacenterLayout;
}

export function createLayoutDraft(
  workingCopy: IDC.DatacenterLayout,
  loadedVersion: number,
  now = new Date(),
): LayoutDraft {
  return {
    datacenterId: workingCopy.datacenterId,
    loadedVersion,
    savedAt: now.toISOString(),
    workingCopy: cloneLayout(workingCopy),
  };
}

export function parseLayoutDraft(value: string | null): LayoutDraft | null {
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as Partial<LayoutDraft>;
    if (
      !draft.datacenterId ||
      typeof draft.loadedVersion !== 'number' ||
      !draft.savedAt ||
      !draft.workingCopy ||
      draft.workingCopy.datacenterId !== draft.datacenterId
    ) {
      return null;
    }
    return draft as LayoutDraft;
  } catch {
    return null;
  }
}

export function getPendingCabinets(
  cabinets: IDC.Cabinet[],
  layout: IDC.DatacenterLayout,
) {
  const placedIds = new Set(layout.cabinets.map((item) => item.cabinetId));
  return cabinets.filter((cabinet) => !placedIds.has(cabinet.id));
}

export function generateAutoLayout(
  layout: IDC.DatacenterLayout,
  cabinets: IDC.Cabinet[],
  options: AutoLayoutOptions,
) {
  const columns = Math.max(1, Math.round(options.columns));
  return {
    ...cloneLayout(layout),
    cabinets: cabinets.map((cabinet, index) => ({
      cabinetId: cabinet.id,
      x: options.startX + (index % columns) * options.spacingX,
      y: options.startY + Math.floor(index / columns) * options.spacingY,
      rotation: 0,
    })),
  };
}

export function moveLayoutObject(
  layout: IDC.DatacenterLayout,
  selection: LayoutSelection,
  x: number,
  y: number,
) {
  const next = cloneLayout(layout);
  if (selection.kind === 'cabinet') {
    next.cabinets = next.cabinets.map((item) =>
      item.cabinetId === selection.id ? { ...item, x, y } : item,
    );
  } else if (selection.kind === 'zone') {
    next.zones = next.zones.map((item) =>
      item.id === selection.id ? { ...item, x, y } : item,
    );
  } else {
    next.facilities = next.facilities.map((item) =>
      item.id === selection.id ? { ...item, x, y } : item,
    );
  }
  return next;
}

export function removeLayoutObject(
  layout: IDC.DatacenterLayout,
  selection: LayoutSelection,
) {
  const next = cloneLayout(layout);
  if (selection.kind === 'cabinet') {
    next.cabinets = next.cabinets.filter(
      (item) => item.cabinetId !== selection.id,
    );
  } else if (selection.kind === 'zone') {
    next.zones = next.zones.filter((item) => item.id !== selection.id);
  } else {
    next.facilities = next.facilities.filter(
      (item) => item.id !== selection.id,
    );
  }
  return next;
}

export function summarizeLayoutDiff(
  local: IDC.DatacenterLayout,
  server: IDC.DatacenterLayout,
): LayoutDiffSummary {
  const countChanged = <T>(localItems: T[], serverItems: T[]) => {
    const localSet = new Set(localItems.map((item) => JSON.stringify(item)));
    const serverSet = new Set(serverItems.map((item) => JSON.stringify(item)));
    return (
      [...localSet].filter((item) => !serverSet.has(item)).length +
      [...serverSet].filter((item) => !localSet.has(item)).length
    );
  };
  return {
    cabinetChanges: countChanged(local.cabinets, server.cabinets),
    zoneChanges: countChanged(local.zones, server.zones),
    facilityChanges: countChanged(local.facilities, server.facilities),
    canvasChanged:
      local.canvasWidth !== server.canvasWidth ||
      local.canvasHeight !== server.canvasHeight ||
      local.pxPerMeter !== server.pxPerMeter,
  };
}

export function hasLayoutChanges(
  baseline: IDC.DatacenterLayout,
  workingCopy: IDC.DatacenterLayout,
) {
  return (
    getLayoutContentFingerprint(baseline) !==
    getLayoutContentFingerprint(workingCopy)
  );
}

import { describe, expect, it } from 'vitest';
import {
  createLayoutDraft,
  generateAutoLayout,
  getPendingCabinets,
  moveLayoutObject,
  parseLayoutDraft,
  summarizeLayoutDiff,
} from './layoutEditorModel';

const layout: IDC.DatacenterLayout = {
  datacenterId: 'dc-1',
  version: 2,
  canvasWidth: 60,
  canvasHeight: 40,
  pxPerMeter: 50,
  cabinets: [{ cabinetId: 'cab-1', x: 1, y: 2 }],
  zones: [],
  facilities: [],
  updatedAt: '2026-08-20T00:00:00Z',
};
const cabinets = [
  { id: 'cab-1', name: 'A1' },
  { id: 'cab-2', name: 'A2' },
] as IDC.Cabinet[];

describe('layout editor model', () => {
  it('finds cabinets that still require manual placement', () => {
    expect(getPendingCabinets(cabinets, layout)[0].id).toBe('cab-2');
  });

  it('generates an explicit auto-layout preview', () => {
    const preview = generateAutoLayout(layout, cabinets, {
      columns: 2,
      spacingX: 1.2,
      spacingY: 1.8,
      startX: 2,
      startY: 3,
    });
    expect(preview.cabinets).toEqual([
      { cabinetId: 'cab-1', x: 2, y: 3, rotation: 0 },
      { cabinetId: 'cab-2', x: 3.2, y: 3, rotation: 0 },
    ]);
    expect(layout.cabinets[0].x).toBe(1);
  });

  it('moves objects immutably and summarizes conflicts', () => {
    const moved = moveLayoutObject(
      layout,
      { kind: 'cabinet', id: 'cab-1' },
      4,
      5,
    );
    expect(moved.cabinets[0].x).toBe(4);
    expect(summarizeLayoutDiff(moved, layout).cabinetChanges).toBe(2);
  });

  it('validates locally persisted drafts', () => {
    const draft = createLayoutDraft(
      layout,
      2,
      new Date('2026-08-20T08:00:00Z'),
    );
    expect(parseLayoutDraft(JSON.stringify(draft))).toEqual(draft);
    expect(parseLayoutDraft('{bad')).toBeNull();
  });
});

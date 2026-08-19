import { describe, expect, it } from 'vitest';
import {
  getLayoutContentFingerprint,
  isEditableKeyboardTarget,
} from './layoutEditorSession';

describe('layout editor session', () => {
  it('recognizes native and ARIA editable keyboard targets', () => {
    expect(isEditableKeyboardTarget(document.createElement('input'))).toBe(
      true,
    );
    expect(isEditableKeyboardTarget(document.createElement('textarea'))).toBe(
      true,
    );

    const combobox = document.createElement('div');
    combobox.setAttribute('role', 'combobox');
    expect(isEditableKeyboardTarget(combobox)).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement('button'))).toBe(
      true,
    );
    expect(isEditableKeyboardTarget(document.createElement('div'))).toBe(false);
  });

  it('ignores layout version metadata when checking dirty content', () => {
    const layout: IDC.DatacenterLayout = {
      datacenterId: 'dc-1',
      version: 1,
      canvasWidth: 60,
      canvasHeight: 40,
      pxPerMeter: 50,
      cabinets: [],
      zones: [],
      facilities: [],
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(
      getLayoutContentFingerprint({
        ...layout,
        version: 2,
        updatedAt: '2026-01-02T00:00:00Z',
      }),
    ).toBe(getLayoutContentFingerprint(layout));
  });
});

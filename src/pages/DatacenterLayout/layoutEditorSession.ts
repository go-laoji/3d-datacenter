export const isEditableKeyboardTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName)) {
    return true;
  }

  const role = target.getAttribute('role');
  const interactiveRoles = [
    'textbox',
    'combobox',
    'spinbutton',
    'button',
    'checkbox',
    'switch',
    'slider',
    'menuitem',
    'option',
  ];
  if (interactiveRoles.includes(role || '')) return true;

  return Boolean(
    target.closest(
      'button, a, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="spinbutton"], [role="button"], [role="checkbox"], [role="switch"], [role="slider"], [role="menuitem"], [role="option"]',
    ),
  );
};

export const getLayoutContentFingerprint = (
  layout: IDC.DatacenterLayout,
  cabinets: IDC.DatacenterLayoutCabinetItem[] = layout.cabinets,
) =>
  JSON.stringify({
    canvasWidth: layout.canvasWidth,
    canvasHeight: layout.canvasHeight,
    pxPerMeter: layout.pxPerMeter,
    cabinets,
    zones: layout.zones,
    facilities: layout.facilities,
  });

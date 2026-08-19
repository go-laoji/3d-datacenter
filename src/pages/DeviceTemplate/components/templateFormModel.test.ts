import {
  createDefaultPortGroups,
  createTemplatePayload,
  duplicatePortGroup,
  getEditablePortGroups,
  getTemplateFormInitialValues,
  movePortGroup,
} from './templateFormModel';

const template: IDC.DeviceTemplate = {
  id: 'template-1',
  name: 'Access switch',
  category: 'switch',
  brand: 'Example',
  model: 'SW-48',
  uHeight: 1,
  maxPower: 120,
  isBuiltin: false,
  portGroups: [
    {
      id: 'group-1',
      name: 'Access ports',
      portType: 'RJ45',
      count: 48,
      speed: '1G',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('device template form model', () => {
  it('maps every editable template field into initial values', () => {
    expect(getTemplateFormInitialValues(template)).toMatchObject({
      name: 'Access switch',
      category: 'switch',
      brand: 'Example',
      model: 'SW-48',
      uHeight: 1,
      maxPower: 120,
    });
  });

  it('removes persisted port group ids from editable values', () => {
    expect(getEditablePortGroups(template)).toEqual([
      {
        name: 'Access ports',
        portType: 'RJ45',
        count: 48,
        speed: '1G',
      },
    ]);
  });

  it('creates a clone name while preserving the source fields', () => {
    expect(getTemplateFormInitialValues(template, true)).toMatchObject({
      name: 'Access switch - 副本',
      brand: 'Example',
      model: 'SW-48',
      maxPower: 120,
    });
  });

  it('trims names while preserving non-visible template metadata', () => {
    const values = {
      ...getTemplateFormInitialValues(template),
      name: '  Access switch  ',
      specs: { throughput: '1 Tbps' },
    };
    const payload = createTemplatePayload(values, [
      {
        name: '  Uplink  ',
        portType: 'SFP+',
        count: 4,
        speed: '10G',
      },
    ]);
    expect(payload.name).toBe('Access switch');
    expect(payload.portGroups[0].name).toBe('Uplink');
    expect(payload.specs).toEqual({ throughput: '1 Tbps' });
  });

  it('supports batch creation, duplication and ordering of port groups', () => {
    const groups = createDefaultPortGroups(3);
    expect(groups).toHaveLength(3);

    const duplicated = duplicatePortGroup(
      [{ ...groups[0], name: 'Uplink' }, groups[1]],
      0,
    );
    expect(duplicated.map((group) => group.name)).toEqual([
      'Uplink',
      'Uplink - 副本',
      '',
    ]);

    expect(movePortGroup(duplicated, 1, -1)[0].name).toBe('Uplink - 副本');
  });
});

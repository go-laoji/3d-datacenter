export type EditablePortGroup = Omit<IDC.PortGroup, 'id'>;

export type DeviceTemplateFormValues = Omit<
  IDC.DeviceTemplateCreateParams,
  'portGroups'
>;

export const createDefaultPortGroup = (): EditablePortGroup => ({
  name: '',
  portType: 'RJ45',
  count: 1,
  speed: '1G',
});

export const createDefaultPortGroups = (count: number) =>
  Array.from({ length: Math.max(1, count) }, createDefaultPortGroup);

export const duplicatePortGroup = (
  portGroups: EditablePortGroup[],
  index: number,
) => {
  const source = portGroups[index];
  if (!source) return portGroups;
  const clone = { ...source, name: `${source.name || '端口组'} - 副本` };
  return [
    ...portGroups.slice(0, index + 1),
    clone,
    ...portGroups.slice(index + 1),
  ];
};

export const movePortGroup = (
  portGroups: EditablePortGroup[],
  index: number,
  direction: -1 | 1,
) => {
  const target = index + direction;
  if (target < 0 || target >= portGroups.length) return portGroups;
  const next = [...portGroups];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const getEditablePortGroups = (
  template?: IDC.DeviceTemplate,
): EditablePortGroup[] => {
  if (!template?.portGroups.length) return [createDefaultPortGroup()];

  return template.portGroups.map(({ id: _id, ...portGroup }) => ({
    ...portGroup,
  }));
};

export const getTemplateFormInitialValues = (
  template?: IDC.DeviceTemplate,
  clone = false,
): DeviceTemplateFormValues => ({
  name: template ? `${template.name}${clone ? ' - 副本' : ''}` : '',
  category: template?.category ?? 'server',
  brand: template?.brand ?? '',
  model: template?.model ?? '',
  uHeight: template?.uHeight ?? 1,
  maxPower: template?.maxPower ?? 0,
  frontColor: template?.frontColor,
  description: template?.description,
  specs: template?.specs,
});

export const createTemplatePayload = (
  values: DeviceTemplateFormValues,
  portGroups: EditablePortGroup[],
): IDC.DeviceTemplateCreateParams => ({
  ...values,
  name: values.name.trim(),
  brand: values.brand.trim(),
  model: values.model.trim(),
  portGroups: portGroups.map((portGroup) => ({
    ...portGroup,
    name: portGroup.name.trim(),
  })),
});

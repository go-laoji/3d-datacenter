import type {
  AccessOrganization,
  AccessPermission,
  AccessRole,
  AccessUser,
} from '@/services/platform';

export function getOrganizationPath(
  organizationId: string,
  organizations: AccessOrganization[],
) {
  const names: string[] = [];
  let current = organizations.find((item) => item.id === organizationId);
  while (current) {
    names.unshift(current.name);
    current = organizations.find((item) => item.id === current?.parentId);
  }
  return names.join(' / ') || '未分组';
}

export function getEffectiveAccess(
  user: AccessUser,
  roles: AccessRole[],
  permissions: AccessPermission[],
) {
  const assignedRoles = roles.filter((role) => user.roleIds.includes(role.id));
  const permissionKeys = new Set(
    assignedRoles.flatMap((role) => role.permissionKeys),
  );
  const datacenterIds = new Set(
    assignedRoles.flatMap((role) => role.datacenterIds),
  );
  return {
    permissions: permissions.filter((permission) =>
      permissionKeys.has(permission.key),
    ),
    datacenterIds: [...datacenterIds],
  };
}

export function groupPermissions(permissions: AccessPermission[]) {
  return permissions.reduce<Record<string, AccessPermission[]>>(
    (groups, permission) => {
      groups[permission.group] = [
        ...(groups[permission.group] ?? []),
        permission,
      ];
      return groups;
    },
    {},
  );
}

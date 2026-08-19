import { request } from '@umijs/max';

export interface AccessUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  organizationId: string;
  roleIds: string[];
  status: 'enabled' | 'disabled';
  lastActiveAt?: string;
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  permissionKeys: string[];
  datacenterIds: string[];
  memberCount: number;
  builtIn?: boolean;
}

export interface AccessOrganization {
  id: string;
  name: string;
  parentId?: string;
  memberCount: number;
}

export interface AccessPermission {
  key: string;
  name: string;
  group: string;
}

export interface AccessSnapshot {
  users: AccessUser[];
  roles: AccessRole[];
  organizations: AccessOrganization[];
  permissions: AccessPermission[];
  datacenters: { id: string; name: string }[];
}

export type AccessUserInput = Omit<AccessUser, 'id' | 'lastActiveAt'> & {
  id?: string;
};

export async function getAccessSnapshot() {
  return request<{ success: boolean; data: AccessSnapshot }>(
    '/api/platform/access',
    { method: 'GET' },
  );
}

export async function saveAccessUser(data: AccessUserInput) {
  return request<{ success: boolean; data: AccessUser }>('/api/platform/users', {
    method: data.id ? 'PUT' : 'POST',
    data,
  });
}

export async function setAccessUserStatus(
  id: string,
  status: AccessUser['status'],
) {
  return request<{ success: boolean; data: AccessUser }>(
    `/api/platform/users/${id}/status`,
    { method: 'PUT', data: { status } },
  );
}

export async function saveAccessRole(data: AccessRole) {
  return request<{ success: boolean; data: AccessRole }>(
    '/api/platform/roles',
    { method: 'PUT', data },
  );
}

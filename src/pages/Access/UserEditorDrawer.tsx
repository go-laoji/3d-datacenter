import {
  DrawerForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type {
  AccessSnapshot,
  AccessUser,
  AccessUserInput,
} from '@/services/platform';

interface UserEditorDrawerProps {
  open: boolean;
  user?: AccessUser;
  snapshot: AccessSnapshot;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AccessUserInput) => Promise<boolean>;
}

export function UserEditorDrawer({
  open,
  user,
  snapshot,
  onOpenChange,
  onSubmit,
}: UserEditorDrawerProps) {
  return (
    <DrawerForm<AccessUserInput>
      title={user ? `编辑用户 · ${user.name}` : '新增用户'}
      width={520}
      open={open}
      onOpenChange={onOpenChange}
      initialValues={
        user ?? { status: 'enabled', roleIds: [], organizationId: 'org-ops' }
      }
      key={user?.id ?? 'new'}
      drawerProps={{ destroyOnClose: true }}
      onFinish={(values) => onSubmit({ ...values, id: user?.id })}
    >
      <ProFormText name="name" label="姓名" rules={[{ required: true }]} />
      <ProFormText
        name="username"
        label="登录账号"
        rules={[{ required: true }]}
      />
      <ProFormText
        name="email"
        label="邮箱"
        rules={[{ type: 'email', required: true }]}
      />
      <ProFormText name="phone" label="手机号" rules={[{ required: true }]} />
      <ProFormSelect
        name="organizationId"
        label="所属组织"
        rules={[{ required: true }]}
        options={snapshot.organizations.map((organization) => ({
          value: organization.id,
          label: organization.name,
        }))}
      />
      <ProFormSelect
        name="roleIds"
        label="角色"
        mode="multiple"
        rules={[{ required: true }]}
        options={snapshot.roles.map((role) => ({
          value: role.id,
          label: role.name,
        }))}
      />
      <ProFormSelect
        name="status"
        label="账号状态"
        options={[
          { value: 'enabled', label: '启用' },
          { value: 'disabled', label: '停用' },
        ]}
      />
    </DrawerForm>
  );
}

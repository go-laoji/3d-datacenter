import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Skeleton,
  Tabs,
  Tag,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { DangerAction, DataFreshness } from '@/components/operations';
import {
  type AccessSnapshot,
  type AccessUser,
  type AccessUserInput,
  getAccessSnapshot,
  saveAccessRole,
  saveAccessUser,
  setAccessUserStatus,
} from '@/services/platform';
import { AccessOrganizations } from './AccessOrganizations';
import { AccessRoles } from './AccessRoles';
import { AccessUsers } from './AccessUsers';
import { getEffectiveAccess } from './accessModel';
import { UserEditorDrawer } from './UserEditorDrawer';

export default function AccessPage() {
  const { message } = App.useApp();
  const [snapshot, setSnapshot] = useState<AccessSnapshot>();
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AccessUser>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<AccessUser>();
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const selectedUserId = params.get('userId') ?? undefined;
  const selectedRoleId = params.get('roleId') ?? undefined;

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await getAccessSnapshot();
      setSnapshot(response.data);
      const deepLinkedUser = response.data.users.find(
        (user) => user.id === selectedUserId,
      );
      if (deepLinkedUser) setInspectedUser(deepLinkedUser);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  if (loading || !snapshot) {
    return (
      <PageContainer title="访问控制">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );
  }
  const effectiveAccess = inspectedUser
    ? getEffectiveAccess(inspectedUser, snapshot.roles, snapshot.permissions)
    : undefined;

  const submitUser = async (values: AccessUserInput) => {
    await saveAccessUser(values);
    message.success(values.id ? '用户信息已更新' : '用户已创建');
    await refresh();
    return true;
  };

  return (
    <PageContainer
      title="访问控制"
      subTitle="用户、角色、组织和数据中心范围的统一授权演示"
      extra={
        <DataFreshness
          source="Mock IAM"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Card>
        <Tabs
          defaultActiveKey={selectedRoleId ? 'roles' : 'users'}
          items={[
            {
              key: 'users',
              label: `用户 ${snapshot.users.length}`,
              children: (
                <AccessUsers
                  snapshot={snapshot}
                  selectedUserId={selectedUserId}
                  onEdit={(user) => {
                    setEditingUser(user);
                    setEditorOpen(true);
                  }}
                  onInspect={setInspectedUser}
                  onStatusChange={(user) => {
                    const next =
                      user.status === 'enabled' ? 'disabled' : 'enabled';
                    void setAccessUserStatus(user.id, next).then(async () => {
                      message.success(
                        next === 'enabled' ? '账号已启用' : '账号已停用',
                      );
                      await refresh();
                    });
                  }}
                />
              ),
            },
            {
              key: 'roles',
              label: `角色 ${snapshot.roles.length}`,
              children: (
                <AccessRoles
                  snapshot={snapshot}
                  selectedRoleId={selectedRoleId}
                  onSave={async (role) => {
                    await saveAccessRole(role);
                    message.success('角色权限与数据范围已保存');
                    await refresh();
                  }}
                />
              ),
            },
            {
              key: 'organizations',
              label: '组织与继承',
              children: <AccessOrganizations snapshot={snapshot} />,
            },
          ]}
        />
      </Card>
      <UserEditorDrawer
        open={editorOpen}
        user={editingUser}
        snapshot={snapshot}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingUser(undefined);
        }}
        onSubmit={submitUser}
      />
      <Drawer
        title="用户有效权限"
        open={Boolean(inspectedUser)}
        onClose={() => setInspectedUser(undefined)}
        width={520}
        extra={
          inspectedUser && (
            <DangerAction
              title="停用用户"
              impact="该用户将立即失去登录和 API 访问能力，历史审计记录会保留。"
              confirmPhrase={inspectedUser.username}
              onConfirm={async () => {
                await setAccessUserStatus(inspectedUser.id, 'disabled');
                message.success('用户已停用');
                setInspectedUser(undefined);
                await refresh();
              }}
              buttonProps={{ size: 'small' }}
            >
              停用账号
            </DangerAction>
          )
        }
      >
        {inspectedUser && effectiveAccess ? (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="用户">
                {inspectedUser.name} · {inspectedUser.username}
              </Descriptions.Item>
              <Descriptions.Item label="有效角色">
                {inspectedUser.roleIds.map((id) => (
                  <Tag key={id}>
                    {snapshot.roles.find((role) => role.id === id)?.name}
                  </Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="数据范围">
                {effectiveAccess.datacenterIds.includes('*')
                  ? '全部数据中心'
                  : effectiveAccess.datacenterIds
                      .map(
                        (id) =>
                          snapshot.datacenters.find((item) => item.id === id)
                            ?.name,
                      )
                      .join('、')}
              </Descriptions.Item>
              <Descriptions.Item label="有效权限">
                {effectiveAccess.permissions.map((permission) => (
                  <Tag color="blue" key={permission.key}>
                    {permission.name}
                  </Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <Empty />
        )}
      </Drawer>
    </PageContainer>
  );
}

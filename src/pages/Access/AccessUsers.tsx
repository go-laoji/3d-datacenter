import { Button, Input, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { Edit3, Plus, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EntityLink, EntityStatus } from '@/components/operations';
import type { AccessSnapshot, AccessUser } from '@/services/platform';
import { getOrganizationPath } from './accessModel';

interface AccessUsersProps {
  snapshot: AccessSnapshot;
  selectedUserId?: string;
  onEdit: (user?: AccessUser) => void;
  onInspect: (user: AccessUser) => void;
  onStatusChange: (user: AccessUser) => void;
}

export function AccessUsers({
  snapshot,
  selectedUserId,
  onEdit,
  onInspect,
  onStatusChange,
}: AccessUsersProps) {
  const [keyword, setKeyword] = useState('');
  const users = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return snapshot.users;
    return snapshot.users.filter((user) =>
      [user.name, user.username, user.email].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [keyword, snapshot.users]);

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          aria-label="搜索用户"
          placeholder="姓名、账号或邮箱"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ width: 280 }}
        />
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => onEdit()}
        >
          新增用户
        </Button>
      </Space>
      <Table<AccessUser>
        rowKey="id"
        dataSource={users}
        pagination={false}
        rowClassName={(record) =>
          record.id === selectedUserId ? 'ant-table-row-selected' : ''
        }
        columns={[
          {
            title: '用户',
            render: (_, user) => (
              <Space direction="vertical" size={0}>
                <EntityLink type="user" id={user.id}>
                  {user.name}
                </EntityLink>
                <small>
                  {user.username} · {user.email}
                </small>
              </Space>
            ),
          },
          {
            title: '组织',
            render: (_, user) =>
              getOrganizationPath(user.organizationId, snapshot.organizations),
          },
          {
            title: '角色',
            render: (_, user) =>
              user.roleIds.map((id) => (
                <Tag key={id}>
                  {snapshot.roles.find((role) => role.id === id)?.name ?? id}
                </Tag>
              )),
          },
          {
            title: '状态',
            render: (_, user) => <EntityStatus status={user.status} />,
          },
          {
            title: '最近活跃',
            render: (_, user) =>
              user.lastActiveAt
                ? dayjs(user.lastActiveAt).format('MM-DD HH:mm')
                : '--',
          },
          {
            title: '操作',
            render: (_, user) => (
              <Space>
                <Button
                  type="link"
                  icon={<ShieldCheck size={14} />}
                  onClick={() => onInspect(user)}
                >
                  有效权限
                </Button>
                <Button
                  type="link"
                  icon={<Edit3 size={14} />}
                  onClick={() => onEdit(user)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger={user.status === 'enabled'}
                  onClick={() => onStatusChange(user)}
                >
                  {user.status === 'enabled' ? '停用' : '启用'}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}

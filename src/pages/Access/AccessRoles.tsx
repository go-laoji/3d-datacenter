import {
  Button,
  Card,
  Checkbox,
  Col,
  List,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AccessRole, AccessSnapshot } from '@/services/platform';
import { groupPermissions } from './accessModel';

interface AccessRolesProps {
  snapshot: AccessSnapshot;
  selectedRoleId?: string;
  onSave: (role: AccessRole) => Promise<void>;
}

export function AccessRoles({
  snapshot,
  selectedRoleId,
  onSave,
}: AccessRolesProps) {
  const [role, setRole] = useState<AccessRole>(snapshot.roles[0]);
  useEffect(() => {
    setRole(
      snapshot.roles.find((item) => item.id === selectedRoleId) ??
        snapshot.roles[0],
    );
  }, [selectedRoleId, snapshot.roles]);
  const groups = groupPermissions(snapshot.permissions);

  return (
    <Row gutter={16}>
      <Col xs={24} lg={7}>
        <List
          bordered
          dataSource={snapshot.roles}
          renderItem={(item) => (
            <List.Item style={{ padding: 0 }}>
              <button
                type="button"
                onClick={() => setRole(item)}
                aria-pressed={role.id === item.id}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 0,
                  background: role.id === item.id ? '#e6f4ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <strong style={{ display: 'block', color: '#1677ff' }}>
                  {item.name}
                </strong>
                <span style={{ color: '#64748b', fontSize: 13 }}>
                  {item.memberCount} 名成员 · {item.description}
                </span>
              </button>
            </List.Item>
          )}
        />
      </Col>
      <Col xs={24} lg={17}>
        <Card
          title={`配置角色 · ${role.name}`}
          extra={
            <Button
              type="primary"
              icon={<Save size={15} />}
              onClick={() => void onSave(role)}
              disabled={role.builtIn}
            >
              保存权限
            </Button>
          }
        >
          {role.builtIn && <Tag color="processing">内置角色只读</Tag>}
          {Object.entries(groups).map(([group, permissions]) => (
            <section key={group} style={{ marginTop: 16 }}>
              <Typography.Title level={5}>{group}</Typography.Title>
              <Checkbox.Group
                disabled={role.builtIn}
                value={role.permissionKeys}
                options={permissions.map((permission) => ({
                  label: permission.name,
                  value: permission.key,
                }))}
                onChange={(permissionKeys) =>
                  setRole({
                    ...role,
                    permissionKeys: permissionKeys as string[],
                  })
                }
              />
            </section>
          ))}
          <Typography.Title level={5} style={{ marginTop: 24 }}>
            数据中心范围
          </Typography.Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              mode="multiple"
              disabled={role.builtIn}
              value={role.datacenterIds}
              style={{ width: '100%' }}
              options={[
                { value: '*', label: '全部数据中心' },
                ...snapshot.datacenters.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
              onChange={(datacenterIds) => setRole({ ...role, datacenterIds })}
            />
            <Typography.Text type="secondary">
              页面可见、查询结果和操作对象都会受该范围约束。
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

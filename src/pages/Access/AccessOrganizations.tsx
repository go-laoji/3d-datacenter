import { Card, Col, Descriptions, Row, Tree, Typography } from 'antd';
import { Building2, Users } from 'lucide-react';
import type { AccessSnapshot } from '@/services/platform';

export function AccessOrganizations({
  snapshot,
}: {
  snapshot: AccessSnapshot;
}) {
  const roots = snapshot.organizations.filter((item) => !item.parentId);
  const treeData = roots.map((root) => ({
    key: root.id,
    title: `${root.name}（${root.memberCount}）`,
    children: snapshot.organizations
      .filter((item) => item.parentId === root.id)
      .map((item) => ({
        key: item.id,
        title: `${item.name}（${item.memberCount}）`,
      })),
  }));
  return (
    <Row gutter={16}>
      <Col xs={24} lg={10}>
        <Card title="组织结构" extra={<Building2 size={18} />}>
          <Tree defaultExpandAll treeData={treeData} />
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="权限继承说明" extra={<Users size={18} />}>
          <Typography.Paragraph>
            组织用于归属与责任路由；访问能力由角色授予，数据范围取用户所有角色范围的并集。
          </Typography.Paragraph>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="组织数量">
              {snapshot.organizations.length}
            </Descriptions.Item>
            <Descriptions.Item label="用户数量">
              {snapshot.users.length}
            </Descriptions.Item>
            <Descriptions.Item label="停用用户">
              {
                snapshot.users.filter((user) => user.status === 'disabled')
                  .length
              }
            </Descriptions.Item>
            <Descriptions.Item label="跨站点角色">
              {
                snapshot.roles.filter((role) =>
                  role.datacenterIds.includes('*'),
                ).length
              }
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  );
}

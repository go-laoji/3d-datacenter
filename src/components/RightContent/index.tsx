import { QuestionCircleOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Divider, Popover, Space, Tag, Typography } from 'antd';

export type SiderTheme = 'light' | 'dark';

export const Question: React.FC = () => {
  return (
    <Popover
      placement="bottomRight"
      trigger="click"
      title="产品帮助"
      content={
        <Space direction="vertical" size={4} style={{ width: 280 }}>
          <Space>
            <Tag color="blue">Mock 演示</Tag>
            <Typography.Text type="secondary">
              当前数据不会写入生产系统
            </Typography.Text>
          </Space>
          <Typography.Text>
            从资源树快速查找机房、机柜和设备；从告警中心进入处置流程。
          </Typography.Text>
          <Divider style={{ margin: '8px 0' }} />
          <Space>
            <Button size="small" onClick={() => history.push('/resource-tree')}>
              查找资源
            </Button>
            <Button size="small" onClick={() => history.push('/monitor/alert')}>
              查看告警
            </Button>
          </Space>
        </Space>
      }
    >
      <Button
        type="text"
        aria-label="打开产品帮助"
        icon={<QuestionCircleOutlined style={{ fontSize: 18 }} />}
      />
    </Popover>
  );
};

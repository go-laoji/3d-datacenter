import { QuestionCircleOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';

export type SiderTheme = 'light' | 'dark';

export const Question: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="text"
        aria-label="打开产品帮助"
        icon={<QuestionCircleOutlined style={{ fontSize: 18 }} />}
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="TDDC 产品帮助"
        open={open}
        onClose={() => setOpen(false)}
        width={440}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            showIcon
            type="info"
            message="前端 Mock 演示环境"
            description="所有配置只保存在本地开发进程内；刷新页面会保留会话，重启服务后恢复初始演示数据。"
          />
          <section>
            <Typography.Title level={5}>从常用任务开始</Typography.Title>
            <Space wrap>
              <Button
                onClick={() => {
                  history.push('/resource-tree');
                  setOpen(false);
                }}
              >
                全局查找资源
              </Button>
              <Button
                onClick={() => {
                  history.push('/monitor/alert');
                  setOpen(false);
                }}
              >
                处置当前告警
              </Button>
              <Button
                onClick={() => {
                  history.push('/operations/work-orders');
                  setOpen(false);
                }}
              >
                查看工单与变更
              </Button>
              <Button
                onClick={() => {
                  history.push('/system/data-health');
                  setOpen(false);
                }}
              >
                检查数据健康
              </Button>
            </Space>
          </section>
          <section>
            <Typography.Title level={5}>状态与错误说明</Typography.Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={<Tag color="success">正常</Tag>}>
                数据在预期时间内更新
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="warning">延迟</Tag>}>
                数据仍可查看，但可能不是最新状态
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="error">中断</Tag>}>
                需要重试采集源或联系管理员
              </Descriptions.Item>
              <Descriptions.Item label="Trace ID">
                请求失败时复制追踪号，便于后端仓库定位日志
              </Descriptions.Item>
            </Descriptions>
          </section>
          <Typography.Text type="secondary">
            复杂 3D 与布局编辑建议在桌面端使用；移动端聚焦告警、工单与资源查询。
          </Typography.Text>
        </Space>
      </Drawer>
    </>
  );
};

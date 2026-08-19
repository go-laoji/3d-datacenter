import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Skeleton, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { DataFreshness } from '@/components/operations';
import {
  getNotificationWorkspace,
  handoffOnCallShift,
  type NotificationChannel,
  type NotificationWorkspace,
  saveEscalationSteps,
  testNotificationChannel,
  updateNotificationChannel,
} from '@/services/platform';
import { ChannelsTab } from './ChannelsTab';
import { EscalationTab } from './EscalationTab';
import { OnCallTab } from './OnCallTab';

export default function NotificationsPage() {
  const { message } = App.useApp();
  const [workspace, setWorkspace] = useState<NotificationWorkspace>();
  const [testingId, setTestingId] = useState<string>();
  const refresh = async () => {
    const response = await getNotificationWorkspace();
    setWorkspace(response.data);
  };
  useEffect(() => {
    void refresh();
  }, []);
  if (!workspace)
    return (
      <PageContainer title="通知与值班">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );

  const testChannel = async (channel: NotificationChannel) => {
    setTestingId(channel.id);
    try {
      const response = await testNotificationChannel(channel.id);
      if (response.data.delivered) message.success(response.data.detail);
      else message.error(response.data.detail);
      await refresh();
    } finally {
      setTestingId(undefined);
    }
  };

  return (
    <PageContainer
      title="通知与值班"
      subTitle="验证渠道、明确当班责任，并让未响应告警自动升级"
      extra={
        <DataFreshness
          source="Mock 通知中心"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Card>
        <Tabs
          items={[
            {
              key: 'channels',
              label: '通知渠道',
              children: (
                <ChannelsTab
                  channels={workspace.channels}
                  testingId={testingId}
                  onTest={(channel) => void testChannel(channel)}
                  onToggle={(channel) =>
                    void updateNotificationChannel(
                      channel.id,
                      channel.status === 'enabled' ? 'disabled' : 'enabled',
                    ).then(async () => {
                      message.success('渠道状态已更新');
                      await refresh();
                    })
                  }
                />
              ),
            },
            {
              key: 'on-call',
              label: '值班表',
              children: (
                <OnCallTab
                  shifts={workspace.shifts}
                  responders={workspace.responders}
                  onHandoff={async (shiftId, primary) => {
                    await handoffOnCallShift(shiftId, primary);
                    message.success(`已将当前班次交接给 ${primary}`);
                    await refresh();
                  }}
                />
              ),
            },
            {
              key: 'escalation',
              label: '升级策略',
              children: (
                <EscalationTab
                  initialSteps={workspace.escalationSteps}
                  channels={workspace.channels}
                  onSave={async (steps) => {
                    await saveEscalationSteps(steps);
                    message.success('升级策略已保存');
                    await refresh();
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}

import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Skeleton, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { DataFreshness } from '@/components/operations';
import {
  getTaskWorkspace,
  type TaskWorkspace,
  transitionPlatformTask,
} from '@/services/platform';
import { ImportWizard } from './ImportWizard';
import { TaskCenter } from './TaskCenter';

export default function TasksPage() {
  const { message } = App.useApp();
  const [workspace, setWorkspace] = useState<TaskWorkspace>();
  const [activeTab, setActiveTab] = useState('tasks');
  const taskId = useMemo(
    () => new URLSearchParams(location.search).get('taskId') ?? undefined,
    [],
  );
  const refresh = async () => {
    const response = await getTaskWorkspace();
    setWorkspace(response.data);
  };
  useEffect(() => {
    void refresh();
  }, []);
  if (!workspace)
    return (
      <PageContainer title="导入与任务中心">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );

  return (
    <PageContainer
      title="导入与任务中心"
      subTitle="先预览差异，再异步执行；失败结果可下载并仅重试失败项"
      extra={
        <DataFreshness
          source="Mock 任务调度"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'tasks',
              label: `任务中心 ${workspace.tasks.length}`,
              children: (
                <TaskCenter
                  tasks={workspace.tasks}
                  selectedId={taskId}
                  onAction={async (task, action) => {
                    await transitionPlatformTask(task.id, action);
                    message.success(
                      action === 'retry'
                        ? '失败项已重新进入队列'
                        : '任务已取消',
                    );
                    await refresh();
                  }}
                />
              ),
            },
            {
              key: 'import',
              label: '批量导入',
              children: (
                <ImportWizard
                  supportedImports={workspace.supportedImports}
                  onApplied={async () => {
                    await refresh();
                    setActiveTab('tasks');
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

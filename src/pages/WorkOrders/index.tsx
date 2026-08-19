import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Skeleton, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { DataFreshness } from '@/components/operations';
import {
  type ChangePlan,
  createWorkOrder,
  getWorkOrderWorkspace,
  transitionChangePlan,
  transitionWorkOrder,
  type WorkOrder,
  type WorkOrderInput,
  type WorkOrderWorkspace,
} from '@/services/platform';
import { ChangesTab } from './ChangesTab';
import { CreateWorkOrderDrawer } from './CreateWorkOrderDrawer';
import { WorkOrderDrawer } from './WorkOrderDrawer';
import { WorkOrdersTab } from './WorkOrdersTab';

export default function WorkOrdersPage() {
  const { message } = App.useApp();
  const [workspace, setWorkspace] = useState<WorkOrderWorkspace>();
  const [selected, setSelected] = useState<WorkOrder>();
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const workOrderId = params.get('workOrderId') ?? undefined;
  const changeId = params.get('changeId') ?? undefined;
  const alertId = params.get('alertId') ?? undefined;
  const [creatorOpen, setCreatorOpen] = useState(Boolean(alertId));

  const refresh = async () => {
    const response = await getWorkOrderWorkspace();
    setWorkspace(response.data);
    const deepLinked = response.data.workOrders.find(
      (item) => item.id === workOrderId,
    );
    if (deepLinked) setSelected(deepLinked);
  };
  useEffect(() => {
    void refresh();
  }, []);
  if (!workspace)
    return (
      <PageContainer title="工单与变更">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );

  const submit = async (values: WorkOrderInput) => {
    const response = await createWorkOrder(values);
    message.success(`工单 ${response.data.id} 已创建`);
    setCreatorOpen(false);
    await refresh();
    setSelected(response.data);
    return true;
  };
  const updateChange = async (change: ChangePlan, action: string) => {
    await transitionChangePlan(change.id, action);
    message.success('变更状态与实施步骤已更新');
    await refresh();
  };

  return (
    <PageContainer
      title="工单与变更"
      subTitle="从告警发现到协同处置、风险审批与执行复盘"
      extra={
        <DataFreshness
          source="Mock 协作中心"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Card>
        <Tabs
          defaultActiveKey={changeId ? 'changes' : 'work-orders'}
          items={[
            {
              key: 'work-orders',
              label: `工单 ${workspace.workOrders.length}`,
              children: (
                <WorkOrdersTab
                  items={workspace.workOrders}
                  selectedId={workOrderId}
                  onCreate={() => setCreatorOpen(true)}
                  onSelect={setSelected}
                />
              ),
            },
            {
              key: 'changes',
              label: `变更计划 ${workspace.changes.length}`,
              children: (
                <ChangesTab
                  changes={workspace.changes}
                  selectedId={changeId}
                  onTransition={updateChange}
                />
              ),
            },
          ]}
        />
      </Card>
      <CreateWorkOrderDrawer
        open={creatorOpen}
        alertId={alertId}
        assignees={workspace.assignees}
        onOpenChange={setCreatorOpen}
        onSubmit={submit}
      />
      <WorkOrderDrawer
        workOrder={selected}
        onClose={() => setSelected(undefined)}
        onTransition={async (action) => {
          if (!selected) return;
          const response = await transitionWorkOrder(selected.id, action);
          message.success('工单状态已更新');
          await refresh();
          setSelected(response.data);
        }}
      />
    </PageContainer>
  );
}

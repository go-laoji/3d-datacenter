import {
  DrawerForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { WorkOrderInput } from '@/services/platform';

interface CreateWorkOrderDrawerProps {
  open: boolean;
  alertId?: string;
  assignees: string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WorkOrderInput) => Promise<boolean>;
}

export function CreateWorkOrderDrawer({
  open,
  alertId,
  assignees,
  onOpenChange,
  onSubmit,
}: CreateWorkOrderDrawerProps) {
  return (
    <DrawerForm<WorkOrderInput>
      title={alertId ? `从告警 ${alertId} 创建工单` : '新建工单'}
      width={520}
      open={open}
      onOpenChange={onOpenChange}
      drawerProps={{ destroyOnClose: true }}
      onFinish={(values) => onSubmit({ ...values, alertId })}
      initialValues={{
        category: alertId ? 'incident' : 'maintenance',
        priority: alertId ? 'P1' : 'P2',
      }}
    >
      <ProFormText
        name="title"
        label="工单标题"
        rules={[{ required: true }]}
        initialValue={alertId ? `处理告警 ${alertId}` : undefined}
      />
      <ProFormSelect
        name="category"
        label="类型"
        rules={[{ required: true }]}
        options={[
          { value: 'incident', label: '故障处置' },
          { value: 'inspection', label: '巡检' },
          { value: 'maintenance', label: '维护' },
        ]}
      />
      <ProFormSelect
        name="priority"
        label="优先级"
        rules={[{ required: true }]}
        options={['P1', 'P2', 'P3'].map((value) => ({ value, label: value }))}
      />
      <ProFormSelect
        name="assignee"
        label="负责人"
        rules={[{ required: true }]}
        options={assignees.map((value) => ({ value, label: value }))}
      />
    </DrawerForm>
  );
}

import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { AlertTransitionAction } from '@/services/idc/alert';

export interface AlertTransitionValues {
  assignee?: string;
  team?: string;
  notes?: string;
  maintenanceWindow?: string;
}

interface Props {
  alert?: IDC.AlertDetail;
  action?: AlertTransitionAction;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: AlertTransitionValues) => void;
}

const actionLabels: Record<AlertTransitionAction, string> = {
  acknowledge: '确认告警',
  start: '开始处理',
  recover: '标记恢复',
  close: '关闭告警',
  reopen: '重新打开',
  suppress: '维护抑制',
  false_positive: '标记误报',
  assign: '指派责任人',
};

export const AlertTransitionModal = ({
  alert,
  action,
  loading,
  onCancel,
  onSubmit,
}: Props) => {
  const [form] = Form.useForm<AlertTransitionValues>();
  useEffect(() => {
    if (alert && action)
      form.setFieldsValue({
        assignee: alert.assignee,
        team: alert.team,
        notes: undefined,
      });
  }, [action, alert, form]);
  return (
    <Modal
      open={Boolean(alert && action)}
      title={action ? actionLabels[action] : '告警操作'}
      okText="确认执行"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
    >
      <p>{alert?.message}</p>
      <Form form={form} layout="vertical">
        {(action === 'assign' || action === 'acknowledge') && (
          <>
            <Form.Item
              name="team"
              label="责任团队"
              rules={[{ required: true, message: '请选择责任团队' }]}
            >
              <Select
                options={[
                  '北京 NOC',
                  '上海 NOC',
                  '网络组',
                  '动力组',
                  '服务器组',
                ].map((value) => ({ label: value, value }))}
              />
            </Form.Item>
            <Form.Item
              name="assignee"
              label="责任人"
              rules={[{ required: true, message: '请选择责任人' }]}
            >
              <Select
                options={['张运维', '李运维', '王运维', '赵值班'].map(
                  (value) => ({ label: value, value }),
                )}
              />
            </Form.Item>
          </>
        )}
        {action === 'suppress' && (
          <Form.Item
            name="maintenanceWindow"
            label="维护窗口"
            rules={[{ required: true, message: '请输入维护窗口或变更单' }]}
          >
            <Input placeholder="例如：CHG-20260820-02 · 10:00-12:00" />
          </Form.Item>
        )}
        <Form.Item
          name="notes"
          label="操作说明"
          rules={[
            {
              required: ['close', 'reopen', 'false_positive'].includes(
                action || '',
              ),
              message: '请填写操作说明',
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="记录判断依据、处置动作或交接信息"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

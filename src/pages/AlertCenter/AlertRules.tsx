import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { ArrowLeft, Edit2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createAlertRule,
  deleteAlertRule,
  getAlertRules,
  toggleAlertRule,
  updateAlertRule,
} from '@/services/idc/alert';
import styles from './index.less';

const { Option } = Select;

// 告警类型配置
const typeOptions = [
  { value: 'temperature', label: '温度告警' },
  { value: 'humidity', label: '湿度告警' },
  { value: 'power', label: '功率告警' },
  { value: 'device_status', label: '设备状态' },
  { value: 'port_status', label: '端口状态' },
  { value: 'capacity', label: '容量预警' },
];

// 告警级别配置
const severityOptions = [
  { value: 'critical', label: '紧急', color: 'error' },
  { value: 'error', label: '错误', color: 'volcano' },
  { value: 'warning', label: '警告', color: 'warning' },
  { value: 'info', label: '提示', color: 'processing' },
];

// 操作符配置
const operatorOptions = [
  { value: '>', label: '大于 (>)' },
  { value: '<', label: '小于 (<)' },
  { value: '>=', label: '大于等于 (>=)' },
  { value: '<=', label: '小于等于 (<=)' },
  { value: '==', label: '等于 (==)' },
  { value: '!=', label: '不等于 (!=)' },
];

const AlertRules: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<IDC.AlertRule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<IDC.AlertRule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await getAlertRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({
      enabled: true,
      severity: 'warning',
      condition: {
        operator: '>',
      },
      notification: {
        email: true,
      },
    });
    setModalVisible(true);
  };

  const handleEdit = (rule: IDC.AlertRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      type: rule.type,
      enabled: rule.enabled,
      severity: rule.severity,
      condition: rule.condition,
      notification: rule.notification,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAlertRule(id);
      if (res.success) {
        message.success('规则已删除');
        fetchRules();
      }
    } catch (_error) {
      message.error('删除失败');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleAlertRule(id);
      if (res.success) {
        message.success('状态已更新');
        fetchRules();
      }
    } catch (_error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: IDC.AlertRuleCreateParams = {
        name: values.name,
        type: values.type,
        enabled: values.enabled,
        severity: values.severity,
        condition: {
          metric: values.condition.metric || values.type,
          operator: values.condition.operator,
          threshold: values.condition.threshold,
          duration: values.condition.duration,
        },
        notification: values.notification || {},
      };

      let res: IDC.ApiResponse<IDC.AlertRule>;
      if (editingRule) {
        res = await updateAlertRule(editingRule.id, data);
      } else {
        res = await createAlertRule(data);
      }

      if (res.success) {
        message.success(editingRule ? '规则已更新' : '规则已创建');
        setModalVisible(false);
        fetchRules();
      }
    } catch (_error) {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const option = typeOptions.find((t) => t.value === type);
        return <Tag>{option?.label || type}</Tag>;
      },
    },
    {
      title: '条件',
      key: 'condition',
      render: (_: any, record: IDC.AlertRule) => {
        const { condition } = record;
        return (
          <span>
            {condition.metric} {condition.operator} {condition.threshold}
            {condition.duration && ` (持续 ${condition.duration}秒)`}
          </span>
        );
      },
    },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const option = severityOptions.find((s) => s.value === severity);
        return <Tag color={option?.color}>{option?.label || severity}</Tag>;
      },
    },
    {
      title: '通知',
      key: 'notification',
      render: (_: any, record: IDC.AlertRule) => {
        const { notification } = record;
        const items = [];
        if (notification.email) items.push('邮件');
        if (notification.sms) items.push('短信');
        if (notification.webhook) items.push('Webhook');
        return items.length > 0 ? items.join(', ') : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: IDC.AlertRule) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggle(record.id)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: IDC.AlertRule) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<Edit2 size={14} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该规则？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<Trash2 size={14} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.alertCenterPage}
      header={{
        title: '告警规则配置',
        breadcrumb: {},
      }}
      extra={[
        <Button
          key="back"
          icon={<ArrowLeft size={14} />}
          onClick={() => history.push('/monitor/alert')}
        >
          返回告警中心
        </Button>,
        <Button
          key="add"
          type="primary"
          icon={<Plus size={14} />}
          onClick={handleAdd}
        >
          新建规则
        </Button>,
      ]}
    >
      <Card className={styles.ruleCard}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新建/编辑规则弹窗 */}
      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="如：高温告警" />
          </Form.Item>

          <Form.Item
            name="type"
            label="告警类型"
            rules={[{ required: true, message: '请选择告警类型' }]}
          >
            <Select placeholder="选择类型">
              {typeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="触发条件" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={['condition', 'metric']} noStyle>
                <Input
                  style={{ width: '35%' }}
                  placeholder="指标名 (如 temperature)"
                />
              </Form.Item>
              <Form.Item
                name={['condition', 'operator']}
                noStyle
                rules={[{ required: true }]}
              >
                <Select style={{ width: '25%' }}>
                  {operatorOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name={['condition', 'threshold']}
                noStyle
                rules={[{ required: true, message: '请输入阈值' }]}
              >
                <InputNumber style={{ width: '40%' }} placeholder="阈值" />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item name={['condition', 'duration']} label="持续时间 (秒)">
            <InputNumber
              min={0}
              placeholder="持续多少秒后触发 (可选)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="severity"
            label="告警级别"
            rules={[{ required: true, message: '请选择告警级别' }]}
          >
            <Select placeholder="选择级别">
              {severityOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="通知方式">
            <Space>
              <Form.Item
                name={['notification', 'email']}
                valuePropName="checked"
                noStyle
              >
                <Switch checkedChildren="邮件" unCheckedChildren="邮件" />
              </Form.Item>
              <Form.Item
                name={['notification', 'sms']}
                valuePropName="checked"
                noStyle
              >
                <Switch checkedChildren="短信" unCheckedChildren="短信" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name={['notification', 'webhook']} label="Webhook URL">
            <Input placeholder="http://your-webhook-url (可选)" />
          </Form.Item>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AlertRules;

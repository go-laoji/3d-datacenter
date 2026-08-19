import {
  Alert,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { ArrowDown, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EscalationStep, NotificationChannel } from '@/services/platform';
import { validateEscalationSteps } from './notificationModel';

interface EscalationTabProps {
  initialSteps: EscalationStep[];
  channels: NotificationChannel[];
  onSave: (steps: EscalationStep[]) => Promise<void>;
}

export function EscalationTab({
  initialSteps,
  channels,
  onSave,
}: EscalationTabProps) {
  const [steps, setSteps] = useState(initialSteps);
  useEffect(() => setSteps(initialSteps), [initialSteps]);
  const validation = validateEscalationSteps(steps);
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Alert
        showIcon
        type="info"
        message="升级只针对未确认的高优先级告警；告警一旦确认，后续通知自动停止。"
      />
      {steps.map((step, index) => (
        <div key={step.id}>
          <Card
            size="small"
            title={`第 ${index + 1} 级 · ${step.delayMinutes === 0 ? '立即' : `${step.delayMinutes} 分钟后`}`}
          >
            <Space wrap>
              <Typography.Text>等待</Typography.Text>
              <InputNumber
                min={0}
                value={step.delayMinutes}
                aria-label={`第${index + 1}级等待分钟`}
                onChange={(value) =>
                  setSteps(
                    steps.map((item) =>
                      item.id === step.id
                        ? { ...item, delayMinutes: Number(value ?? 0) }
                        : item,
                    ),
                  )
                }
              />
              <Typography.Text>分钟，通知</Typography.Text>
              <Select
                value={step.target}
                style={{ width: 140 }}
                options={['当班主值', '当班备值', '运维主管'].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(target) =>
                  setSteps(
                    steps.map((item) =>
                      item.id === step.id ? { ...item, target } : item,
                    ),
                  )
                }
              />
              <Select
                mode="multiple"
                value={step.channelIds}
                style={{ minWidth: 260 }}
                options={channels.map((channel) => ({
                  value: channel.id,
                  label: channel.name,
                }))}
                onChange={(channelIds) =>
                  setSteps(
                    steps.map((item) =>
                      item.id === step.id ? { ...item, channelIds } : item,
                    ),
                  )
                }
              />
              {step.channelIds.map((id) => (
                <Tag key={id}>
                  {channels.find((channel) => channel.id === id)?.type}
                </Tag>
              ))}
            </Space>
          </Card>
          {index < steps.length - 1 && (
            <div style={{ textAlign: 'center', padding: 6 }}>
              <ArrowDown size={18} aria-hidden />
            </div>
          )}
        </div>
      ))}
      {validation && <Alert type="warning" showIcon message={validation} />}
      <Button
        type="primary"
        icon={<Save size={15} />}
        disabled={Boolean(validation)}
        onClick={() => void onSave(steps)}
      >
        保存升级策略
      </Button>
    </Space>
  );
}

import type { ButtonProps } from 'antd';
import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { useId, useState } from 'react';

interface DangerActionProps {
  children: string;
  title: string;
  impact: string;
  affectedCount?: number;
  confirmPhrase?: string;
  onConfirm: () => Promise<void> | void;
  buttonProps?: Omit<ButtonProps, 'danger' | 'onClick'>;
}

export function DangerAction({
  children,
  title,
  impact,
  affectedCount,
  confirmPhrase,
  onConfirm,
  buttonProps,
}: DangerActionProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canConfirm = !confirmPhrase || input === confirmPhrase;

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      setOpen(false);
      setInput('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button {...buttonProps} danger onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        title={title}
        open={open}
        okText="确认执行"
        cancelText="取消"
        okButtonProps={{
          danger: true,
          disabled: !canConfirm,
          loading: submitting,
        }}
        onOk={() => void confirm()}
        onCancel={() => {
          setOpen(false);
          setInput('');
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message={
              affectedCount === undefined
                ? '请确认影响范围'
                : `将影响 ${affectedCount} 个对象`
            }
            description={impact}
          />
          {confirmPhrase && (
            <label htmlFor={inputId}>
              <Typography.Text>
                输入 <Typography.Text code>{confirmPhrase}</Typography.Text>{' '}
                以确认
              </Typography.Text>
              <Input
                id={inputId}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={confirmPhrase}
                autoComplete="off"
              />
            </label>
          )}
        </Space>
      </Modal>
    </>
  );
}

import { App } from 'antd';
import { useEffect } from 'react';
import { bindGlobalFeedback } from '@/utils/feedback';

export function GlobalFeedbackBridge() {
  const { message, notification } = App.useApp();
  useEffect(
    () => bindGlobalFeedback(message, notification),
    [message, notification],
  );
  return null;
}

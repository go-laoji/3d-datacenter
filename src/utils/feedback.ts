type MessageLevel = 'success' | 'info' | 'warning' | 'error';

interface MessageApi {
  open: (config: { type: MessageLevel; content: string }) => unknown;
}

interface NotificationApi {
  error: (config: { message: string; description: string }) => unknown;
}

let messageApi: MessageApi | undefined;
let notificationApi: NotificationApi | undefined;

export function bindGlobalFeedback(
  nextMessageApi: MessageApi,
  nextNotificationApi: NotificationApi,
) {
  messageApi = nextMessageApi;
  notificationApi = nextNotificationApi;
  return () => {
    messageApi = undefined;
    notificationApi = undefined;
  };
}

export function showGlobalMessage(level: MessageLevel, content: string) {
  messageApi?.open({ type: level, content });
}

export function showGlobalError(title: string, description: string) {
  notificationApi?.error({ message: title, description });
}

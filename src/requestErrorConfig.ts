import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message, notification } from 'antd';
import {
  clearSession,
  ensureValidSession,
  getAccessToken,
} from '@/utils/session';

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  success: boolean;
  data?: unknown;
  errorCode?: number | string;
  errorMessage?: string;
  showType?: ErrorShowType;
  traceId?: string;
}

const loginPath = '/user/login';

function redirectToLogin(): void {
  const currentPath = history.location.pathname + history.location.search;
  if (history.location.pathname === loginPath) return;
  history.replace(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`);
}

function getTraceId(error: any): string | undefined {
  return (
    error?.info?.traceId ||
    error?.response?.data?.traceId ||
    error?.response?.headers?.['x-request-id']
  );
}

function withTrace(messageText: string, traceId?: string): string {
  return traceId ? `${messageText}（追踪 ID：${traceId}）` : messageText;
}

function handleBusinessError(errorInfo: ResponseStructure): void {
  const {
    errorMessage = '请求未能完成',
    errorCode,
    showType,
    traceId,
  } = errorInfo;
  const readableMessage = withTrace(errorMessage, traceId);

  switch (showType) {
    case ErrorShowType.SILENT:
      return;
    case ErrorShowType.WARN_MESSAGE:
      message.warning(readableMessage);
      return;
    case ErrorShowType.NOTIFICATION:
      notification.error({
        message: errorCode ? String(errorCode) : '操作失败',
        description: readableMessage,
      });
      return;
    case ErrorShowType.REDIRECT:
      clearSession();
      redirectToLogin();
      return;
    default:
      message.error(readableMessage);
  }
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (response) => {
      const result = response as unknown as ResponseStructure;
      if (!result.success) {
        throw Object.assign(new Error(result.errorMessage || '请求未能完成'), {
          name: 'BizError',
          info: result,
        });
      }
    },
    errorHandler: (error: any, options: any) => {
      if (options?.skipErrorHandler) throw error;
      if (error.name === 'BizError' && error.info) {
        handleBusinessError(error.info as ResponseStructure);
        return;
      }

      if (error.response) {
        const status = error.response.status;
        const traceId = getTraceId(error);
        if (status === 401) {
          clearSession();
          redirectToLogin();
          return;
        }
        if (status === 403) {
          notification.error({
            message: '无权限访问',
            description: withTrace(
              '你没有访问该资源的权限，请联系管理员。',
              traceId,
            ),
          });
          history.push('/403');
          return;
        }
        if (status >= 500) {
          notification.error({
            message: '服务异常',
            description: withTrace(
              `服务暂时不可用（HTTP ${status}），请稍后重试。`,
              traceId,
            ),
          });
          return;
        }
        message.error(withTrace(`请求失败（HTTP ${status}）`, traceId));
        return;
      }

      if (error.request) {
        notification.error({
          message: '网络连接异常',
          description: '未收到服务响应，请检查网络后重试读取操作。',
        });
        return;
      }
      message.error('请求未能发送，请检查输入或稍后重试');
    },
  },

  requestInterceptors: [
    async (config: RequestOptions) => {
      await ensureValidSession();
      const token = getAccessToken();
      const headers = config?.headers || {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return { ...config, headers };
    },
  ],
};

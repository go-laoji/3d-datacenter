import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './index';

const mocks = vi.hoisted(() => ({
  fetchUserInfo: vi.fn(),
  login: vi.fn(),
  replace: vi.fn(),
  setInitialState: vi.fn(),
  setSession: vi.fn(),
}));

vi.mock('@umijs/max', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
  Helmet: () => null,
  history: { replace: mocks.replace },
  useIntl: () => ({
    formatMessage: ({
      defaultMessage,
      id,
    }: {
      defaultMessage?: string;
      id: string;
    }) => defaultMessage || id,
  }),
  useModel: () => ({
    initialState: { fetchUserInfo: mocks.fetchUserInfo },
    setInitialState: mocks.setInitialState,
  }),
}));

vi.mock('@/components', () => ({ Footer: () => null }));
vi.mock('@/services/ant-design-pro/api', () => ({ login: mocks.login }));
vi.mock('@/utils/session', () => ({ setSession: mocks.setSession }));

const renderLogin = () =>
  render(
    <AntdApp>
      <Login />
    </AntdApp>,
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/user/login');
    mocks.fetchUserInfo.mockResolvedValue({
      name: 'Mock administrator',
      userid: 'admin',
    });
  });

  it('shows a focused Mock identity form without exposing demo credentials', () => {
    renderLogin();

    expect(screen.getByText('TDDC 数字孪生机房')).toBeInTheDocument();
    expect(
      screen.getByText('空间、资产、网络、动环与告警统一运维'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.queryByText(/admin\/ant\.design/i)).not.toBeInTheDocument();
    expect(screen.queryByText('忘记密码')).not.toBeInTheDocument();
  });

  it('stores the complete session and rejects an external redirect target', async () => {
    window.history.replaceState(
      {},
      '',
      '/user/login?redirect=https%3A%2F%2Fevil.example',
    );
    mocks.login.mockResolvedValue({
      status: 'ok',
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 2_000_000_000_000,
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('请输入用户名'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          password: 'password',
          type: 'account',
        }),
      );
      expect(mocks.setSession).toHaveBeenCalledWith({
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: 2_000_000_000_000,
      });
      expect(mocks.replace).toHaveBeenCalledWith('/dashboard');
    });
  });
});

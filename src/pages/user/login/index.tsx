import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  history,
  useIntl,
  useModel,
} from '@umijs/max';
import { Alert, App } from 'antd';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { login } from '@/services/ant-design-pro/api';
import { setSession } from '@/utils/session';
import Settings from '../../../../config/defaultSettings';
import { useLoginStyles } from './styles';

const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
);

function getSafeRedirect(): string {
  const redirect = new URL(window.location.href).searchParams.get('redirect');
  if (redirect?.startsWith('/') && !redirect.startsWith('//')) return redirect;
  return '/dashboard';
}

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useLoginStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (!userInfo) return false;
    flushSync(() => {
      setInitialState((state) => ({ ...state, currentUser: userInfo }));
    });
    return true;
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const result = await login({ ...values, type: 'account' });
      if (
        result.status === 'ok' &&
        result.token &&
        result.refreshToken &&
        result.expiresAt
      ) {
        setSession({
          token: result.token,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
        });
        const hasUser = await fetchUserInfo();
        if (!hasUser) {
          message.error('登录状态已建立，但用户信息加载失败，请重试');
          return;
        }
        message.success('登录成功');
        history.replace(getSafeRedirect());
        return;
      }
      setUserLoginState(result);
    } catch (_error) {
      message.error('登录请求失败，请检查网络后重试');
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - {Settings.title}</title>
      </Helmet>
      <main className={styles.content}>
        <section className={styles.panel} aria-label="登录 TDDC">
          <LoginForm
            contentStyle={{ minWidth: 280, maxWidth: '100%' }}
            logo={<img alt="TDDC" src="/logo.svg" />}
            title="TDDC 数字孪生机房"
            subTitle="空间、资产、网络、动环与告警统一运维"
            initialValues={{ autoLogin: true }}
            onFinish={handleSubmit}
          >
            <Alert
              className={styles.identityHint}
              type="info"
              showIcon
              message="身份认证"
              description="当前为前端 Mock 演示环境；产品支持为企业 SSO、LDAP 或 OIDC 预留接入位置。"
            />
            {userLoginState.status === 'error' && (
              <LoginMessage content="账号或密码不正确，请重新输入" />
            )}
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
              placeholder="请输入用户名"
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.login.username.required"
                      defaultMessage="请输入用户名"
                    />
                  ),
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="请输入密码"
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.login.password.required"
                      defaultMessage="请输入密码"
                    />
                  ),
                },
              ]}
            />
            <ProFormCheckbox noStyle name="autoLogin">
              {intl.formatMessage({
                id: 'pages.login.rememberMe',
                defaultMessage: '保持登录',
              })}
            </ProFormCheckbox>
          </LoginForm>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Login;

import {
  AlertOutlined,
  ApiOutlined,
  BankOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type {
  Settings as LayoutSettings,
  MenuDataItem,
} from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { AvatarDropdown, AvatarName, Footer, Question } from '@/components';
import { GlobalFeedbackBridge } from '@/components/GlobalFeedbackBridge';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const loginPath = '/user/login';

function buildProductMenu(isAdmin: boolean): MenuDataItem[] {
  const items: MenuDataItem[] = [
    {
      path: '/dashboard',
      name: '工作台',
      icon: <DashboardOutlined />,
    },
    {
      path: '/space-assets',
      name: '空间与资产',
      icon: <BankOutlined />,
      children: [
        { path: '/resource-tree', name: '资源导航' },
        { path: '/idc/datacenter', name: '数据中心' },
        { path: '/idc/cabinet', name: '机柜' },
        { path: '/idc/device', name: '设备' },
        { path: '/idc/template', name: '设备模板' },
      ],
    },
    {
      path: '/network-workspace',
      name: '网络与连接',
      icon: <ApiOutlined />,
      children: [
        { path: '/network/connection', name: '物理连接' },
        { path: '/network/port', name: '端口配置' },
        { path: '/network/topology', name: '网络拓扑' },
      ],
    },
    {
      path: '/power-environment',
      name: '动力与环境',
      icon: <ThunderboltOutlined />,
      children: [
        { path: '/idc/pdu', name: 'PDU 与回路' },
        { path: '/power', name: '电力拓扑' },
        { path: '/monitor/environment', name: '环境监控' },
      ],
    },
    {
      path: '/event-work',
      name: '事件与工单',
      icon: <AlertOutlined />,
      children: [
        { path: '/monitor/alert', name: '告警中心' },
        { path: '/operations/work-orders', name: '工单与变更' },
        { path: '/operations/notifications', name: '通知与值班' },
      ],
    },
    {
      path: '/digital-twin',
      name: '数字孪生',
      icon: <DeploymentUnitOutlined />,
      children: [
        { path: '/datacenter3d', name: '数据中心 3D' },
        ...(isAdmin ? [{ path: '/layout', name: '布局编辑器' }] : []),
      ],
    },
  ];
  if (isAdmin) {
    items.push(
      {
        path: '/reports',
        name: '运营报表',
        icon: <BarChartOutlined />,
      },
      {
        path: '/system-governance',
        name: '系统管理',
        icon: <SettingOutlined />,
        children: [
          { path: '/system/access', name: '用户与权限' },
          { path: '/system/audit', name: '操作审计' },
          { path: '/system/tasks', name: '导入与任务' },
          { path: '/system/data-health', name: '数据与系统健康' },
        ],
      },
    );
  }
  return items;
}

function redirectToLogin(): void {
  if (history.location.pathname === loginPath) return;
  const target = `${history.location.pathname}${history.location.search}`;
  history.replace(`${loginPath}?redirect=${encodeURIComponent(target)}`);
}

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      redirectToLogin();
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    actionsRender: () => [<Question key="help" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    childrenRender: (children) => (
      <>
        <GlobalFeedbackBridge />
        {children}
      </>
    ),
    menuDataRender: () =>
      buildProductMenu(initialState?.currentUser?.access === 'admin'),
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        redirectToLogin();
      }
    },
    menuHeaderRender: undefined,
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: '',
  ...errorConfig,
};

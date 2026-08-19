import { history } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  BellRing,
  ClipboardList,
  Search,
  UserRoundCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { EntityStatus } from '@/components/operations';
import { getAlerts, transitionAlert } from '@/services/idc/alert';
import { getWorkOrderWorkspace, type WorkOrder } from '@/services/platform';
import styles from './index.less';
import { getMobileWorkQueue, sortMobileAlerts } from './mobileOpsModel';

export default function MobileOpsPage() {
  const { message } = App.useApp();
  const [alerts, setAlerts] = useState<IDC.AlertDetail[]>();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>();
  const [assetQuery, setAssetQuery] = useState('');

  const refresh = async () => {
    const [alertResponse, workResponse] = await Promise.all([
      getAlerts({ current: 1, pageSize: 20 }),
      getWorkOrderWorkspace(),
    ]);
    setAlerts(sortMobileAlerts(alertResponse.data ?? []));
    setWorkOrders(getMobileWorkQueue(workResponse.data.workOrders));
  };
  useEffect(() => {
    void refresh();
  }, []);

  if (!alerts || !workOrders) {
    return (
      <main className={styles.page}>
        <Skeleton active />
      </main>
    );
  }
  const urgentCount = alerts.filter(
    (item) => ['critical', 'error'].includes(item.level) && !item.acknowledged,
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="TDDC" />
          <div>
            <strong>移动值班台</strong>
            <span>当前主值 · 张运维</span>
          </div>
        </div>
        <Tag color="success" icon={<UserRoundCheck size={13} />}>
          已接班
        </Tag>
      </header>
      <Input.Search
        size="large"
        aria-label="移动端搜索资产"
        placeholder="搜索资产、IP 或编码"
        value={assetQuery}
        onChange={(event) => setAssetQuery(event.target.value)}
        onSearch={(value) =>
          history.push(`/resource-tree?q=${encodeURIComponent(value)}`)
        }
        style={{ marginBottom: 14 }}
      />
      <section className={styles.summaryGrid} aria-label="移动值班摘要">
        <div className={styles.summary}>
          <strong>{urgentCount}</strong>
          <span>紧急告警</span>
        </div>
        <div className={styles.summary}>
          <strong>{workOrders.length}</strong>
          <span>处理中工单</span>
        </div>
        <div className={styles.summary}>
          <strong>42m</strong>
          <span>最近 SLA</span>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            当前告警
          </Typography.Title>
          <Button type="link" onClick={() => history.push('/monitor/alert')}>
            全部
          </Button>
        </div>
        {alerts.slice(0, 5).map((alert) => (
          <Card key={alert.id} size="small" className={styles.alertCard}>
            <div className={styles.cardHeader}>
              <Space align="start">
                <AlertTriangle
                  size={18}
                  color={alert.level === 'critical' ? '#cf1322' : '#d46b08'}
                />
                <div>
                  <strong>{alert.message}</strong>
                  <div className={styles.cardMeta}>
                    {alert.deviceName ?? alert.cabinetName ?? '系统事件'} ·{' '}
                    {dayjs(alert.createdAt).format('HH:mm')}
                  </div>
                </div>
              </Space>
              <Tag
                color={
                  alert.level === 'critical'
                    ? 'error'
                    : alert.level === 'error'
                      ? 'volcano'
                      : 'warning'
                }
              >
                {alert.priority ?? alert.level}
              </Tag>
            </div>
            <Space style={{ marginTop: 10 }}>
              <Button
                size="small"
                onClick={() =>
                  history.push(`/monitor/alert?alertId=${alert.id}`)
                }
              >
                查看详情
              </Button>
              {!alert.acknowledged && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() =>
                    void transitionAlert(alert.id, {
                      action: 'acknowledge',
                      notes: '移动值班台确认',
                    }).then(async () => {
                      message.success('告警已确认');
                      await refresh();
                    })
                  }
                >
                  确认接手
                </Button>
              )}
            </Space>
          </Card>
        ))}
        {!alerts.length && <Empty description="当前没有待处置告警" />}
      </section>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            我的工单
          </Typography.Title>
          <Button
            type="link"
            onClick={() => history.push('/operations/work-orders')}
          >
            全部
          </Button>
        </div>
        {workOrders.slice(0, 4).map((item) => (
          <Card
            key={item.id}
            size="small"
            className={styles.workCard}
            onClick={() =>
              history.push(`/operations/work-orders?workOrderId=${item.id}`)
            }
            hoverable
          >
            <div className={styles.cardHeader}>
              <div>
                <strong>{item.title}</strong>
                <div className={styles.cardMeta}>
                  {item.assignee} · SLA {dayjs(item.slaDueAt).format('HH:mm')}
                </div>
              </div>
              <EntityStatus status={item.status} />
            </div>
          </Card>
        ))}
      </section>
      <nav className={styles.bottomNav} aria-label="移动值班导航">
        <Button
          type="text"
          icon={<BellRing size={18} />}
          onClick={() => history.push('/monitor/alert')}
        >
          告警
        </Button>
        <Button
          type="text"
          icon={<ClipboardList size={18} />}
          onClick={() => history.push('/operations/work-orders')}
        >
          工单
        </Button>
        <Button
          type="text"
          icon={<Search size={18} />}
          onClick={() => history.push('/resource-tree')}
        >
          资源
        </Button>
      </nav>
    </main>
  );
}

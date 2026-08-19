import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, Button, message } from 'antd';
import { History, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type AlertTransitionAction,
  batchAcknowledgeAlerts,
  batchResolveAlerts,
  createAlertWorkOrder,
  getAlertStats,
  getAlerts,
  transitionAlert,
} from '@/services/idc/alert';
import AlertDetailDrawer from './AlertDetailDrawer';
import { getAlertActionableIds } from './alertPresentation';
import { AlertMetricStrip } from './components/AlertMetricStrip';
import { AlertOperationsTable } from './components/AlertOperationsTable';
import {
  AlertTransitionModal,
  type AlertTransitionValues,
} from './components/AlertTransitionModal';
import styles from './index.less';

const AlertCenter = () => {
  const [searchParams] = useSearchParams();
  const datacenterId = searchParams.get('datacenterId') || undefined;
  const requestedAlertId = searchParams.get('alertId') || undefined;
  const [alerts, setAlerts] = useState<IDC.AlertDetail[]>([]);
  const [stats, setStats] = useState<IDC.AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [level, setLevel] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [type, setType] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailAlert, setDetailAlert] = useState<IDC.AlertDetail>();
  const [transitionTarget, setTransitionTarget] = useState<{
    alert: IDC.AlertDetail;
    action: AlertTransitionAction;
  }>();
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [listResult, statsResult] = await Promise.all([
          getAlerts({
            current,
            pageSize,
            level: level as IDC.Alert['level'] | undefined,
            type,
            datacenterId,
            workflowStatus: status as IDC.AlertDetail['workflowStatus'],
          }),
          getAlertStats(),
        ]);
        setAlerts(listResult.data || []);
        setTotal(listResult.total || 0);
        setStats(statsResult.data || null);
        if (requestedAlertId) {
          const requested = listResult.data?.find(
            (item) => item.id === requestedAlertId,
          );
          if (requested) setDetailAlert(requested);
        }
      } catch (_error) {
        if (!silent) message.error('告警队列加载失败');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [current, datacenterId, level, pageSize, requestedAlertId, status, type],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const updateAlertUrl = (alertId?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (alertId) params.set('alertId', alertId);
    else params.delete('alertId');
    history.replace(`/monitor/alert?${params.toString()}`);
  };

  const openDetail = (alert: IDC.AlertDetail) => {
    setDetailAlert(alert);
    updateAlertUrl(alert.id);
  };

  const submitTransition = async (values: AlertTransitionValues) => {
    if (!transitionTarget) return;
    setSubmitting(true);
    try {
      const response = await transitionAlert(transitionTarget.alert.id, {
        action: transitionTarget.action,
        ...values,
      });
      if (!response.success || !response.data)
        throw new Error(response.errorMessage);
      message.success('告警状态已更新');
      setDetailAlert((currentAlert) =>
        currentAlert?.id === response.data?.id ? response.data : currentAlert,
      );
      setTransitionTarget(undefined);
      await load(true);
    } catch (error) {
      message.error(
        error instanceof Error && error.message ? error.message : '操作失败',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatch = async (action: 'acknowledge' | 'close') => {
    const actionable = getAlertActionableIds(alerts, selectedIds);
    const ids =
      action === 'acknowledge'
        ? actionable.acknowledgeableIds
        : actionable.resolvableIds;
    if (!ids.length) {
      message.warning(
        action === 'acknowledge' ? '所选告警无需确认' : '所选告警当前不能关闭',
      );
      return;
    }
    const response =
      action === 'acknowledge'
        ? await batchAcknowledgeAlerts(ids)
        : await batchResolveAlerts(ids);
    if (response.success && response.data) {
      message.success(
        `成功处理 ${response.data.succeededIds.length} 条，失败 ${response.data.failed.length} 条`,
      );
      setSelectedIds([]);
      await load(true);
    }
  };

  const handleCreateWorkOrder = async (alert: IDC.AlertDetail) => {
    const response = await createAlertWorkOrder(alert.id);
    if (response.success && response.data) {
      message.success(`已创建工单 ${response.data.workOrderId}`);
      await load(true);
      setDetailAlert((currentAlert) =>
        currentAlert
          ? { ...currentAlert, workOrderId: response.data?.workOrderId }
          : currentAlert,
      );
    }
  };

  return (
    <PageContainer
      className={styles.alertCenterPage}
      extra={[
        <Button
          key="rules"
          icon={<Settings size={14} />}
          onClick={() => history.push('/monitor/alert/rules')}
        >
          告警规则
        </Button>,
        <Button
          key="history"
          icon={<History size={14} />}
          onClick={() => history.push('/monitor/alert/history')}
        >
          历史记录
        </Button>,
      ]}
    >
      <Alert
        className={styles.workflowNotice}
        type="info"
        showIcon
        message="统一告警状态机"
        description="新告警 → 已确认 → 处理中 → 已恢复 → 已关闭；支持重开、误报、维护抑制、责任指派、SLA 升级和通知投递追踪。"
        action={
          datacenterId ? (
            <Button size="small" onClick={() => history.push('/monitor/alert')}>
              清除站点筛选
            </Button>
          ) : undefined
        }
      />
      <AlertMetricStrip
        stats={stats}
        onFilter={(value) => {
          setCurrent(1);
          setStatus(value);
        }}
      />
      <AlertOperationsTable
        alerts={alerts}
        loading={loading}
        total={total}
        current={current}
        pageSize={pageSize}
        level={level}
        status={status}
        type={type}
        selectedIds={selectedIds}
        onFilterChange={(key, value) => {
          setCurrent(1);
          setSelectedIds([]);
          if (key === 'level') setLevel(value);
          if (key === 'status') setStatus(value);
          if (key === 'type') setType(value);
        }}
        onPageChange={(page, size) => {
          setCurrent(page);
          setPageSize(size);
          setSelectedIds([]);
        }}
        onSelectionChange={setSelectedIds}
        onOpen={openDetail}
        onTransition={(alert, action) => setTransitionTarget({ alert, action })}
        onBatchAcknowledge={() => void handleBatch('acknowledge')}
        onBatchClose={() => void handleBatch('close')}
      />
      <AlertDetailDrawer
        alert={detailAlert}
        onClose={() => {
          setDetailAlert(undefined);
          updateAlertUrl();
        }}
        onTransition={(alert, action) => setTransitionTarget({ alert, action })}
        onCreateWorkOrder={(alert) => void handleCreateWorkOrder(alert)}
      />
      <AlertTransitionModal
        alert={transitionTarget?.alert}
        action={transitionTarget?.action}
        loading={submitting}
        onCancel={() => setTransitionTarget(undefined)}
        onSubmit={(values) => void submitTransition(values)}
      />
    </PageContainer>
  );
};

export default AlertCenter;

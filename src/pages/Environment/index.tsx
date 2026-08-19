import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, message, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  type CabinetEnvironmentView,
  type EnvironmentOverview,
  type EnvironmentQuery,
  type EnvironmentSensorView,
  type EnvironmentThresholds,
  getCabinetEnvironments,
  getCabinetSensors,
  getEnvironmentOverview,
  getEnvironmentThresholds,
  getPueTrend,
  getTemperatureTrend,
  type PuePoint,
  type TemperaturePoint,
} from '@/services/idc/environment';
import { EnvironmentCabinetTable } from './components/EnvironmentCabinetTable';
import { EnvironmentDetailDrawer } from './components/EnvironmentDetailDrawer';
import { EnvironmentMetricStrip } from './components/EnvironmentMetricStrip';
import { EnvironmentTrendPanel } from './components/EnvironmentTrendPanel';
import styles from './index.less';

type DatacenterOption = { id: string; name: string; code: string };

const Environment = () => {
  const [searchParams] = useSearchParams();
  const metric = searchParams.get('metric') || 'temperature';
  const datacenterId = searchParams.get('datacenterId') || undefined;
  const range = (searchParams.get('range') || '24h') as NonNullable<
    EnvironmentQuery['range']
  >;
  const granularity = (searchParams.get('granularity') || '1h') as NonNullable<
    EnvironmentQuery['granularity']
  >;
  const cabinetId = searchParams.get('cabinetId') || undefined;
  const selectedTime = searchParams.get('time') || undefined;
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<EnvironmentOverview | null>(null);
  const [cabinets, setCabinets] = useState<CabinetEnvironmentView[]>([]);
  const [temperature, setTemperature] = useState<TemperaturePoint[]>([]);
  const [pue, setPue] = useState<PuePoint[]>([]);
  const [thresholds, setThresholds] = useState<EnvironmentThresholds>();
  const [datacenters, setDatacenters] = useState<DatacenterOption[]>([]);
  const [sensors, setSensors] = useState<EnvironmentSensorView[]>([]);
  const [sensorLoading, setSensorLoading] = useState(false);

  const selectedCabinet = useMemo(
    () => cabinets.find((item) => item.cabinetId === cabinetId),
    [cabinetId, cabinets],
  );

  const updateContext = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      history.replace(`/monitor/environment?${next.toString()}`);
    },
    [],
  );

  useEffect(() => {
    getAllDatacenters().then((response) => {
      if (response.success && response.data) setDatacenters(response.data);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = { datacenterId, range, granularity };
    Promise.all([
      getEnvironmentOverview(datacenterId),
      getCabinetEnvironments(datacenterId),
      getTemperatureTrend(query),
      getPueTrend(query),
      getEnvironmentThresholds(),
    ])
      .then(
        ([
          overviewResult,
          cabinetResult,
          temperatureResult,
          pueResult,
          thresholdResult,
        ]) => {
          if (!active) return;
          setOverview(overviewResult.data || null);
          setCabinets(cabinetResult.data || []);
          setTemperature(temperatureResult.data || []);
          setPue(pueResult.data || []);
          setThresholds(thresholdResult.data);
        },
      )
      .catch(() => message.error('环境数据加载失败，请稍后重试'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [datacenterId, granularity, range]);

  useEffect(() => {
    if (!cabinetId) {
      setSensors([]);
      return;
    }
    setSensorLoading(true);
    getCabinetSensors(cabinetId)
      .then((response) => setSensors(response.data || []))
      .catch(() => message.error('传感器数据加载失败'))
      .finally(() => setSensorLoading(false));
  }, [cabinetId]);

  if (loading && !overview) {
    return (
      <PageContainer>
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={styles.environmentPage}>
      <Alert
        className={styles.contextAlert}
        type="info"
        showIcon
        message="环境指标与告警共用同一规则中心"
        description={`阈值需持续 ${thresholds?.durationMinutes ?? '—'} 分钟后触发，回差 ${thresholds?.hysteresis ?? '—'}℃；缺失、延迟、估算和无效数据均与 0 明确区分。`}
      />
      <EnvironmentMetricStrip
        overview={overview}
        activeMetric={metric}
        onMetricChange={(value) => updateContext({ metric: value })}
      />
      <EnvironmentTrendPanel
        metric={metric}
        range={range}
        granularity={granularity}
        temperature={temperature}
        pue={pue}
        thresholds={thresholds}
        onRangeChange={(value) =>
          updateContext({
            range: value,
            granularity: value === '24h' ? '1h' : granularity,
          })
        }
        onGranularityChange={(value) => updateContext({ granularity: value })}
        onOpenAnomaly={(nextCabinetId, time) =>
          updateContext({ cabinetId: nextCabinetId, time })
        }
      />
      <EnvironmentCabinetTable
        items={cabinets}
        datacenters={datacenters}
        datacenterId={datacenterId}
        onDatacenterChange={(value) => updateContext({ datacenterId: value })}
        onOpen={(item) =>
          updateContext({ cabinetId: item.cabinetId, time: item.collectedAt })
        }
      />
      <EnvironmentDetailDrawer
        cabinet={selectedCabinet}
        sensors={sensors}
        thresholds={thresholds}
        loading={sensorLoading}
        selectedTime={selectedTime}
        onClose={() => updateContext({ cabinetId: undefined, time: undefined })}
      />
    </PageContainer>
  );
};

export default Environment;

import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Select, Skeleton, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataFreshness } from '@/components/operations';
import { getReportSnapshot, type ReportSnapshot } from '@/services/platform';
import { ReportKpis } from './ReportKpis';
import {
  AssetsReport,
  CapacityReport,
  EnergyReport,
  SlaReport,
} from './ReportSections';
import {
  normalizeReportSection,
  type ReportSection,
  serializeReportSection,
} from './reportModel';

export default function ReportsPage() {
  const { message } = App.useApp();
  const deepLinkedSection = useMemo(
    () =>
      normalizeReportSection(
        new URLSearchParams(location.search).get('reportId'),
      ),
    [],
  );
  const [section, setSection] = useState<ReportSection>(deepLinkedSection);
  const [snapshot, setSnapshot] = useState<ReportSnapshot>();
  const [datacenterId, setDatacenterId] = useState('all');
  const [period, setPeriod] = useState('6m');
  const refresh = async (
    nextDatacenter = datacenterId,
    nextPeriod = period,
  ) => {
    const response = await getReportSnapshot({
      datacenterId: nextDatacenter,
      period: nextPeriod,
    });
    setSnapshot(response.data);
  };
  useEffect(() => {
    void refresh();
  }, []);
  if (!snapshot)
    return (
      <PageContainer title="运营报表">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );
  const exportSection = () => {
    const blob = new Blob(
      [`\uFEFF${serializeReportSection(snapshot, section)}`],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `report-${section}-${dayjs().format('YYYYMMDD')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('当前报表已导出');
  };

  return (
    <PageContainer
      title="运营报表"
      subTitle="用统一口径查看资产可信度、容量余量、能耗效率和告警处置效率"
      extra={
        <DataFreshness
          source="Mock 报表快照"
          collectedAt={snapshot.generatedAt}
        />
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          value={datacenterId}
          style={{ width: 220 }}
          options={[
            { value: 'all', label: '全部数据中心' },
            ...snapshot.datacenters.map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
          onChange={(value) => {
            setDatacenterId(value);
            void refresh(value, period);
          }}
        />
        <Select
          value={period}
          style={{ width: 130 }}
          options={[
            { value: '30d', label: '最近 30 天' },
            { value: '6m', label: '最近 6 个月' },
            { value: '12m', label: '最近 12 个月' },
          ]}
          onChange={(value) => {
            setPeriod(value);
            void refresh(datacenterId, value);
          }}
        />
        <Button icon={<Download size={15} />} onClick={exportSection}>
          导出当前报表
        </Button>
      </Space>
      <ReportKpis kpis={snapshot.kpis} />
      <Card style={{ marginTop: 16 }}>
        <Tabs
          activeKey={section}
          onChange={(key) => setSection(key as ReportSection)}
          items={[
            {
              key: 'assets',
              label: '资产健康',
              children: <AssetsReport snapshot={snapshot} />,
            },
            {
              key: 'capacity',
              label: '容量利用',
              children: <CapacityReport snapshot={snapshot} />,
            },
            {
              key: 'energy',
              label: '能耗与 PUE',
              children: <EnergyReport snapshot={snapshot} />,
            },
            {
              key: 'sla',
              label: '告警 SLA',
              children: <SlaReport snapshot={snapshot} />,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}

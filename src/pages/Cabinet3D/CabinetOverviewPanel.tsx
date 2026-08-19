import { Badge, Card, Progress, Statistic } from 'antd';
import dayjs from 'dayjs';
import type { Cabinet3DStats } from './cabinet3dModel';
import styles from './index.less';

interface CabinetOverviewPanelProps {
  cabinet: IDC.Cabinet;
  stats: Cabinet3DStats;
  visibleDeviceCount: number;
  refreshedAt?: string;
}

export function CabinetOverviewPanel({
  cabinet,
  stats,
  visibleDeviceCount,
  refreshedAt,
}: CabinetOverviewPanelProps) {
  return (
    <Card className={styles.statsCard} title="机柜运行摘要" size="small">
      <div className={styles.identityBlock}>
        <strong>{cabinet.code}</strong>
        <span>
          {cabinet.row} 排 {cabinet.column} 列 · {cabinet.uHeight}U
        </span>
      </div>
      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span>U 位使用</span>
          <strong>{stats.usage}%</strong>
        </div>
        <Progress
          percent={stats.usage}
          showInfo={false}
          status={stats.usage >= 90 ? 'exception' : 'active'}
        />
        <span>
          {stats.usedU}U / {stats.totalU}U
        </span>
      </div>
      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span>功率使用</span>
          <strong>{stats.powerUsage}%</strong>
        </div>
        <Progress
          percent={stats.powerUsage}
          showInfo={false}
          strokeColor={stats.powerUsage >= 80 ? '#fa8c16' : undefined}
        />
        <span>
          {stats.currentPower}W / {stats.maxPower}W
        </span>
      </div>
      <div className={styles.statGrid}>
        <Statistic title="设备" value={stats.total} />
        <Statistic title="当前可见" value={visibleDeviceCount} />
        <Statistic
          title="在线"
          value={stats.online}
          valueStyle={{ color: '#389e0d' }}
        />
        <Statistic
          title="异常"
          value={stats.abnormal}
          valueStyle={{ color: '#d46b08' }}
        />
        <Statistic
          title="离线"
          value={stats.offline}
          valueStyle={{ color: '#8c8c8c' }}
        />
      </div>
      <div className={styles.freshness}>
        <Badge status={refreshedAt ? 'success' : 'default'} />
        <span>
          Mock 资产/端口 ·{' '}
          {refreshedAt ? dayjs(refreshedAt).format('HH:mm:ss') : '等待刷新'}
        </span>
      </div>
    </Card>
  );
}

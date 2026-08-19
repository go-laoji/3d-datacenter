import { Badge, Progress, Tooltip } from 'antd';
import { Box, Cable, Server, WifiOff } from 'lucide-react';
import { DataFreshness } from '@/components/operations';
import type { SceneStats } from './datacenter3dModel';
import styles from './index.less';

interface Datacenter3DStatsProps {
  stats: SceneStats;
  refreshedAt?: string;
  filtered: boolean;
}

export function Datacenter3DStats({
  stats,
  refreshedAt,
  filtered,
}: Datacenter3DStatsProps) {
  return (
    <section className={styles.stats} aria-label="3D 场景状态摘要">
      <div className={styles.statItem}>
        <Server size={16} aria-hidden />
        <span>机柜 {stats.cabinetCount}</span>
      </div>
      <div className={styles.statItem}>
        <Box size={16} aria-hidden />
        <span>设备 {stats.deviceCount}</span>
      </div>
      <div className={styles.statItem}>
        <Cable size={16} aria-hidden />
        <span>连线 {stats.connectionCount}</span>
      </div>
      <div className={styles.statItem}>
        <Badge status="success" />
        <span>在线 {stats.onlineCount}</span>
      </div>
      <div className={styles.statItem}>
        <Badge status="warning" />
        <span>异常 {stats.abnormalCount}</span>
      </div>
      <div className={styles.statItem}>
        <WifiOff size={15} aria-hidden />
        <span>离线 {stats.offlineCount}</span>
      </div>
      <Tooltip title={`U 位使用率 ${stats.usedURatio}%`}>
        <div className={styles.capacityStat}>
          <span>U 位</span>
          <Progress percent={stats.usedURatio} size="small" showInfo={false} />
          <strong>{stats.usedURatio}%</strong>
        </div>
      </Tooltip>
      <Tooltip title={`功率使用率 ${stats.powerRatio}%`}>
        <div className={styles.capacityStat}>
          <span>功率</span>
          <Progress
            percent={stats.powerRatio}
            size="small"
            showInfo={false}
            strokeColor={stats.powerRatio >= 80 ? '#fa8c16' : undefined}
          />
          <strong>{stats.powerRatio}%</strong>
        </div>
      </Tooltip>
      <div className={styles.freshness}>
        <DataFreshness
          source="Mock 场景"
          collectedAt={refreshedAt}
          suffix={filtered ? ' · 已筛选' : undefined}
        />
      </div>
    </section>
  );
}

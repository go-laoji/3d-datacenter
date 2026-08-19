export interface CabinetRiskTag {
  key: string;
  label: string;
  color: string;
}

export const getCabinetHealth = (cabinet: IDC.Cabinet) => {
  const spaceUsage = cabinet.uHeight ? cabinet.usedU / cabinet.uHeight : 0;
  const powerUsage = cabinet.maxPower
    ? cabinet.currentPower / cabinet.maxPower
    : 0;
  const risks: CabinetRiskTag[] = [];
  let score = 100;

  if (spaceUsage >= 0.9) {
    risks.push({ key: 'space-critical', label: '空间紧张', color: 'error' });
    score -= 20;
  } else if (spaceUsage >= 0.75) {
    risks.push({ key: 'space-warning', label: '空间偏高', color: 'warning' });
    score -= 10;
  }

  if (powerUsage >= 0.85) {
    risks.push({ key: 'power-critical', label: '功率高', color: 'error' });
    score -= 20;
  } else if (powerUsage >= 0.7) {
    risks.push({ key: 'power-warning', label: '功率关注', color: 'warning' });
    score -= 10;
  }

  if (cabinet.status === 'warning') {
    risks.push({ key: 'status-warning', label: '运行告警', color: 'warning' });
    score -= 15;
  } else if (cabinet.status === 'error') {
    risks.push({ key: 'status-error', label: '运行故障', color: 'error' });
    score -= 35;
  } else if (cabinet.status === 'offline') {
    risks.push({ key: 'status-offline', label: '采集离线', color: 'default' });
    score -= 30;
  }

  return {
    score: Math.max(0, score),
    risks,
    spaceUsage,
    powerUsage,
  };
};

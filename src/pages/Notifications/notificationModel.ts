import type { EscalationStep } from '@/services/platform';

export function validateEscalationSteps(steps: EscalationStep[]) {
  if (!steps.length) return '至少配置一个升级步骤';
  const sorted = [...steps].sort((a, b) => a.delayMinutes - b.delayMinutes);
  if (sorted[0].delayMinutes !== 0) return '第一个步骤必须立即通知';
  if (steps.some((step) => !step.target || !step.channelIds.length)) {
    return '每个步骤都需要通知对象和至少一个渠道';
  }
  if (new Set(steps.map((step) => step.delayMinutes)).size !== steps.length) {
    return '升级等待时间不能重复';
  }
  return undefined;
}

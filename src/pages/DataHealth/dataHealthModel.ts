import type { DataHealthWorkspace } from '@/services/platform';

export function summarizeDataHealth(workspace: DataHealthWorkspace) {
  return {
    healthySources: workspace.sources.filter(
      (source) => source.quality === 'good',
    ).length,
    degradedSources: workspace.sources.filter(
      (source) => source.quality !== 'good',
    ).length,
    openIssues: workspace.issues.filter((issue) => issue.status === 'pending')
      .length,
    criticalIssues: workspace.issues.filter(
      (issue) => issue.status === 'pending' && issue.severity === 'error',
    ).length,
  };
}

export function getOverallDataHealth(workspace: DataHealthWorkspace) {
  const summary = summarizeDataHealth(workspace);
  if (
    summary.criticalIssues ||
    workspace.sources.some((source) => source.quality === 'interrupted')
  )
    return 'error';
  if (summary.degradedSources || summary.openIssues) return 'warning';
  return 'success';
}

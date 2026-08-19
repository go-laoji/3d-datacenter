import { request } from '@umijs/max';

export interface PlatformTask {
  id: string;
  name: string;
  type: 'import' | 'export' | 'sync';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  total: number;
  succeeded: number;
  failed: number;
  errorFile?: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  key: string;
  name: string;
  action: 'create' | 'update' | 'skip' | 'error';
  differences: string[];
  error?: string;
}

export interface ImportPreview {
  id: string;
  entityType: string;
  fileName: string;
  rows: ImportPreviewRow[];
  mapping: Record<string, string>;
}

export interface TaskWorkspace {
  tasks: PlatformTask[];
  supportedImports: { value: string; label: string; fields: string[] }[];
}

export async function getTaskWorkspace() {
  return request<{ success: boolean; data: TaskWorkspace }>(
    '/api/platform/tasks',
    { method: 'GET' },
  );
}

export async function previewImport(data: {
  entityType: string;
  fileName: string;
  mapping: Record<string, string>;
}) {
  return request<{ success: boolean; data: ImportPreview }>(
    '/api/platform/imports/preview',
    { method: 'POST', data },
  );
}

export async function applyImport(previewId: string) {
  return request<{ success: boolean; data: PlatformTask }>(
    '/api/platform/imports/apply',
    { method: 'POST', data: { previewId } },
  );
}

export async function transitionPlatformTask(id: string, action: 'retry' | 'cancel') {
  return request<{ success: boolean; data: PlatformTask }>(
    `/api/platform/tasks/${id}/${action}`,
    { method: 'POST' },
  );
}

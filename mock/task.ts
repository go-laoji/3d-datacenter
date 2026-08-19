import type { Request, Response } from 'express';
import type { ImportPreview, PlatformTask } from '../src/services/platform/task';

let tasks: PlatformTask[] = [
  { id: 'task-028', name: '设备资产导入 · devices-20260820.xlsx', type: 'import', status: 'completed', progress: 100, createdBy: '李工程师', createdAt: '2026-08-20T01:12:00+08:00', completedAt: '2026-08-20T01:13:24+08:00', total: 42, succeeded: 40, failed: 2, errorFile: 'devices-20260820-errors.csv' },
  { id: 'task-027', name: '北京 SNMP 资产同步', type: 'sync', status: 'processing', progress: 68, createdBy: '系统任务', createdAt: '2026-08-20T02:30:00+08:00', total: 168, succeeded: 114, failed: 0 },
  { id: 'task-026', name: '物理连接导入 · links.csv', type: 'import', status: 'failed', progress: 37, createdBy: '张运维', createdAt: '2026-08-19T18:06:00+08:00', completedAt: '2026-08-19T18:06:38+08:00', total: 81, succeeded: 28, failed: 53, errorFile: 'links-errors.csv' },
  { id: 'task-025', name: '月度资产报表导出', type: 'export', status: 'cancelled', progress: 22, createdBy: '周审计', createdAt: '2026-08-19T10:20:00+08:00', total: 340, succeeded: 74, failed: 0 },
];

let preview: ImportPreview | undefined;
const pause = () => new Promise((resolve) => setTimeout(resolve, 320));

export default {
  'GET /api/platform/tasks': async (_req: Request, res: Response) => {
    await pause();
    res.json({ success: true, data: { tasks, supportedImports: [
      { value: 'device', label: '设备资产', fields: ['assetCode', 'name', 'cabinetCode', 'startU', 'managementIp'] },
      { value: 'connection', label: '物理连接', fields: ['cableNumber', 'sourcePort', 'targetPort', 'cableType'] },
      { value: 'cabinet', label: '机柜', fields: ['code', 'name', 'row', 'column', 'uHeight'] },
    ] } });
  },
  'POST /api/platform/imports/preview': async (req: Request, res: Response) => {
    await pause();
    preview = {
      id: `preview-${Date.now()}`, entityType: req.body.entityType, fileName: req.body.fileName, mapping: req.body.mapping,
      rows: [
        { rowNumber: 2, key: 'SRV-BJ-021', name: '应用服务器 APP-21', action: 'create', differences: ['新增资产', '安装至 A1-05 U18-U19'] },
        { rowNumber: 3, key: 'SW-BJ-003', name: '核心交换机 SW-03', action: 'update', differences: ['managementIp: 10.10.1.20 → 10.10.1.23', 'owner: 网络组 → 李工程师'] },
        { rowNumber: 4, key: 'SRV-BJ-019', name: '数据库服务器 DB-19', action: 'skip', differences: ['数据与系统现状一致'] },
        { rowNumber: 5, key: 'UNKNOWN', name: '未知设备', action: 'error', differences: [], error: '机柜编码 CAB-A99 不存在' },
        { rowNumber: 6, key: 'SRV-BJ-022', name: '应用服务器 APP-22', action: 'error', differences: [], error: 'U18-U19 与现有设备冲突' },
      ],
    };
    res.json({ success: true, data: preview });
  },
  'POST /api/platform/imports/apply': async (req: Request, res: Response) => {
    await pause();
    if (!preview || preview.id !== req.body.previewId) {
      res.status(409).json({ success: false, errorMessage: '预览已失效，请重新解析' }); return;
    }
    const validRows = preview.rows.filter((row) => row.action !== 'error');
    const task: PlatformTask = {
      id: `task-${String(tasks.length + 29).padStart(3, '0')}`, name: `${preview.entityType} 导入 · ${preview.fileName}`,
      type: 'import', status: 'processing', progress: 60, createdBy: '当前用户', createdAt: new Date().toISOString(),
      total: preview.rows.length, succeeded: validRows.length, failed: preview.rows.length - validRows.length, errorFile: 'import-errors.csv',
    };
    tasks = [task, ...tasks]; res.json({ success: true, data: task });
  },
  'POST /api/platform/tasks/:id/retry': async (req: Request, res: Response) => {
    await pause();
    tasks = tasks.map((task) => task.id === req.params.id ? { ...task, status: 'processing', progress: Math.max(task.progress, 5) } : task);
    res.json({ success: true, data: tasks.find((task) => task.id === req.params.id) });
  },
  'POST /api/platform/tasks/:id/cancel': async (req: Request, res: Response) => {
    await pause();
    tasks = tasks.map((task) => task.id === req.params.id ? { ...task, status: 'cancelled' } : task);
    res.json({ success: true, data: tasks.find((task) => task.id === req.params.id) });
  },
};

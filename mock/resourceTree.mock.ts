import type { Request, Response } from 'express';

const observedAt = '2026-08-20T02:15:00Z';
const items = [
  { id: 'dc-001', type: 'datacenter', name: '北京亦庄数据中心', code: 'BJ-YZ-01', status: 'warning', alertCount: 3, route: '/idc/datacenter?datacenterId=dc-001', keywords: ['北京', '亦庄', 'BJ-YZ-01'] },
  { id: 'cab-bj-001', type: 'cabinet', name: 'A区1排1号', code: 'BJ-A01-01', parentId: 'dc-001', datacenterId: 'dc-001', status: 'warning', alertCount: 1, route: '/idc/cabinet?cabinetId=cab-bj-001', keywords: ['机柜', 'A01', 'BJ-A01-01'] },
  { id: 'cab-bj-003', type: 'cabinet', name: 'A区1排3号', code: 'BJ-A01-03', parentId: 'dc-001', datacenterId: 'dc-001', status: 'critical', alertCount: 2, route: '/idc/cabinet?cabinetId=cab-bj-003', keywords: ['机柜', '高温', 'BJ-A01-03'] },
  { id: 'dev-001', type: 'device', name: 'Server-01', code: 'SRV-BJ-001', parentId: 'cab-bj-001', datacenterId: 'dc-001', cabinetId: 'cab-bj-001', subtitle: '10.10.1.11 · U12-U13', status: 'normal', alertCount: 0, route: '/idc/device?deviceId=dev-001', keywords: ['服务器', '10.10.1.11', 'SRV-BJ-001'] },
  { id: 'dev-003', type: 'device', name: '应用服务器-A1-1', code: 'SRV-BJ-003', parentId: 'cab-bj-003', datacenterId: 'dc-001', cabinetId: 'cab-bj-003', subtitle: '10.10.1.13 · U20-U21', status: 'critical', alertCount: 1, route: '/idc/device?deviceId=dev-003', keywords: ['应用服务器', '10.10.1.13', 'SRV-BJ-003'] },
  { id: 'pdu-001', type: 'pdu', name: 'PDU-A-01', code: 'PDU-BJ-A01', parentId: 'cab-bj-001', datacenterId: 'dc-001', cabinetId: 'cab-bj-001', subtitle: 'A路 · 60% 负载', status: 'normal', alertCount: 0, route: '/idc/pdu?deviceId=pdu-001', keywords: ['PDU', 'A路', 'PDU-BJ-A01'] },
  { id: 'port-dev-003-1', type: 'port', name: 'GE0/0/1', code: 'PORT-003-1', parentId: 'dev-003', datacenterId: 'dc-001', cabinetId: 'cab-bj-003', subtitle: '10G · VLAN 110', status: 'warning', alertCount: 1, route: '/network/port?deviceId=dev-003&portId=port-dev-003-1', keywords: ['端口', 'GE0/0/1', 'VLAN110'] },
  { id: 'conn-007', type: 'connection', name: 'Server-01 ↔ 核心交换机', code: 'CONN-007', parentId: 'dev-001', datacenterId: 'dc-001', cabinetId: 'cab-bj-001', subtitle: '10G 光纤 · A路网络', status: 'normal', alertCount: 0, route: '/network/connection?connectionId=conn-007', keywords: ['链路', '光纤', 'CONN-007'] },
  { id: 'dc-002', type: 'datacenter', name: '上海嘉定数据中心', code: 'SH-JD-01', status: 'warning', alertCount: 2, route: '/idc/datacenter?datacenterId=dc-002', keywords: ['上海', '嘉定', 'SH-JD-01'] },
  { id: 'cab-sh-001', type: 'cabinet', name: 'B区1排1号', code: 'SH-B01-01', parentId: 'dc-002', datacenterId: 'dc-002', status: 'normal', alertCount: 0, route: '/idc/cabinet?cabinetId=cab-sh-001', keywords: ['机柜', 'B01', 'SH-B01-01'] },
  { id: 'cab-sh-002', type: 'cabinet', name: 'B区1排2号', code: 'SH-B01-02', parentId: 'dc-002', datacenterId: 'dc-002', status: 'offline', alertCount: 2, route: '/idc/cabinet?cabinetId=cab-sh-002', keywords: ['机柜', '采集中断', 'SH-B01-02'] },
  { id: 'dev-101', type: 'device', name: 'Server-101', code: 'SRV-SH-101', parentId: 'cab-sh-001', datacenterId: 'dc-002', cabinetId: 'cab-sh-001', subtitle: '10.20.1.21 · U16-U17', status: 'normal', alertCount: 0, route: '/idc/device?deviceId=dev-101', keywords: ['服务器', '10.20.1.21', 'SRV-SH-101'] },
] as const;

export default {
  'GET /api/idc/resource-index': (req: Request, res: Response) => {
    const keyword = String(req.query.keyword || '').trim().toLowerCase();
    const filtered = keyword
      ? items.filter((item) => [item.name, item.code, 'subtitle' in item ? item.subtitle : undefined, ...item.keywords].some((value) => value?.toLowerCase().includes(keyword)))
      : items;
    res.json({
      success: true,
      data: filtered.map((item) => ({ ...item, source: 'CMDB 聚合索引 / RESOURCE-01', collectedAt: observedAt })),
    });
  },
};

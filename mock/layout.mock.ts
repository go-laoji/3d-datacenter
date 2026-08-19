import type { Request, Response } from 'express';

type LayoutStore = Record<string, IDC.DatacenterLayout>;

const store: LayoutStore = {};

function nowIso() {
  return new Date().toISOString();
}

function defaultLayout(datacenterId: string): IDC.DatacenterLayout {
  return {
    datacenterId,
    version: 1,
    canvasWidth: 60,
    canvasHeight: 40,
    pxPerMeter: 50,
    cabinets: [],
    zones: [],
    facilities: [],
    updatedAt: nowIso(),
  };
}

export default {
  'GET /api/idc/datacenters/:id/layout': (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({
      success: true,
      data: store[id] ?? defaultLayout(id),
    });
  },

  'PUT /api/idc/datacenters/:id/layout': (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as Partial<IDC.DatacenterLayout>;
    const prev = store[id] ?? defaultLayout(id);
    const force = Boolean((body as Partial<IDC.DatacenterLayout> & { force?: boolean }).force);
    if (!force && body.version !== undefined && body.version !== prev.version) {
      res.status(409).json({
        success: false,
        errorCode: 'LAYOUT_VERSION_CONFLICT',
        errorMessage: `布局版本已从 v${body.version} 更新为 v${prev.version}`,
        data: prev,
      });
      return;
    }
    const next: IDC.DatacenterLayout = {
      ...prev,
      datacenterId: id,
      version: prev.version + 1,
      canvasWidth: body.canvasWidth ?? prev.canvasWidth,
      canvasHeight: body.canvasHeight ?? prev.canvasHeight,
      pxPerMeter: body.pxPerMeter ?? prev.pxPerMeter,
      cabinets: body.cabinets ?? prev.cabinets,
      zones: body.zones ?? prev.zones,
      facilities: body.facilities ?? prev.facilities,
      updatedAt: nowIso(),
    };
    store[id] = next;
    res.json({ success: true, data: next });
  },
};

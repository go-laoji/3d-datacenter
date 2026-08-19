import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCabinetsByDatacenter } from '@/services/idc/cabinet';
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  getDatacenterLayout,
  saveDatacenterLayout,
} from '@/services/idc/layout';
import {
  cloneLayout,
  createLayoutDraft,
  hasLayoutChanges,
  type LayoutDraft,
  parseLayoutDraft,
} from './layoutEditorModel';

const draftKey = (datacenterId: string) =>
  `datacenter-layout-draft:${datacenterId}`;

export function useLayoutEditorSession(datacenterId?: string) {
  const [datacenters, setDatacenters] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [serverLayout, setServerLayout] = useState<IDC.DatacenterLayout | null>(
    null,
  );
  const [workingCopy, setWorkingCopy] = useState<IDC.DatacenterLayout | null>(
    null,
  );
  const [undoStack, setUndoStack] = useState<IDC.DatacenterLayout[]>([]);
  const [redoStack, setRedoStack] = useState<IDC.DatacenterLayout[]>([]);
  const [draftCandidate, setDraftCandidate] = useState<LayoutDraft | null>(
    null,
  );
  const [draftSavedAt, setDraftSavedAt] = useState<string>();
  const [conflictLayout, setConflictLayout] =
    useState<IDC.DatacenterLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const requestSequence = useRef(0);

  useEffect(() => {
    getAllDatacenters().then((response) => {
      if (response.success) setDatacenters(response.data || []);
    });
  }, []);

  const load = useCallback(async () => {
    if (!datacenterId) return;
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setLoading(true);
    setError(undefined);
    try {
      const [cabinetResponse, layoutResponse] = await Promise.all([
        getCabinetsByDatacenter(datacenterId),
        getDatacenterLayout(datacenterId),
      ]);
      if (sequence !== requestSequence.current) return;
      if (!layoutResponse.success || !layoutResponse.data) {
        throw new Error('layout unavailable');
      }
      const nextLayout = cloneLayout(layoutResponse.data);
      setCabinets(cabinetResponse.success ? cabinetResponse.data || [] : []);
      setServerLayout(nextLayout);
      setWorkingCopy(cloneLayout(nextLayout));
      setUndoStack([]);
      setRedoStack([]);
      setConflictLayout(null);

      const localDraft = parseLayoutDraft(
        localStorage.getItem(draftKey(datacenterId)),
      );
      if (
        localDraft &&
        localDraft.datacenterId === datacenterId &&
        hasLayoutChanges(nextLayout, localDraft.workingCopy)
      ) {
        setDraftCandidate(localDraft);
      } else {
        setDraftCandidate(null);
      }
    } catch {
      if (sequence === requestSequence.current) {
        setError('布局数据加载失败，请重试');
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [datacenterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () =>
      Boolean(
        serverLayout &&
          workingCopy &&
          hasLayoutChanges(serverLayout, workingCopy),
      ),
    [serverLayout, workingCopy],
  );

  const apply = useCallback(
    (
      update:
        | IDC.DatacenterLayout
        | ((layout: IDC.DatacenterLayout) => IDC.DatacenterLayout),
    ) => {
      if (!workingCopy) return;
      const next = typeof update === 'function' ? update(workingCopy) : update;
      setUndoStack((stack) => [...stack.slice(-39), cloneLayout(workingCopy)]);
      setRedoStack([]);
      setWorkingCopy(cloneLayout(next));
      setConflictLayout(null);
    },
    [workingCopy],
  );

  const undo = useCallback(() => {
    const previous = undoStack.at(-1);
    if (!previous || !workingCopy) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack.slice(-39), cloneLayout(workingCopy)]);
    setWorkingCopy(cloneLayout(previous));
  }, [undoStack, workingCopy]);

  const redo = useCallback(() => {
    const next = redoStack.at(-1);
    if (!next || !workingCopy) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack.slice(-39), cloneLayout(workingCopy)]);
    setWorkingCopy(cloneLayout(next));
  }, [redoStack, workingCopy]);

  useEffect(() => {
    if (!datacenterId || !workingCopy || !serverLayout || !dirty) return;
    const timer = window.setTimeout(() => {
      const draft = createLayoutDraft(workingCopy, serverLayout.version);
      localStorage.setItem(draftKey(datacenterId), JSON.stringify(draft));
      setDraftSavedAt(draft.savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [datacenterId, dirty, serverLayout, workingCopy]);

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);

  const save = useCallback(
    async (force = false) => {
      if (!datacenterId || !workingCopy || !serverLayout) return false;
      setSaving(true);
      setError(undefined);
      try {
        const response = await saveDatacenterLayout(datacenterId, {
          version: serverLayout.version,
          force,
          canvasWidth: workingCopy.canvasWidth,
          canvasHeight: workingCopy.canvasHeight,
          pxPerMeter: workingCopy.pxPerMeter,
          cabinets: workingCopy.cabinets,
          zones: workingCopy.zones,
          facilities: workingCopy.facilities,
        });
        if (!response.success || !response.data) throw new Error('save failed');
        const saved = cloneLayout(response.data);
        setServerLayout(saved);
        setWorkingCopy(cloneLayout(saved));
        setUndoStack([]);
        setRedoStack([]);
        setConflictLayout(null);
        setDraftCandidate(null);
        setDraftSavedAt(undefined);
        localStorage.removeItem(draftKey(datacenterId));
        return true;
      } catch {
        try {
          const latestResponse = await getDatacenterLayout(datacenterId);
          if (latestResponse.success && latestResponse.data) {
            setConflictLayout(cloneLayout(latestResponse.data));
          } else {
            setError('布局保存失败，请稍后重试');
          }
        } catch {
          setError('布局保存失败，请稍后重试');
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [datacenterId, serverLayout, workingCopy],
  );

  const useServerVersion = useCallback(() => {
    if (!conflictLayout) return;
    setServerLayout(cloneLayout(conflictLayout));
    setWorkingCopy(cloneLayout(conflictLayout));
    setUndoStack([]);
    setRedoStack([]);
    setConflictLayout(null);
    if (datacenterId) localStorage.removeItem(draftKey(datacenterId));
  }, [conflictLayout, datacenterId]);

  const restoreDraft = useCallback(() => {
    if (!draftCandidate || !serverLayout) return;
    setWorkingCopy({
      ...cloneLayout(draftCandidate.workingCopy),
      version: serverLayout.version,
      updatedAt: serverLayout.updatedAt,
    });
    setDraftSavedAt(draftCandidate.savedAt);
    setDraftCandidate(null);
    setUndoStack([]);
    setRedoStack([]);
  }, [draftCandidate, serverLayout]);

  const discardDraft = useCallback(() => {
    if (datacenterId) localStorage.removeItem(draftKey(datacenterId));
    setDraftCandidate(null);
    setDraftSavedAt(undefined);
  }, [datacenterId]);

  return {
    datacenters,
    cabinets,
    serverLayout,
    workingCopy,
    draftCandidate,
    draftSavedAt,
    conflictLayout,
    loading,
    saving,
    error,
    dirty,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    apply,
    undo,
    redo,
    save,
    load,
    useServerVersion,
    restoreDraft,
    discardDraft,
  };
}

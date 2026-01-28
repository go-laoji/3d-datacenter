import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LODLevel, useViewStore } from '../viewStore';

describe('ViewStore', () => {
  beforeEach(() => {
    act(() => {
      useViewStore.getState().resetView();
    });
  });

  describe('view mode', () => {
    it('should set view mode', () => {
      act(() => {
        useViewStore.getState().setViewMode('cabinet');
      });

      expect(useViewStore.getState().viewMode).toBe('cabinet');
    });

    it('should have default view mode as datacenter', () => {
      expect(useViewStore.getState().viewMode).toBe('datacenter');
    });
  });

  describe('selection', () => {
    it('should select cabinet', () => {
      const mockCabinet = {
        id: 'cab-001',
        name: 'Cabinet 01',
        code: 'CAB-01',
        row: 1,
        column: 1,
        uHeight: 42,
        usedU: 20,
        status: 'normal' as const,
      } as IDC.Cabinet;

      act(() => {
        useViewStore.getState().selectCabinet(mockCabinet);
      });

      expect(useViewStore.getState().selectedCabinet).toEqual(mockCabinet);
    });

    it('should clear selection', () => {
      const mockDevice = {
        id: 'dev-001',
        templateId: 'tpl-001',
        name: 'Server 1',
        cabinetId: 'cab-001',
        startU: 1,
        endU: 4,
        assetCode: 'ASSET-001',
        status: 'online' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      } as IDC.Device;

      act(() => {
        useViewStore.getState().selectDevice(mockDevice);
        useViewStore.getState().clearSelection();
      });

      expect(useViewStore.getState().selectedDevice).toBeNull();
      expect(useViewStore.getState().selectedCabinet).toBeNull();
    });
  });

  describe('multi-selection', () => {
    it('should add device to selection', () => {
      act(() => {
        useViewStore.getState().addToSelection('dev-001');
        useViewStore.getState().addToSelection('dev-002');
      });

      expect(useViewStore.getState().selectedDeviceIds).toContain('dev-001');
      expect(useViewStore.getState().selectedDeviceIds).toContain('dev-002');
      expect(useViewStore.getState().selectedDeviceIds).toHaveLength(2);
    });

    it('should remove device from selection', () => {
      act(() => {
        useViewStore
          .getState()
          .setSelectedDeviceIds(['dev-001', 'dev-002', 'dev-003']);
        useViewStore.getState().removeFromSelection('dev-002');
      });

      expect(useViewStore.getState().selectedDeviceIds).not.toContain(
        'dev-002',
      );
      expect(useViewStore.getState().selectedDeviceIds).toHaveLength(2);
    });

    it('should not add duplicate device', () => {
      act(() => {
        useViewStore.getState().addToSelection('dev-001');
        useViewStore.getState().addToSelection('dev-001');
      });

      expect(useViewStore.getState().selectedDeviceIds).toHaveLength(1);
    });
  });

  describe('view settings', () => {
    it('should set info density', () => {
      act(() => {
        useViewStore.getState().setInfoDensity('detailed');
      });

      expect(useViewStore.getState().infoDensity).toBe('detailed');
    });

    it('should set LOD level', () => {
      act(() => {
        useViewStore.getState().setLodLevel(LODLevel.MEDIUM);
      });

      expect(useViewStore.getState().lodLevel).toBe(LODLevel.MEDIUM);
    });

    it('should toggle heatmap', () => {
      expect(useViewStore.getState().showHeatmap).toBe(false);

      act(() => {
        useViewStore.getState().toggleHeatmap();
      });

      expect(useViewStore.getState().showHeatmap).toBe(true);

      act(() => {
        useViewStore.getState().toggleHeatmap();
      });

      expect(useViewStore.getState().showHeatmap).toBe(false);
    });
  });

  describe('camera', () => {
    it('should set camera target', () => {
      const target: [number, number, number] = [5, 2, 3];

      act(() => {
        useViewStore.getState().setCameraTarget(target);
      });

      expect(useViewStore.getState().cameraTarget).toEqual(target);
    });
  });

  describe('rotation', () => {
    it('should set cabinet rotation', () => {
      act(() => {
        useViewStore.getState().setCabinetRotationY(Math.PI / 4);
      });

      expect(useViewStore.getState().cabinetRotationY).toBe(Math.PI / 4);
    });

    it('should set device rotation', () => {
      act(() => {
        useViewStore.getState().setDeviceRotationY(Math.PI / 2);
      });

      expect(useViewStore.getState().deviceRotationY).toBe(Math.PI / 2);
    });
  });

  describe('reset', () => {
    it('should reset all view state', () => {
      // 设置一些状态
      act(() => {
        useViewStore.getState().setViewMode('cabinet');
        useViewStore.getState().setSelectedDeviceIds(['dev-001']);
        useViewStore.getState().setCabinetRotationY(Math.PI);
      });

      // 重置
      act(() => {
        useViewStore.getState().resetView();
      });

      expect(useViewStore.getState().viewMode).toBe('datacenter');
      expect(useViewStore.getState().selectedDeviceIds).toHaveLength(0);
      expect(useViewStore.getState().cabinetRotationY).toBe(0);
    });
  });
});

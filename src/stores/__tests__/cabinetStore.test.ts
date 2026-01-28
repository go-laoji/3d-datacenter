import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCabinetStore } from '../cabinetStore';

describe('CabinetStore', () => {
  beforeEach(() => {
    act(() => {
      useCabinetStore.getState().selectCabinet(null);
      useCabinetStore.getState().setCabinets([]);
      useCabinetStore.getState().setShowRear(false);
      useCabinetStore.getState().setCabinetRotation(0);
    });
  });

  describe('cabinet selection', () => {
    it('should select a cabinet', () => {
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
        useCabinetStore.getState().selectCabinet(mockCabinet);
      });

      expect(useCabinetStore.getState().selectedCabinet).toEqual(mockCabinet);
    });

    it('should clear cabinet selection', () => {
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
        useCabinetStore.getState().selectCabinet(mockCabinet);
        useCabinetStore.getState().selectCabinet(null);
      });

      expect(useCabinetStore.getState().selectedCabinet).toBeNull();
    });
  });

  describe('cabinet list management', () => {
    it('should set cabinets list', () => {
      const mockCabinets = [
        {
          id: 'cab-001',
          name: 'Cabinet 01',
          code: 'CAB-01',
          row: 1,
          column: 1,
          uHeight: 42,
          usedU: 20,
          status: 'normal' as const,
        },
        {
          id: 'cab-002',
          name: 'Cabinet 02',
          code: 'CAB-02',
          row: 1,
          column: 2,
          uHeight: 42,
          usedU: 30,
          status: 'warning' as const,
        },
      ] as IDC.Cabinet[];

      act(() => {
        useCabinetStore.getState().setCabinets(mockCabinets);
      });

      expect(useCabinetStore.getState().cabinets).toHaveLength(2);
      expect(useCabinetStore.getState().cabinets[0].name).toBe('Cabinet 01');
    });
  });

  describe('rotation state', () => {
    it('should set cabinet rotation', () => {
      act(() => {
        useCabinetStore.getState().setCabinetRotation(Math.PI / 2);
      });

      expect(useCabinetStore.getState().cabinetRotationY).toBe(Math.PI / 2);
    });

    it('should set device rotation', () => {
      act(() => {
        useCabinetStore.getState().setDeviceRotation(Math.PI / 4);
      });

      expect(useCabinetStore.getState().deviceRotationY).toBe(Math.PI / 4);
    });
  });

  describe('view state', () => {
    it('should toggle show rear', () => {
      expect(useCabinetStore.getState().showRear).toBe(false);

      act(() => {
        useCabinetStore.getState().toggleRearView();
      });

      expect(useCabinetStore.getState().showRear).toBe(true);

      act(() => {
        useCabinetStore.getState().toggleRearView();
      });

      expect(useCabinetStore.getState().showRear).toBe(false);
    });

    it('should set show rear directly', () => {
      act(() => {
        useCabinetStore.getState().setShowRear(true);
      });

      expect(useCabinetStore.getState().showRear).toBe(true);
    });
  });
});

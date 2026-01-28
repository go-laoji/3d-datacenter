import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDeviceStore } from '../deviceStore';

// Helper function to create mock device with required fields
const createMockDevice = (overrides: Partial<IDC.Device> = {}): IDC.Device => ({
  id: 'dev-001',
  templateId: 'tpl-001',
  name: 'Test Server',
  cabinetId: 'cab-001',
  startU: 1,
  endU: 4,
  assetCode: 'ASSET-001',
  status: 'online',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('DeviceStore', () => {
  beforeEach(() => {
    // 重置store状态
    act(() => {
      useDeviceStore.getState().clearHoveredDevice();
      useDeviceStore.getState().setDevices([]);
      useDeviceStore.getState().selectDevice(null);
    });
  });

  describe('device selection', () => {
    it('should select a device', () => {
      const mockDevice = createMockDevice();

      act(() => {
        useDeviceStore.getState().selectDevice(mockDevice);
      });

      expect(useDeviceStore.getState().selectedDevice).toEqual(mockDevice);
    });

    it('should clear device selection', () => {
      const mockDevice = createMockDevice();

      act(() => {
        useDeviceStore.getState().selectDevice(mockDevice);
        useDeviceStore.getState().selectDevice(null);
      });

      expect(useDeviceStore.getState().selectedDevice).toBeNull();
    });
  });

  describe('device hover', () => {
    it('should set hovered device id', () => {
      act(() => {
        useDeviceStore.getState().setHoveredDeviceId('dev-001');
      });

      expect(useDeviceStore.getState().hoveredDeviceId).toBe('dev-001');
    });

    it('should clear hovered device', () => {
      act(() => {
        useDeviceStore.getState().setHoveredDeviceId('dev-001');
        useDeviceStore.getState().clearHoveredDevice();
      });

      expect(useDeviceStore.getState().hoveredDeviceId).toBeNull();
    });
  });

  describe('device list management', () => {
    it('should set devices list', () => {
      const mockDevices = [
        createMockDevice({ id: 'dev-001', name: 'Server 1' }),
        createMockDevice({
          id: 'dev-002',
          name: 'Switch 1',
          startU: 5,
          endU: 6,
        }),
      ];

      act(() => {
        useDeviceStore.getState().setDevices(mockDevices);
      });

      expect(useDeviceStore.getState().devices).toHaveLength(2);
      expect(useDeviceStore.getState().devices[0].name).toBe('Server 1');
    });

    it('should get device by id', () => {
      const mockDevices = [
        createMockDevice({ id: 'dev-001', name: 'Server 1' }),
      ];

      act(() => {
        useDeviceStore.getState().setDevices(mockDevices);
      });

      const device = useDeviceStore.getState().getDeviceById('dev-001');
      expect(device?.name).toBe('Server 1');
    });

    it('should get devices by cabinet', () => {
      const mockDevices = [
        createMockDevice({
          id: 'dev-001',
          name: 'Server 1',
          cabinetId: 'cab-001',
        }),
        createMockDevice({
          id: 'dev-002',
          name: 'Server 2',
          cabinetId: 'cab-002',
        }),
      ];

      act(() => {
        useDeviceStore.getState().setDevices(mockDevices);
      });

      const cab1Devices = useDeviceStore
        .getState()
        .getDevicesByCabinet('cab-001');
      expect(cab1Devices).toHaveLength(1);
      expect(cab1Devices[0].id).toBe('dev-001');
    });
  });
});

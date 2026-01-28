import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type PDUDevice,
  type PowerLink,
  type PowerNode,
  usePowerStore,
} from '../powerStore';

// Helper function to create mock PDU device with required fields
const createMockPDU = (overrides: Partial<PDUDevice> = {}): PDUDevice => ({
  id: 'pdu-001',
  templateId: 'tpl-pdu-001',
  name: 'PDU-A-01',
  cabinetId: 'cab-001',
  startU: 1,
  endU: 2,
  assetCode: 'PDU-001',
  status: 'online',
  powerPath: 'A',
  inputVoltage: 220,
  outputPorts: 16,
  maxLoad: 3000,
  currentLoad: 1800,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('PowerStore', () => {
  beforeEach(() => {
    act(() => {
      usePowerStore.getState().setPDUDevices([]);
      usePowerStore.getState().setPowerTopology({ nodes: [], links: [] });
    });
  });

  describe('PDU device management', () => {
    it('should add PDU devices', () => {
      const mockPDUs: PDUDevice[] = [createMockPDU()];

      act(() => {
        usePowerStore.getState().setPDUDevices(mockPDUs);
      });

      expect(usePowerStore.getState().pduDevices).toHaveLength(1);
      expect(usePowerStore.getState().pduDevices[0].powerPath).toBe('A');
    });

    it('should filter PDUs by power path', () => {
      const mockPDUs: PDUDevice[] = [
        createMockPDU({ id: 'pdu-001', name: 'PDU-A-01', powerPath: 'A' }),
        createMockPDU({
          id: 'pdu-002',
          name: 'PDU-B-01',
          powerPath: 'B',
          startU: 3,
          endU: 4,
        }),
      ];

      act(() => {
        usePowerStore.getState().setPDUDevices(mockPDUs);
      });

      const pathAPDUs = usePowerStore.getState().getPDUsByPath('A');
      const pathBPDUs = usePowerStore.getState().getPDUsByPath('B');

      expect(pathAPDUs).toHaveLength(1);
      expect(pathBPDUs).toHaveLength(1);
      expect(pathAPDUs[0].name).toBe('PDU-A-01');
      expect(pathBPDUs[0].name).toBe('PDU-B-01');
    });
  });

  describe('power topology', () => {
    it('should set power topology', () => {
      const mockNodes: PowerNode[] = [
        {
          id: 'utility-001',
          type: 'utility',
          name: '市电A',
          status: 'online',
          capacity: 50000,
        },
        {
          id: 'pdu-001',
          type: 'pdu',
          name: 'PDU-A-01',
          status: 'online',
          capacity: 3000,
          load: 1800,
        },
      ];
      const mockLinks: PowerLink[] = [
        {
          id: 'link-001',
          source: 'utility-001',
          target: 'pdu-001',
          powerPath: 'A',
          status: 'active',
        },
      ];

      act(() => {
        usePowerStore
          .getState()
          .setPowerTopology({ nodes: mockNodes, links: mockLinks });
      });

      expect(usePowerStore.getState().powerTopology.nodes).toHaveLength(2);
      expect(usePowerStore.getState().powerTopology.links).toHaveLength(1);
    });

    it('should calculate load balance', () => {
      const mockLinks: PowerLink[] = [
        {
          id: 'link-001',
          source: 'pdu-001',
          target: 'dev-001',
          powerPath: 'A',
          status: 'active',
        },
        {
          id: 'link-002',
          source: 'pdu-002',
          target: 'dev-002',
          powerPath: 'B',
          status: 'active',
        },
      ];

      act(() => {
        usePowerStore
          .getState()
          .setPowerTopology({ nodes: [], links: mockLinks });
      });

      const balance = usePowerStore.getState().getLoadBalance();
      expect(balance).toBeDefined();
      expect(balance.pathALinks).toBe(1);
      expect(balance.pathBLinks).toBe(1);
    });
  });

  describe('redundancy status', () => {
    it('should identify dual-power devices', () => {
      const mockLinks: PowerLink[] = [
        {
          id: 'link-001',
          source: 'pdu-001',
          target: 'dev-001',
          powerPath: 'A',
          status: 'active',
        },
        {
          id: 'link-002',
          source: 'pdu-002',
          target: 'dev-001',
          powerPath: 'B',
          status: 'active',
        },
      ];

      act(() => {
        usePowerStore
          .getState()
          .setPowerTopology({ nodes: [], links: mockLinks });
      });

      const redundancy = usePowerStore.getState().getRedundancyStatus();
      expect(redundancy.dualPowerDevices).toContain('dev-001');
      expect(redundancy.singlePowerDevices).toHaveLength(0);
    });

    it('should identify single-power devices', () => {
      const mockLinks: PowerLink[] = [
        {
          id: 'link-001',
          source: 'pdu-001',
          target: 'dev-001',
          powerPath: 'A',
          status: 'active',
        },
      ];

      act(() => {
        usePowerStore
          .getState()
          .setPowerTopology({ nodes: [], links: mockLinks });
      });

      const redundancy = usePowerStore.getState().getRedundancyStatus();
      expect(redundancy.singlePowerDevices).toContain('dev-001');
      expect(redundancy.dualPowerDevices).toHaveLength(0);
    });
  });
});

/**
 * 3D场景状态管理Hooks
 * 提供便捷的方式在组件中使用Zustand stores
 */
import { useCallback, useMemo } from 'react';
import { useCabinetStore } from '@/stores/cabinetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useViewStore } from '@/stores/viewStore';

/**
 * 使用3D场景选择状态
 * 用于管理设备和机柜的选中状态
 */
export function useSceneSelection() {
  const selectedCabinet = useViewStore((s) => s.selectedCabinet);
  const selectedDevice = useViewStore((s) => s.selectedDevice);
  const hoveredCabinetId = useViewStore((s) => s.hoveredCabinetId);
  const hoveredDeviceId = useViewStore((s) => s.hoveredDeviceId);
  const highlightedCabinetId = useViewStore((s) => s.highlightedCabinetId);
  const highlightedDeviceId = useViewStore((s) => s.highlightedDeviceId);
  const selectedDeviceIds = useViewStore((s) => s.selectedDeviceIds);

  const selectCabinet = useViewStore((s) => s.selectCabinet);
  const selectDevice = useViewStore((s) => s.selectDevice);
  const setHoveredCabinet = useViewStore((s) => s.setHoveredCabinet);
  const setHoveredDevice = useViewStore((s) => s.setHoveredDevice);
  const highlightCabinet = useViewStore((s) => s.highlightCabinet);
  const highlightDevice = useViewStore((s) => s.highlightDevice);
  const setSelectedDeviceIds = useViewStore((s) => s.setSelectedDeviceIds);
  const clearSelection = useViewStore((s) => s.clearSelection);

  return {
    // 状态
    selectedCabinet,
    selectedDevice,
    hoveredCabinetId,
    hoveredDeviceId,
    highlightedCabinetId,
    highlightedDeviceId,
    selectedDeviceIds,
    // Actions
    selectCabinet,
    selectDevice,
    setHoveredCabinet,
    setHoveredDevice,
    highlightCabinet,
    highlightDevice,
    setSelectedDeviceIds,
    clearSelection,
  };
}

/**
 * 使用3D场景视图状态
 * 用于管理视图模式、LOD、热力图等
 */
export function useSceneView() {
  const viewMode = useViewStore((s) => s.viewMode);
  const infoDensity = useViewStore((s) => s.infoDensity);
  const lodLevel = useViewStore((s) => s.lodLevel);
  const showHeatmap = useViewStore((s) => s.showHeatmap);
  const cameraTarget = useViewStore((s) => s.cameraTarget);

  const setViewMode = useViewStore((s) => s.setViewMode);
  const setInfoDensity = useViewStore((s) => s.setInfoDensity);
  const setLodLevel = useViewStore((s) => s.setLodLevel);
  const toggleHeatmap = useViewStore((s) => s.toggleHeatmap);
  const setCameraTarget = useViewStore((s) => s.setCameraTarget);
  const resetView = useViewStore((s) => s.resetView);

  return {
    // 状态
    viewMode,
    infoDensity,
    lodLevel,
    showHeatmap,
    cameraTarget,
    // Actions
    setViewMode,
    setInfoDensity,
    setLodLevel,
    toggleHeatmap,
    setCameraTarget,
    resetView,
  };
}

/**
 * 使用3D场景旋转状态
 * 用于管理机柜和设备的独立旋转
 */
export function useSceneRotation() {
  const cabinetRotationY = useViewStore((s) => s.cabinetRotationY);
  const deviceRotationY = useViewStore((s) => s.deviceRotationY);

  const setCabinetRotationY = useViewStore((s) => s.setCabinetRotationY);
  const setDeviceRotationY = useViewStore((s) => s.setDeviceRotationY);

  // 计算是否显示背面
  const showCabinetRear = useMemo(() => {
    const normalized =
      ((cabinetRotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2;
  }, [cabinetRotationY]);

  const showDeviceRear = useMemo(() => {
    const normalized =
      ((deviceRotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2;
  }, [deviceRotationY]);

  return {
    cabinetRotationY,
    deviceRotationY,
    showCabinetRear,
    showDeviceRear,
    setCabinetRotationY,
    setDeviceRotationY,
  };
}

/**
 * 使用设备数据
 * 结合deviceStore和便捷方法
 */
export function useDevices() {
  const devices = useDeviceStore((s) => s.devices);
  const setDevices = useDeviceStore((s) => s.setDevices);
  const getDeviceById = useDeviceStore((s) => s.getDeviceById);
  const getDevicesByCabinet = useDeviceStore((s) => s.getDevicesByCabinet);
  const updateDevice = useDeviceStore((s) => s.updateDevice);

  return {
    devices,
    setDevices,
    getDeviceById,
    getDevicesByCabinet,
    updateDevice,
  };
}

/**
 * 使用机柜数据
 */
export function useCabinets() {
  const cabinets = useCabinetStore((s) => s.cabinets);
  const selectedCabinet = useCabinetStore((s) => s.selectedCabinet);
  const setCabinets = useCabinetStore((s) => s.setCabinets);
  const selectCabinet = useCabinetStore((s) => s.selectCabinet);

  // 计算机柜位置
  const cabinetPositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {};
    const rowSpacing = 1.5;
    const colSpacing = 0.8;

    cabinets.forEach((cab) => {
      const x = (cab.column - 1) * colSpacing;
      const y = (cab.uHeight * 0.0445) / 2;
      const z = (cab.row - 1) * rowSpacing;
      positions[cab.id] = [x, y, z];
    });

    return positions;
  }, [cabinets]);

  return {
    cabinets,
    selectedCabinet,
    cabinetPositions,
    setCabinets,
    selectCabinet,
  };
}

/**
 * 综合3D场景Hook
 * 合并所有相关状态和方法
 */
export function useDatacenterScene() {
  const selection = useSceneSelection();
  const view = useSceneView();
  const rotation = useSceneRotation();
  const devices = useDevices();
  const cabinets = useCabinets();

  // 便捷方法:聚焦到机柜
  const focusOnCabinet = useCallback(
    (cabinetId: string) => {
      const position = cabinets.cabinetPositions[cabinetId];
      if (position) {
        view.setCameraTarget(position);
      }
    },
    [cabinets.cabinetPositions, view.setCameraTarget],
  );

  return {
    ...selection,
    ...view,
    ...rotation,
    devices: devices.devices,
    cabinets: cabinets.cabinets,
    cabinetPositions: cabinets.cabinetPositions,
    setDevices: devices.setDevices,
    setCabinets: cabinets.setCabinets,
    getDeviceById: devices.getDeviceById,
    getDevicesByCabinet: devices.getDevicesByCabinet,
    focusOnCabinet,
  };
}

import { Html } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

// 温度颜色映射函数
const getTemperatureColor = (temp: number): string => {
  // 温度范围：15℃-35℃
  // 颜色渐变：蓝色(冷) -> 绿色(正常) -> 黄色(偏高) -> 红色(过热)
  if (temp <= 18) return '#3498db'; // 蓝色 - 过冷
  if (temp <= 22) return '#2ecc71'; // 绿色 - 正常偏冷
  if (temp <= 26) return '#27ae60'; // 深绿 - 正常
  if (temp <= 28) return '#f1c40f'; // 黄色 - 偏高
  if (temp <= 30) return '#e67e22'; // 橙色 - 较高
  return '#e74c3c'; // 红色 - 过热
};

// 温度到透明度映射
const getTemperatureOpacity = (temp: number): number => {
  // 温度越高，透明度越低（颜色越明显）
  if (temp <= 22) return 0.3;
  if (temp <= 26) return 0.4;
  if (temp <= 28) return 0.5;
  return 0.6;
};

interface CabinetTemperature {
  cabinetId: string;
  temperature: number;
  status: 'normal' | 'warning' | 'critical';
}

interface HeatmapBarProps {
  position: [number, number, number];
  temperature: number;
  cabinetHeight: number;
  visible: boolean;
}

// 单个机柜的热力条
const HeatmapBar: React.FC<HeatmapBarProps> = ({
  position,
  temperature,
  cabinetHeight,
  visible,
}) => {
  if (!visible) return null;

  const color = getTemperatureColor(temperature);
  const opacity = getTemperatureOpacity(temperature);
  const barHeight = 0.1; // 热力条高度

  return (
    <group position={position}>
      {/* 热力条 - 机柜顶部 */}
      <mesh position={[0, cabinetHeight / 2 + barHeight / 2, 0]}>
        <boxGeometry args={[0.6, barHeight, 0.6]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 温度显示 */}
      <Html
        position={[0, cabinetHeight / 2 + 0.15, 0]}
        center
        style={{
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: color,
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {temperature.toFixed(1)}℃
        </div>
      </Html>

      {/* 发光光柱效果（温度偏高时） */}
      {temperature > 26 && (
        <mesh position={[0, cabinetHeight / 4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, cabinetHeight / 2, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
};

interface HeatmapOverlayProps {
  cabinetPositions: Record<string, [number, number, number]>;
  cabinetTemperatures: CabinetTemperature[];
  cabinetHeights: Record<string, number>;
  visible: boolean;
}

// 温度热力图叠加层
export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  cabinetPositions,
  cabinetTemperatures,
  cabinetHeights,
  visible,
}) => {
  // 构建温度查找表
  const tempMap = useMemo(() => {
    const map: Record<string, number> = {};
    cabinetTemperatures.forEach((ct) => {
      map[ct.cabinetId] = ct.temperature;
    });
    return map;
  }, [cabinetTemperatures]);

  if (!visible) return null;

  return (
    <group>
      {Object.entries(cabinetPositions).map(([cabinetId, position]) => {
        const temperature = tempMap[cabinetId];
        if (temperature === undefined) return null;

        const height = cabinetHeights[cabinetId] || 1.87; // 默认42U高度

        return (
          <HeatmapBar
            key={cabinetId}
            position={position}
            temperature={temperature}
            cabinetHeight={height}
            visible={visible}
          />
        );
      })}
    </group>
  );
};

// 温度图例组件（用于2D UI）
export const HeatmapLegend: React.FC = () => {
  const legendItems = [
    { temp: '≤18℃', color: '#3498db', label: '过冷' },
    { temp: '19-22℃', color: '#2ecc71', label: '偏冷' },
    { temp: '23-26℃', color: '#27ae60', label: '正常' },
    { temp: '27-28℃', color: '#f1c40f', label: '偏高' },
    { temp: '29-30℃', color: '#e67e22', label: '较高' },
    { temp: '>30℃', color: '#e74c3c', label: '过热' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '8px',
        fontSize: '12px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>温度图例</div>
      {legendItems.map((item) => (
        <div
          key={item.temp}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '2px',
              background: item.color,
            }}
          />
          <span>{item.temp}</span>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default HeatmapOverlay;

import { Button, Card, Input, InputNumber, Select, Space, Tag } from 'antd';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EditablePortGroup } from './templateFormModel';
import {
  createDefaultPortGroup,
  createDefaultPortGroups,
  duplicatePortGroup,
  movePortGroup,
} from './templateFormModel';

const portTypeOptions: Array<{
  value: IDC.PortGroup['portType'];
  label: string;
}> = [
  { value: 'RJ45', label: 'RJ45 电口' },
  { value: 'SFP', label: 'SFP 光口' },
  { value: 'SFP+', label: 'SFP+ 万兆光口' },
  { value: 'QSFP+', label: 'QSFP+ 40G 光口' },
  { value: 'QSFP28', label: 'QSFP28 100G 光口' },
  { value: 'FC', label: 'FC 光纤通道' },
  { value: 'Console', label: 'Console 控制台' },
  { value: 'Power', label: '电源接口' },
];

const speedOptions: Array<{
  value: IDC.PortGroup['speed'];
  label: string;
}> = [
  { value: '100M', label: '100Mbps' },
  { value: '1G', label: '1Gbps' },
  { value: '10G', label: '10Gbps' },
  { value: '25G', label: '25Gbps' },
  { value: '40G', label: '40Gbps' },
  { value: '100G', label: '100Gbps' },
  { value: 'N/A', label: '不适用' },
];

interface PortGroupEditorProps {
  value: EditablePortGroup[];
  onChange: (value: EditablePortGroup[]) => void;
}

const PortGroupEditor: React.FC<PortGroupEditorProps> = ({
  value,
  onChange,
}) => {
  const [batchCount, setBatchCount] = useState(2);
  const totalPorts = useMemo(
    () => value.reduce((total, portGroup) => total + portGroup.count, 0),
    [value],
  );
  const updatePortGroup = <Key extends keyof EditablePortGroup>(
    index: number,
    field: Key,
    fieldValue: EditablePortGroup[Key],
  ) => {
    onChange(
      value.map((portGroup, currentIndex) =>
        currentIndex === index
          ? { ...portGroup, [field]: fieldValue }
          : portGroup,
      ),
    );
  };

  return (
    <Card
      title="端口配置"
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Space wrap>
          <Tag>
            {value.length} 组 / {totalPorts} 个端口
          </Tag>
          <InputNumber
            aria-label="批量新增端口组数量"
            min={1}
            max={16}
            value={batchCount}
            onChange={(nextValue) => setBatchCount(nextValue ?? 1)}
            style={{ width: 72 }}
          />
          <Button
            onClick={() =>
              onChange([...value, ...createDefaultPortGroups(batchCount)])
            }
          >
            批量添加
          </Button>
          <Button
            type="link"
            icon={<Plus size={14} />}
            onClick={() => onChange([...value, createDefaultPortGroup()])}
          >
            添加端口组
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {value.map((portGroup, index) => (
          <Space
            key={`${portGroup.portType}-${index}`}
            align="center"
            wrap
            style={{ width: '100%' }}
          >
            <Input
              aria-label={`第 ${index + 1} 个端口组名称`}
              placeholder="端口组名称"
              value={portGroup.name}
              style={{ width: 150 }}
              onChange={(event) =>
                updatePortGroup(index, 'name', event.target.value)
              }
            />
            <Select
              aria-label={`第 ${index + 1} 个端口组类型`}
              value={portGroup.portType}
              options={portTypeOptions}
              style={{ width: 150 }}
              onChange={(nextValue) =>
                updatePortGroup(index, 'portType', nextValue)
              }
            />
            <InputNumber
              aria-label={`第 ${index + 1} 个端口组数量`}
              value={portGroup.count}
              min={1}
              max={256}
              style={{ width: 88 }}
              onChange={(nextValue) =>
                updatePortGroup(index, 'count', nextValue ?? 1)
              }
            />
            <Select
              aria-label={`第 ${index + 1} 个端口组速率`}
              value={portGroup.speed}
              options={speedOptions}
              style={{ width: 120 }}
              onChange={(nextValue) =>
                updatePortGroup(index, 'speed', nextValue)
              }
            />
            <Button
              aria-label={`上移第 ${index + 1} 个端口组`}
              type="text"
              icon={<ArrowUp size={14} />}
              disabled={index === 0}
              onClick={() => onChange(movePortGroup(value, index, -1))}
            />
            <Button
              aria-label={`下移第 ${index + 1} 个端口组`}
              type="text"
              icon={<ArrowDown size={14} />}
              disabled={index === value.length - 1}
              onClick={() => onChange(movePortGroup(value, index, 1))}
            />
            <Button
              aria-label={`复制第 ${index + 1} 个端口组`}
              type="text"
              icon={<Copy size={14} />}
              onClick={() => onChange(duplicatePortGroup(value, index))}
            />
            <Button
              aria-label={`删除第 ${index + 1} 个端口组`}
              type="text"
              danger
              icon={<Trash2 size={14} />}
              disabled={value.length === 1}
              onClick={() =>
                onChange(
                  value.filter((_, currentIndex) => currentIndex !== index),
                )
              }
            >
              删除
            </Button>
          </Space>
        ))}
      </Space>
    </Card>
  );
};

export default PortGroupEditor;

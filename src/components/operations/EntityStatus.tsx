import { Badge, Tag, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { getStatusDefinition } from './operationsModel';

interface EntityStatusProps {
  status: string;
  label?: string;
  detail?: ReactNode;
  variant?: 'tag' | 'badge';
}

export function EntityStatus({
  status,
  label,
  detail,
  variant = 'tag',
}: EntityStatusProps) {
  const definition = getStatusDefinition(status, label);
  const content =
    variant === 'badge' ? (
      <Badge status={definition.tone} text={definition.label} />
    ) : (
      <Tag color={definition.tone}>{definition.label}</Tag>
    );

  return detail ? <Tooltip title={detail}>{content}</Tooltip> : content;
}

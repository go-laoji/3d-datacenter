import { Link } from '@umijs/max';
import type { ReactNode } from 'react';
import {
  buildEntityRoute,
  type EntityRouteContext,
  type EntityType,
} from './operationsModel';

interface EntityLinkProps {
  type: EntityType;
  id: string;
  context?: EntityRouteContext;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function EntityLink({
  type,
  id,
  context,
  children,
  className,
  ariaLabel,
}: EntityLinkProps) {
  return (
    <Link
      to={buildEntityRoute(type, id, context)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

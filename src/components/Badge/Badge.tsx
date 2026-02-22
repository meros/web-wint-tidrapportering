import type { HTMLAttributes } from 'react';
import './Badge.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'locked';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'accent';
  header?: ReactNode;
  children: ReactNode;
}

export function Card({ variant = 'default', header, children, className = '', ...props }: CardProps) {
  const variantClass = variant !== 'default' ? `card--${variant}` : '';
  return (
    <div className={`card ${variantClass} ${className}`.trim()} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
}

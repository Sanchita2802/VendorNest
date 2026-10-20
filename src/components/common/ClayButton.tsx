import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  let variantClass = 'clay-btn-primary';
  if (variant === 'secondary') variantClass = 'clay-btn-secondary';
  if (variant === 'danger') variantClass = 'clay-btn-danger';
  if (variant === 'ghost') {
    variantClass = 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] shadow-none border-none';
  }

  let sizeClass = 'px-5 py-2.5 text-sm';
  if (size === 'sm') sizeClass = 'px-3.5 py-1.5 text-xs';
  if (size === 'lg') sizeClass = 'px-7 py-3.5 text-base';

  return (
    <button
      disabled={disabled || loading}
      className={`clay-btn ${variantClass} ${sizeClass} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

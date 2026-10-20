import React from 'react';

export type ChipVariant =
  | 'primary'
  | 'secondary'
  | 'mint'
  | 'peach'
  | 'sky'
  | 'yellow'
  | 'rose'
  | 'delivered'
  | 'pending'
  | 'error'
  | 'derived';

interface ClayChipProps {
  label: React.ReactNode;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ClayChip: React.FC<ClayChipProps> = ({
  label,
  variant = 'secondary',
  icon,
  className = '',
  onClick,
}) => {
  let styleClasses = 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]';

  switch (variant) {
    case 'primary':
      styleClasses = 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30';
      break;
    case 'mint':
      styleClasses = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      break;
    case 'peach':
      styleClasses = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
      break;
    case 'sky':
      styleClasses = 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30';
      break;
    case 'rose':
      styleClasses = 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30';
      break;
    case 'delivered':
      styleClasses = 'bg-[#7BE0A8]/30 text-[#0B4628] dark:text-[#A8F0C6] dark:bg-[#143C28] border border-[#7BE0A8]/50';
      break;
    case 'pending':
      styleClasses = 'bg-[#FFD97A]/40 text-[#614700] dark:text-[#FFE699] dark:bg-[#4B3C13] border border-[#FFD97A]/60';
      break;
    case 'error':
      styleClasses = 'bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-500/40';
      break;
    case 'derived':
      styleClasses = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-dashed border-indigo-400/50';
      break;
    default:
      styleClasses = 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]';
  }

  return (
    <span
      onClick={onClick}
      className={`clay-chip font-heading text-xs select-none ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${styleClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

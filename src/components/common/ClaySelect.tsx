import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface ClaySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helper?: string;
}

export const ClaySelect = React.forwardRef<HTMLSelectElement, ClaySelectProps>(
  ({ label, options, error, helper, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`clay-input appearance-none w-full text-sm cursor-pointer pr-10 ${
              error ? 'border-rose-400 focus:border-rose-500' : ''
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--surface-elevated)] text-[var(--text-primary)]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 pointer-events-none" />
        </div>
        {error ? (
          <p className="text-xs text-rose-500 flex items-center gap-1 pl-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helper ? (
          <p className="text-[11px] text-[var(--text-muted)] pl-1 leading-tight">{helper}</p>
        ) : null}
      </div>
    );
  }
);

ClaySelect.displayName = 'ClaySelect';

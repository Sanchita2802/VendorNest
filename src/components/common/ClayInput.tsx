import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  rightElement?: React.ReactNode;
}

export const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  ({ label, error, helper, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            className={`clay-input w-full text-sm placeholder:text-[var(--text-muted)]/60 ${
              error ? 'border-rose-400 focus:border-rose-500' : ''
            } ${rightElement ? 'pr-12' : ''} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
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

ClayInput.displayName = 'ClayInput';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface ConceptTooltipProps {
  concept: string;
  explanation: string;
  rule?: string;
  className?: string;
}

export const ConceptTooltip: React.FC<ConceptTooltipProps> = ({
  concept,
  explanation,
  rule,
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--accent-primary)] hover:text-white text-[var(--text-muted)] flex items-center justify-center transition-all duration-150 cursor-help"
        aria-label={`DBMS Concept: ${concept}`}
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-[var(--surface-elevated)] text-[var(--text-primary)] text-xs shadow-2xl border border-[var(--accent-primary)]/20 z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.2), inset 1px 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          <span className="block font-heading font-semibold text-[var(--accent-primary)] text-xs mb-1">
            DBMS Concept: {concept}
          </span>
          <span className="block text-[var(--text-secondary)] leading-relaxed">
            {explanation}
          </span>
          {rule && (
            <span className="block mt-1.5 pt-1.5 border-t border-[var(--text-muted)]/20 text-[10px] text-[var(--text-muted)] font-mono">
              Enforced Rule: {rule}
            </span>
          )}
        </span>
      )}
    </span>
  );
};

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ClayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const ClayDrawer: React.FC<ClayDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let widthClass = 'max-w-md';
  if (width === 'lg') widthClass = 'max-w-xl';
  if (width === 'xl') widthClass = 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={`pointer-events-auto w-screen ${widthClass} clay-card-elevated h-full flex flex-col p-6 sm:p-8 rounded-none sm:rounded-l-[36px] border-y-0 border-r-0 shadow-2xl transition-transform duration-300 animate-in slide-in-from-right`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--text-muted)]/15 shrink-0">
            <div>
              <h3 className="font-heading font-semibold text-xl text-[var(--text-primary)]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] flex items-center justify-center transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Search, Building2, Package, ShoppingCart, CreditCard, Network, Home, LayoutDashboard, Plus, CornerDownLeft } from 'lucide-react';
import { db } from '../../db/db';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onOpenModal?: (action: 'add-vendor' | 'add-product' | 'add-order' | 'add-payment') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenModal,
}) => {
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setVendors(
        db.getVendors().map((v) => ({
          id: v.VendorID,
          name: v.VendorName,
          category: v.Category,
        }))
      );
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const navigationCommands = [
    { label: 'Home (3D Modular Nest)', page: 'home', icon: <Home className="w-4 h-4 text-indigo-500" /> },
    { label: 'Dashboard & Analytics', page: 'dashboard', icon: <LayoutDashboard className="w-4 h-4 text-blue-500" /> },
    { label: 'Vendor Management', page: 'vendors', icon: <Building2 className="w-4 h-4 text-emerald-500" /> },
    { label: 'Product & Service Catalog', page: 'products', icon: <Package className="w-4 h-4 text-amber-500" /> },
    { label: 'Purchase Orders', page: 'orders', icon: <ShoppingCart className="w-4 h-4 text-rose-500" /> },
    { label: 'Payment Monitoring', page: 'payments', icon: <CreditCard className="w-4 h-4 text-violet-500" /> },
    { label: 'Search & AI Query', page: 'search', icon: <Search className="w-4 h-4 text-sky-500" /> },
    { label: 'Schema Explorer & ER Diagram', page: 'schema', icon: <Network className="w-4 h-4 text-teal-500" /> },
  ].filter((cmd) => cmd.label.toLowerCase().includes(q));

  const actionCommands = [
    { label: 'Add New Vendor', action: 'add-vendor' as const, icon: <Plus className="w-4 h-4 text-emerald-500" /> },
    { label: 'Add New Product / Service', action: 'add-product' as const, icon: <Plus className="w-4 h-4 text-amber-500" /> },
    { label: 'Create Purchase Order', action: 'add-order' as const, icon: <Plus className="w-4 h-4 text-rose-500" /> },
    { label: 'Record Vendor Payment', action: 'add-payment' as const, icon: <Plus className="w-4 h-4 text-violet-500" /> },
  ].filter((act) => act.label.toLowerCase().includes(q));

  const matchedVendors = vendors.filter(
    (v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center pt-20 px-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/45 backdrop-blur-sm" />

      <div className="relative w-full max-w-xl clay-card-elevated p-4 sm:p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95">
        <div className="relative flex items-center mb-4">
          <Search className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or vendor name..."
            className="clay-input pl-11 pr-4 py-3 w-full text-sm font-sans"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
          {actionCommands.length > 0 && (
            <div>
              <div className="text-[11px] font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1.5">
                Quick Actions
              </div>
              <div className="space-y-1">
                {actionCommands.map((act) => (
                  <button
                    key={act.action}
                    onClick={() => {
                      if (onOpenModal) onOpenModal(act.action);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 text-xs font-heading font-medium text-[var(--text-primary)]">
                      {act.icon}
                      <span>{act.label}</span>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {navigationCommands.length > 0 && (
            <div>
              <div className="text-[11px] font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1.5">
                Modules & Navigation
              </div>
              <div className="space-y-1">
                {navigationCommands.map((nav) => (
                  <button
                    key={nav.page}
                    onClick={() => {
                      onNavigate(nav.page);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 text-xs font-heading font-medium text-[var(--text-primary)]">
                      {nav.icon}
                      <span>{nav.label}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Jump</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedVendors.length > 0 && q.length > 0 && (
            <div>
              <div className="text-[11px] font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1.5">
                Matching Vendors ({matchedVendors.length})
              </div>
              <div className="space-y-1">
                {matchedVendors.slice(0, 5).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onNavigate('vendors');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold">{v.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                        {v.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--accent-primary)]">{v.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {actionCommands.length === 0 && navigationCommands.length === 0 && matchedVendors.length === 0 && (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              No matching commands or records found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Building2, Package, ShoppingCart, CreditCard, Search, ArrowRight } from 'lucide-react';

interface StaticNestIllustrationProps {
  onSelectModule: (module: string) => void;
}

export const StaticNestIllustration: React.FC<StaticNestIllustrationProps> = ({
  onSelectModule,
}) => {
  const units = [
    {
      id: 'vendors',
      name: 'Vendor Management',
      subtitle: 'Decomposed 3NF Contacts & Pincodes',
      icon: <Building2 className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'Module 1',
    },
    {
      id: 'products',
      name: 'Product & Service Catalog',
      subtitle: 'Disjoint Specialization (Goods & Services)',
      icon: <Package className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-500/10 border-amber-500/30',
      badge: 'Module 2',
    },
    {
      id: 'orders',
      name: 'Purchase Orders',
      subtitle: 'Line Items M:N & Derived TotalCost',
      icon: <ShoppingCart className="w-6 h-6 text-rose-500" />,
      bg: 'bg-rose-500/10 border-rose-500/30',
      badge: 'Module 3',
    },
    {
      id: 'payments',
      name: 'Payment Monitoring',
      subtitle: 'Weak Entity Installment Tracking',
      icon: <CreditCard className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-500/10 border-blue-500/30',
      badge: 'Module 4',
    },
    {
      id: 'search',
      name: 'Query & Retrieval',
      subtitle: 'LIKE Matching & Gemini AI Query Parsing',
      icon: <Search className="w-6 h-6 text-indigo-500" />,
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      badge: 'Module 5',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="clay-card-elevated p-6 sm:p-8 relative overflow-hidden">
        <div className="text-center max-w-lg mx-auto mb-8">
          <span className="clay-chip bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] mb-2 inline-flex">
            Modular Nest Architecture
          </span>
          <h3 className="font-heading font-bold text-2xl text-[var(--text-primary)]">
            5 Interlocking Relational Modules
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Click any module below to inspect its relational schema and live records
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectModule(u.id)}
              className={`p-5 rounded-3xl border ${u.bg} cursor-pointer hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between group shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-[var(--surface-elevated)] shadow-md">
                    {u.icon}
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {u.badge}
                  </span>
                </div>
                <h4 className="font-heading font-semibold text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {u.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {u.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs font-heading font-medium text-[var(--accent-primary)]">
                <span>Enter Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  Building2,
  Package,
  ShoppingCart,
  CreditCard,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { ClayButton } from '../components/common/ClayButton';
import { ClayCard } from '../components/common/ClayCard';
import { ClayChip } from '../components/common/ClayChip';
import { NestBuildingScene } from '../components/3d/NestBuildingScene';
import { StaticNestIllustration } from '../components/3d/StaticNestIllustration';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../db/db';

interface HomeProps {
  onNavigate: (page: string) => void;
  onOpenAbout: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenAbout }) => {
  const { quality3D, reducedMotion } = useTheme();
  const nestSectionRef = useRef<HTMLDivElement>(null);

  // Live stats count-up state
  const [stats, setStats] = useState({
    vendors: 0,
    products: 0,
    openOrders: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const raw = db.getRawData();
    const targetVendors = raw.VENDOR.length;
    const targetProducts = raw.PRODUCT.length;
    const targetOrders = raw.PURCHASE_ORDER.filter((o) => o.Status === 'Pending').length;
    const targetPayments = raw.PAYMENT.filter((p) => p.Status === 'Pending').length;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = Math.min(step / 20, 1);
      setStats({
        vendors: Math.round(targetVendors * progress),
        products: Math.round(targetProducts * progress),
        openOrders: Math.round(targetOrders * progress),
        pendingPayments: Math.round(targetPayments * progress),
      });
      if (progress >= 1) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const scrollToNest = () => {
    if (nestSectionRef.current) {
      nestSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const objectives = [
    {
      id: 'vendors',
      title: 'Centralized Vendor Details',
      desc: 'Normalized repository eliminating manual sheets and duplicate records.',
      icon: <Building2 className="w-5 h-5 text-emerald-500" />,
      tag: 'Objective 1',
    },
    {
      id: 'products',
      title: 'Product & Pricing Catalog',
      desc: 'Maintain pricing and goods/service specialization for all vendor offerings.',
      icon: <Package className="w-5 h-5 text-amber-500" />,
      tag: 'Objective 2',
    },
    {
      id: 'orders',
      title: 'Purchase Order Tracking',
      desc: 'Automate order workflows with line items and derived total calculations.',
      icon: <ShoppingCart className="w-5 h-5 text-rose-500" />,
      tag: 'Objective 3',
    },
    {
      id: 'payments',
      title: 'Payment & Installment Monitoring',
      desc: 'Track disbursements, outstanding dues and weak-entity installment milestones.',
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      tag: 'Objective 4',
    },
    {
      id: 'search',
      title: 'Instant Query & Retrieval',
      desc: 'Fast SQL pattern matching and natural-language Gemini query translation.',
      icon: <Search className="w-5 h-5 text-indigo-500" />,
      tag: 'Objective 5',
    },
  ];

  const show3D = quality3D !== 'off' && !reducedMotion;

  return (
    <div className="space-y-20 pb-12">
      {/* a) HERO SECTION */}
      <section className="relative pt-10 sm:pt-16 pb-12 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/30 shadow-md mb-6 animate-in fade-in duration-300">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-heading font-semibold text-xs text-[var(--accent-primary)]">
              DBMS Mini Project • 3NF In-Browser Relational Engine
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl text-[var(--text-primary)] tracking-tight leading-[1.08] mb-6">
            Every vendor, order and payment —{' '}
            <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-mint)] to-[var(--accent-sky)] bg-clip-text text-transparent">
              in one place.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            VendorNest replaces fragmented spreadsheets with an elegant, centralized 10-table
            relational database. Experience 3NF normalization, real-time constraint enforcement,
            and interactive 3D architecture.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <ClayButton
              size="lg"
              variant="primary"
              onClick={scrollToNest}
              icon={<Layers className="w-5 h-5" />}
              className="text-base font-semibold"
            >
              Enter the Nest
            </ClayButton>

            <ClayButton
              size="lg"
              variant="secondary"
              onClick={() => onNavigate('dashboard')}
              icon={<ArrowRight className="w-5 h-5" />}
              className="text-base font-semibold"
            >
              Open Dashboard
            </ClayButton>
          </div>
        </div>
      </section>

      {/* e) LIVE STATS STRIP WITH ANIMATED COUNT-UP */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="clay-card-elevated p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-[var(--text-muted)]/15">
            <div className="pt-3 sm:pt-0">
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Total Vendors
              </span>
              <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[var(--accent-primary)]">
                {stats.vendors}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                Nashik, Pune, Mumbai, Nagpur
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Active Catalog Items
              </span>
              <span className="font-heading font-extrabold text-3xl sm:text-4xl text-emerald-500">
                {stats.products}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                Goods (HSN) & Services (Hours)
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Pending Purchase Orders
              </span>
              <span className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-500">
                {stats.openOrders}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                Awaiting delivery confirmation
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Pending Payments
              </span>
              <span className="font-heading font-extrabold text-3xl sm:text-4xl text-rose-500">
                {stats.pendingPayments}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                Scheduled installment milestones
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* b) PROBLEM STATEMENT SECTION */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="clay-card p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="p-4 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                  Academic Focus & Motivation
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-muted)] font-mono">DBMS Mini Project</span>
              </div>

              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
                Problem Statement
              </h2>

              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed italic border-l-4 border-amber-400 pl-4 py-1">
                &ldquo;To develop a system for Vendor Management that automates vendor record keeping,
                purchase order tracking, and payment monitoring, replacing error-prone manual
                processes with a centralized database to eliminate data redundancy, enable faster
                procurement decisions, and improve overall vendor management efficiency.&rdquo;
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <ClayChip label="Zero Data Redundancy" variant="mint" />
                <ClayChip label="Transitive Dependency Removal (3NF)" variant="primary" />
                <ClayChip label="Strict Foreign Key Referential Actions" variant="rose" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* d) "THE MODULAR NEST" — 3D INTERACTIVE BUILDING / STATIC FALLBACK */}
      <section ref={nestSectionRef} className="max-w-6xl mx-auto px-4 w-full">
        <div className="text-center mb-6">
          <ClayChip label="Architecture Experience" variant="primary" className="mb-2" />
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)]">
            The Modular Nest
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-xl mx-auto">
            Inspired by modular architecture: each physical unit represents an interlocking
            database module. Click or drag to inspect the structural hierarchy.
          </p>
        </div>

        <div className="clay-card-elevated p-0 overflow-hidden rounded-[36px] border border-[var(--text-muted)]/15 shadow-2xl relative w-full">
          {show3D ? (
            <div className="relative w-full h-[100svh] min-h-[520px] md:h-[100vh] md:min-h-[560px]">
              <NestBuildingScene onSelectModule={(m) => onNavigate(m)} />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-[var(--text-muted)] pointer-events-none z-10">
                <span className="bg-[var(--surface-elevated)]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-[var(--text-muted)]/15">
                  💡 Drag to rotate camera • Click any unit to open module
                </span>
                <button
                  onClick={() => onNavigate('schema')}
                  className="pointer-events-auto bg-[var(--surface-elevated)]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm hover:text-[var(--accent-primary)] font-heading font-medium border border-[var(--text-muted)]/15 transition-colors"
                >
                  View 10-Table ER Diagram →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <StaticNestIllustration onSelectModule={(m) => onNavigate(m)} />
            </div>
          )}
        </div>
      </section>

      {/* c) THE 5 OBJECTIVES AS CLAY CARDS */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <ClayChip label="Scope & Deliverables" variant="sky" className="mb-2" />
          <h2 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
            5 Core System Objectives
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl mx-auto">
            Click any objective card below to directly open and test its implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {objectives.map((obj, i) => (
            <ClayCard
              key={obj.id}
              onClick={() => onNavigate(obj.id)}
              className="cursor-pointer hover:-translate-y-1.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-[var(--surface-elevated)] shadow-md">
                    {obj.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--accent-primary)]">
                    {obj.tag}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {obj.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {obj.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs font-heading font-semibold text-[var(--accent-primary)]">
                <span>Explore Module</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </ClayCard>
          ))}

          {/* 6th Card: Schema Explorer */}
          <ClayCard
            onClick={() => onNavigate('schema')}
            className="cursor-pointer hover:-translate-y-1.5 transition-all flex flex-col justify-between group bg-gradient-to-br from-[var(--surface)] to-[var(--accent-primary)]/5"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-[var(--surface-elevated)] shadow-md text-[var(--accent-primary)]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                  DBMS Architecture
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Schema Explorer & ER Diagram
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                Inspect all 10 tables, composite primary keys, disjoint specialization, weak entities,
                and run SQL queries safely.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs font-heading font-semibold text-[var(--accent-primary)]">
              <span>Inspect ER Diagram</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </ClayCard>
        </div>
      </section>

      {/* STUDENT PROFILE HIGHLIGHT BANNER */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="clay-card-elevated p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              Candidate Information
            </span>
            <h4 className="font-heading font-bold text-xl text-[var(--text-primary)]">
              Sanchita P. Misar
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Class: <span className="font-semibold text-[var(--text-primary)]">TY-A</span> | Roll No:{' '}
              <span className="font-semibold text-[var(--text-primary)]">46</span> | K.K. Wagh
              Institute of Engineering Education & Research, Nashik
            </p>
          </div>

          <ClayButton
            variant="secondary"
            onClick={onOpenAbout}
            className="text-xs shrink-0"
          >
            View Project Objectives & Report
          </ClayButton>
        </div>
      </section>
    </div>
  );
};

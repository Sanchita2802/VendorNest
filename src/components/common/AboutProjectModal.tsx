import React from 'react';
import { GraduationCap, Award, BookOpen, Target, ArrowRight, Database } from 'lucide-react';
import { ClayModal } from './ClayModal';
import { ClayChip } from './ClayChip';

interface AboutProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule: (module: string) => void;
}

export const AboutProjectModal: React.FC<AboutProjectModalProps> = ({
  isOpen,
  onClose,
  onNavigateModule,
}) => {
  const objectives = [
    {
      id: 'vendors',
      num: '01',
      title: 'Centralized Vendor Registry',
      desc: 'Design a centralized database for storing and managing vendor details in 3NF.',
      module: 'vendors',
      tag: 'Module 1',
    },
    {
      id: 'products',
      num: '02',
      title: 'Product & Service Catalog',
      desc: 'Maintain records of products and services supplied by vendors along with pricing.',
      module: 'products',
      tag: 'Module 2',
    },
    {
      id: 'orders',
      num: '03',
      title: 'Purchase Order Tracking',
      desc: 'Track purchase orders placed with vendors and monitor their fulfillment status.',
      module: 'orders',
      tag: 'Module 3',
    },
    {
      id: 'payments',
      num: '04',
      title: 'Payment & Installment Monitoring',
      desc: 'Record and monitor payment details and weak-entity installments against each vendor.',
      module: 'payments',
      tag: 'Module 4',
    },
    {
      id: 'search',
      num: '05',
      title: 'Quick Search & Retrieval',
      desc: 'Enable instantaneous search of vendor records and purchases with SQL and AI translation.',
      module: 'search',
      tag: 'Module 5',
    },
  ];

  return (
    <ClayModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-emerald-500" />
          <span>DBMS Mini Project Dossier</span>
        </div>
      }
      subtitle="Academic Project Submission & Relational Specifications"
      maxWidth="xl"
    >
      <div className="space-y-6 pt-1">
        {/* Student Credential Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[var(--accent-primary)]/10 via-[var(--surface-sunken)] to-[var(--accent-mint)]/10 border border-[var(--accent-primary)]/20 shadow-inner">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)] block mb-1">
                Student & Institution Profile
              </span>
              <h4 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                Sanchita P. Misar
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                Class: <span className="font-bold text-[var(--text-primary)]">TY-A</span> | Roll No:{' '}
                <span className="font-bold text-[var(--text-primary)]">46</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                K.K. Wagh Institute of Engineering Education & Research, Nashik
              </p>
            </div>
            <div className="flex flex-col items-end">
              <ClayChip label="Topic: Vendor Management System" variant="primary" />
              <span className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                Database Management Systems (DBMS)
              </span>
            </div>
          </div>
        </div>

        {/* Problem Statement Card */}
        <div className="p-5 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h5 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Problem Statement
            </h5>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
            &ldquo;To develop a system for Vendor Management that automates vendor record keeping,
            purchase order tracking, and payment monitoring, replacing error-prone manual processes
            with a centralized database to eliminate data redundancy, enable faster procurement
            decisions, and improve overall vendor management efficiency.&rdquo;
          </p>
        </div>

        {/* 5 Objectives Interactive Clay Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <h5 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Project Objectives (Interactive Modules)
              </h5>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">5 Objectives</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                onClick={() => {
                  onNavigateModule(obj.module);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--text-muted)]/15 hover:border-[var(--accent-primary)]/40 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
                      {obj.num}
                    </span>
                    <span className="text-[10px] font-heading font-bold text-[var(--text-muted)]">
                      {obj.tag}
                    </span>
                  </div>
                  <h6 className="font-heading font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {obj.title}
                  </h6>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                    {obj.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--text-muted)]/10 flex items-center justify-between text-[11px] font-heading text-[var(--accent-primary)] font-medium">
                  <span>Open module</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DBMS Architecture Highlights */}
        <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--text-muted)]/15 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Relational Specs: 10 Tables • 3NF Normalization • Composite PKs • Disjoint Specialization • Weak Entity</span>
          </div>
          <button
            onClick={() => {
              onNavigateModule('schema');
              onClose();
            }}
            className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline"
          >
            Inspect Schema Diagram →
          </button>
        </div>
      </div>
    </ClayModal>
  );
};

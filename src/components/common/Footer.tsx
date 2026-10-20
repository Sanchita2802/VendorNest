import React from 'react';
import { Database, GraduationCap, Github, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAbout }) => {
  return (
    <footer className="mt-20 border-t border-[var(--text-muted)]/15 pt-12 pb-24 md:pb-12 bg-[var(--surface-sunken)]/60 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-mint)] flex items-center justify-center text-white font-heading font-bold text-sm shadow-md">
                VN
              </div>
              <span className="font-heading font-bold text-base text-[var(--text-primary)]">
                VendorNest
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              A comprehensive relational Vendor Management System (VMS) built as a DBMS Mini Project.
              Featuring an in-browser 3NF relational database engine, live SQL terminal logging, and Gemini AI procurement tooling.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>10 Tables • 3NF Normalized • In-Browser ACID Store</span>
            </div>
          </div>

          {/* Student & College Credentials */}
          <div className="space-y-2.5 p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--text-muted)]/15 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <GraduationCap className="w-4 h-4" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider">
                Academic Project Credits
              </span>
            </div>
            <div className="text-xs space-y-1 text-[var(--text-primary)]">
              <p className="font-heading font-semibold text-sm">Sanchita P. Misar</p>
              <p className="text-[var(--text-secondary)]">Class: <span className="font-medium text-[var(--text-primary)]">TY-A</span> | Roll No: <span className="font-medium text-[var(--text-primary)]">46</span></p>
              <p className="text-[var(--text-secondary)]">Topic: <span className="font-medium text-[var(--text-primary)]">Vendor Management System</span></p>
              <p className="text-[var(--text-muted)] text-[11px] pt-1">
                K.K. Wagh Institute of Engineering Education & Research, Nashik
              </p>
            </div>
            <button
              onClick={onOpenAbout}
              className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline block pt-1"
            >
              View Full Project Dossier & Objectives →
            </button>
          </div>

          {/* Quick Links & Modules */}
          <div>
            <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
              System Modules
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('vendors')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                1. Vendor Registry
              </button>
              <button
                onClick={() => onNavigate('products')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                2. Product Catalog
              </button>
              <button
                onClick={() => onNavigate('orders')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                3. Purchase Orders
              </button>
              <button
                onClick={() => onNavigate('payments')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                4. Payment Tracker
              </button>
              <button
                onClick={() => onNavigate('search')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                5. Search & Retrieval
              </button>
              <button
                onClick={() => onNavigate('schema')}
                className="text-left text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                Schema & ER Diagram
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--text-muted)]/15 flex items-center justify-between flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
          <p>© 2026 VendorNest — K.K. Wagh Institute of Engineering Education & Research, Nashik</p>
          <div className="flex items-center gap-1">
            <span>Built with React, TypeScript, Three.js & Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

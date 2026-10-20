import React, { useState } from 'react';
import {
  Home,
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  CreditCard,
  Search,
  Network,
  Sun,
  Moon,
  Terminal,
  Settings,
  Command,
  MoreHorizontal,
  GraduationCap,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onToggleSql: () => void;
  isSqlOpen: boolean;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onToggleSql,
  isSqlOpen,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenAbout,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'vendors', label: 'Vendors', icon: <Building2 className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'schema', label: 'Schema (ER)', icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop & Tablet Floating Clay Pill Navbar */}
      <header className="fixed top-4 left-0 right-0 z-[700] px-4 pointer-events-none hidden md:block">
        <nav
          aria-label="Main Navigation"
          className="max-w-6xl mx-auto clay-pill p-2 px-3 sm:px-4 flex items-center justify-between pointer-events-auto backdrop-blur-md border border-[var(--text-muted)]/15 shadow-xl transition-all"
        >
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer pr-3 pl-1 select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-mint)] flex items-center justify-center text-white font-heading font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              VN
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm tracking-tight text-[var(--text-primary)] leading-none">
                VendorNest
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono leading-none mt-0.5">
                3NF DBMS
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-medium flex items-center gap-1.5 transition-all select-none ${
                    isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Tools & Toggles */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--text-muted)]/15">
            {/* Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1 text-xs"
              title="Command Palette (Ctrl+K)"
              aria-label="Open command palette"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono opacity-80 hidden lg:inline">⌘K</span>
            </button>

            {/* SQL Terminal Toggle */}
            <button
              onClick={onToggleSql}
              className={`p-2 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                isSqlOpen
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)]'
              }`}
              title="Toggle SQL Terminal"
              aria-label="Toggle SQL terminal drawer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden xl:inline">SQL</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-all"
              title="Toggle theme"
              aria-label="Toggle color theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 animate-in spin-in-180" />
              )}
            </button>

            {/* Student Info / About */}
            <button
              onClick={onOpenAbout}
              className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-all"
              title="Project & Student Info"
              aria-label="About project"
            >
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-all"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Top Header (Compact) */}
      <div className="fixed top-2 left-2 right-2 z-[700] md:hidden">
        <div className="clay-pill px-4 py-2 flex items-center justify-between border border-[var(--text-muted)]/15 shadow-lg backdrop-blur-md">
          <div onClick={() => onNavigate('home')} className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-mint)] flex items-center justify-center text-white font-heading font-bold text-xs shadow-md">
              VN
            </div>
            <span className="font-heading font-bold text-sm text-[var(--text-primary)]">
              VendorNest
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleSql}
              className={`p-1.5 rounded-full text-xs font-mono font-bold ${
                isSqlOpen ? 'bg-indigo-600 text-white' : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
              }`}
              title="SQL Terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)]"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)]"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-2 left-2 right-2 z-[700] md:hidden clay-pill py-2 px-3 border border-[var(--text-muted)]/15 shadow-xl backdrop-blur-md flex items-center justify-around"
      >
        {[
          { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
          { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'vendors', label: 'Vendors', icon: <Building2 className="w-4 h-4" /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
          { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl text-[10px] font-heading font-medium transition-all ${
                isActive
                  ? 'text-[var(--accent-primary)] font-bold scale-105'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile "More" Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1100] md:hidden">
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="fixed bottom-0 left-0 right-0 clay-card-elevated rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
            <h4 className="font-heading font-semibold text-base text-[var(--text-primary)] mb-4">
              All Modules & Tools
            </h4>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-heading font-medium text-left ${
                    activePage === link.id
                      ? 'bg-[var(--accent-primary)] text-white shadow-md'
                      : 'bg-[var(--surface-sunken)] text-[var(--text-primary)]'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-[var(--text-muted)]/15">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAbout();
                }}
                className="flex-1 p-2.5 rounded-2xl bg-[var(--surface-sunken)] text-xs font-heading font-medium flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>Project Info</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="flex-1 p-2.5 rounded-2xl bg-[var(--surface-sunken)] text-xs font-heading font-medium flex items-center justify-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './theme/ThemeContext';
import { ToastProvider } from './components/common/ClayToast';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SqlTerminalDrawer } from './components/common/SqlTerminalDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { SettingsModal } from './components/common/SettingsModal';
import { AboutProjectModal } from './components/common/AboutProjectModal';
import { AskVendorNestBubble } from './components/common/AskVendorNestBubble';

// Pages
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { VendorsPage } from './pages/VendorsPage';
import { ProductsPage } from './pages/ProductsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SearchPage } from './pages/SearchPage';
import { SchemaExplorerPage } from './pages/SchemaExplorerPage';

export function AppContent() {
  const [activePage, setActivePage] = useState<string>('home');
  const [isSqlOpen, setIsSqlOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  // Keyboard shortcut listener: Ctrl+K / Cmd+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // '/' to focus search when not in input
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        setActivePage('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommandAction = (action: 'add-vendor' | 'add-product' | 'add-order' | 'add-payment') => {
    if (action === 'add-vendor') setActivePage('vendors');
    if (action === 'add-product') setActivePage('products');
    if (action === 'add-order') setActivePage('orders');
    if (action === 'add-payment') setActivePage('payments');
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-24 transition-colors duration-300">
      {/* Floating Navbar */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onToggleSql={() => setIsSqlOpen(!isSqlOpen)}
        isSqlOpen={isSqlOpen}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full animate-in fade-in duration-200">
        {activePage === 'home' && (
          <Home onNavigate={handleNavigate} onOpenAbout={() => setAboutOpen(true)} />
        )}
        {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {activePage === 'vendors' && <VendorsPage />}
        {activePage === 'products' && <ProductsPage />}
        {activePage === 'orders' && <PurchaseOrdersPage />}
        {activePage === 'payments' && <PaymentsPage />}
        {activePage === 'search' && <SearchPage />}
        {activePage === 'schema' && <SchemaExplorerPage />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} onOpenAbout={() => setAboutOpen(true)} />

      {/* Persistent Floating SQL Terminal Drawer */}
      <SqlTerminalDrawer isOpen={isSqlOpen} onToggle={() => setIsSqlOpen(!isSqlOpen)} />

      {/* Ask VendorNest Floating AI QA Bubble */}
      <AskVendorNestBubble />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenModal={handleCommandAction}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Project & Student Credentials Modal */}
      <AboutProjectModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onNavigateModule={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

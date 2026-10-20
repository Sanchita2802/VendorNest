import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Building2,
  ShoppingCart,
  CreditCard,
  Package,
  Terminal,
  ArrowRight,
  Filter,
  History,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayChip } from '../components/common/ClayChip';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { queryAiSearch, AiSearchResult } from '../services/ai';
import { VendorWithDetails, PurchaseOrderWithDetails } from '../types/database';
import { useToast } from '../components/common/ClayToast';
import { useTheme } from '../theme/ThemeContext';

export const SearchPage: React.FC<{ onNavigateToVendor?: (id: string) => void }> = () => {
  const { aiEnabled } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'vendors' | 'purchases'>('vendors');
  const [searchMode, setSearchMode] = useState<'normal' | 'ai'>('normal');
  const [query, setQuery] = useState('');
  const [normalScope, setNormalScope] = useState<'both' | 'name' | 'category'>('both');

  // Search Results
  const [vendorResults, setVendorResults] = useState<VendorWithDetails[]>([]);
  const [orderResults, setOrderResults] = useState<PurchaseOrderWithDetails[]>([]);

  // Generated/Equivalent SQL
  const [displayedSql, setDisplayedSql] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Recent searches saved in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vendornest_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Electronics', 'Metro', 'Pune', 'Pending'];
  });

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('vendornest_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Perform Normal Search
  useEffect(() => {
    if (searchMode === 'normal') {
      const allVendors = db.getVendors();
      const allOrders = db.getPurchaseOrders();
      const q = query.trim().toLowerCase();

      if (!q) {
        setVendorResults(allVendors);
        setOrderResults(allOrders);
        setDisplayedSql(`SELECT * FROM VENDOR JOIN PINCODE_CITY USING (Pincode);`);
        setAiExplanation(null);
        return;
      }

      if (activeTab === 'vendors') {
        const matches = allVendors.filter((v) => {
          if (normalScope === 'name') return v.VendorName.toLowerCase().includes(q);
          if (normalScope === 'category') return v.Category.toLowerCase().includes(q);
          return (
            v.VendorName.toLowerCase().includes(q) ||
            v.Category.toLowerCase().includes(q) ||
            v.City.toLowerCase().includes(q) ||
            v.VendorID.toLowerCase().includes(q)
          );
        });
        setVendorResults(matches);

        // SQL display for normal search
        const whereClause =
          normalScope === 'name'
            ? `v.VendorName LIKE '%${query}%'`
            : normalScope === 'category'
            ? `v.Category LIKE '%${query}%'`
            : `(v.VendorName LIKE '%${query}%' OR v.Category LIKE '%${query}%' OR pc.City LIKE '%${query}%')`;

        const sql = `SELECT v.VendorID, v.VendorName, v.Category, v.Street, pc.City, v.Pincode
FROM VENDOR v
JOIN PINCODE_CITY pc ON v.Pincode = pc.Pincode
WHERE ${whereClause};`;
        setDisplayedSql(sql);
      } else {
        const matches = allOrders.filter((o) => {
          return (
            o.OrderID.toLowerCase().includes(q) ||
            o.VendorName.toLowerCase().includes(q) ||
            o.Status.toLowerCase().includes(q)
          );
        });
        setOrderResults(matches);

        const sql = `SELECT po.OrderID, po.OrderDate, po.Status, v.VendorName, SUM(p.Price * c.Quantity) AS TotalCost
FROM PURCHASE_ORDER po
JOIN VENDOR v ON po.VendorID = v.VendorID
JOIN CONTAINS c ON po.OrderID = c.OrderID
JOIN PRODUCT p ON c.ProductID = p.ProductID
WHERE po.OrderID LIKE '%${query}%' OR v.VendorName LIKE '%${query}%' OR po.Status LIKE '%${query}%'
GROUP BY po.OrderID, po.OrderDate, po.Status, v.VendorName;`;
        setDisplayedSql(sql);
      }
    }
  }, [query, normalScope, activeTab, searchMode]);

  // Handle AI Search Execution
  const handleExecuteAiSearch = async () => {
    if (!query.trim()) return;
    if (!aiEnabled) {
      showToast({
        type: 'info',
        title: 'AI is Disabled',
        message: 'Enable Gemini AI in Settings to use Natural Language Search mode.',
      });
      return;
    }

    setLoadingAi(true);
    saveRecentSearch(query);
    const aiResult = await queryAiSearch(query);
    setLoadingAi(false);

    if (aiResult) {
      setDisplayedSql(aiResult.sql);
      setAiExplanation(aiResult.explanation);
      db.logSql({
        action: 'SELECT',
        sql: `-- Natural Language Query: "${query}"\n${aiResult.sql}`,
      });

      // Execute safe local filters
      const allVendors = db.getVendors();
      const allOrders = db.getPurchaseOrders();

      if (aiResult.target === 'orders') {
        setActiveTab('purchases');
        let filteredOrders = [...allOrders];
        for (const f of aiResult.filters) {
          filteredOrders = filteredOrders.filter((o) => {
            const val = (o as any)[f.field];
            if (f.operator === 'like') return String(val).toLowerCase().includes(String(f.value).toLowerCase());
            if (f.operator === 'eq') return String(val).toLowerCase() === String(f.value).toLowerCase();
            if (f.operator === 'gt') return Number(val) > Number(f.value);
            if (f.operator === 'lt') return Number(val) < Number(f.value);
            return true;
          });
        }
        setOrderResults(filteredOrders);
      } else {
        setActiveTab('vendors');
        let filteredVendors = [...allVendors];
        for (const f of aiResult.filters) {
          filteredVendors = filteredVendors.filter((v) => {
            const val = (v as any)[f.field];
            if (f.operator === 'like') return String(val).toLowerCase().includes(String(f.value).toLowerCase());
            if (f.operator === 'eq') return String(val).toLowerCase() === String(f.value).toLowerCase();
            return true;
          });
        }
        setVendorResults(filteredVendors);
      }
    } else {
      showToast({
        type: 'warning',
        title: 'AI Search Unavailable',
        message: 'Falling back to standard LIKE text pattern matching.',
      });
      setSearchMode('normal');
    }
  };

  // Highlight matching text helper
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim() || searchMode === 'ai') return text;
    const regex = new RegExp(`(${q})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-inherit px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Search & Retrieval Module
            </h1>
            <ConceptTooltip
              concept="Pattern Matching (LIKE) & Query Translation"
              explanation="Supports relational LIKE matching across joined projections, as well as Gemini AI natural language translation into structured SQL queries."
              rule="SELECT ... WHERE attribute LIKE '%pattern%'"
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Search vendor registries and purchase records with pattern matching or AI natural phrasing.
          </p>
        </div>

        {/* Tab Toggle: Vendors vs Purchases */}
        <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
              activeTab === 'vendors'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Vendors Directory
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
              activeTab === 'purchases'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Orders & Payments
          </button>
        </div>
      </div>

      {/* BIG CLAY SEARCH BAR WITH AI TOGGLE */}
      <ClayCard elevated className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Mode Segmented Toggle: Normal vs AI */}
          <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15 shrink-0">
            <button
              onClick={() => setSearchMode('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all ${
                searchMode === 'normal'
                  ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Normal Search
            </button>
            <button
              onClick={() => setSearchMode('ai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1 transition-all ${
                searchMode === 'ai'
                  ? 'bg-gradient-to-r from-amber-400 to-indigo-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>✨ AI Mode</span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchMode === 'ai') handleExecuteAiSearch();
                  else saveRecentSearch(query);
                }
              }}
              placeholder={
                searchMode === 'ai'
                  ? "Try: 'electronics vendors in Pune' or 'delivered orders above 40000'..."
                  : activeTab === 'vendors'
                  ? 'Type vendor name or category to search in real time...'
                  : 'Search by Order ID, vendor name, or fulfillment status...'
              }
              className="clay-input pl-11 pr-24 py-3 w-full text-sm font-sans"
            />

            {searchMode === 'ai' && (
              <button
                onClick={handleExecuteAiSearch}
                disabled={loadingAi || !query.trim()}
                className="absolute right-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-heading font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              >
                {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Translate</span>}
              </button>
            )}
          </div>
        </div>

        {/* Normal Mode Scope Selector */}
        {searchMode === 'normal' && activeTab === 'vendors' && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-[var(--text-muted)] font-heading">Search in:</span>
            {(['both', 'name', 'category'] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => setNormalScope(scope)}
                className={`px-3 py-1 rounded-full capitalize text-xs font-heading transition-colors ${
                  normalScope === scope
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/30'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {scope === 'both' ? 'Name & Category' : scope}
              </button>
            ))}
          </div>
        )}

        {/* Recent Searches Chips */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--text-muted)]/15 overflow-x-auto text-xs">
            <History className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">Recent:</span>
            {recentSearches.map((rec, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(rec);
                  if (searchMode === 'ai') {
                    // execute
                  }
                }}
                className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] whitespace-nowrap text-[11px] font-mono border border-[var(--text-muted)]/15 transition-colors"
              >
                {rec}
              </button>
            ))}
          </div>
        )}
      </ClayCard>

      {/* EQUIVALENT SQL / AI EXPLANATION DRAWER */}
      <div className="p-4 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] font-bold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Generated SQL Statement ({searchMode.toUpperCase()} MODE)</span>
          </div>
          <span className="text-[var(--text-muted)]">Live Projection</span>
        </div>

        <pre className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--text-muted)]/10 text-[11px] text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {displayedSql}
        </pre>

        {aiExplanation && (
          <div className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            ✨ AI Interpretation: {aiExplanation}
          </div>
        )}
      </div>

      {/* SEARCH RESULTS LIST */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
            {activeTab === 'vendors'
              ? `Matching Vendors (${vendorResults.length})`
              : `Matching Orders & Payments (${orderResults.length})`}
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Search Mode: {searchMode === 'ai' ? '✨ Natural Language' : 'Pattern Match'}
          </span>
        </div>

        {activeTab === 'vendors' ? (
          vendorResults.length === 0 ? (
            <ClayCard className="py-12 text-center text-xs text-[var(--text-muted)]">
              No vendors matched your query &quot;{query}&quot;.
            </ClayCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendorResults.map((v) => (
                <ClayCard key={v.VendorID} className="flex flex-col justify-between hover:-translate-y-1 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--accent-primary)]">
                        {v.VendorID}
                      </span>
                      <ClayChip label={v.Category} variant="secondary" className="text-[10px]" />
                    </div>

                    <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                      {highlightMatch(v.VendorName, query)}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {v.Street}, <strong>{highlightMatch(v.City, query)}</strong> ({v.Pincode})
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {v.Contacts.map((c, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">
                      Orders: <strong className="text-[var(--text-primary)]">{v.OrderCount}</strong>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Billed: {formatINR(v.TotalBilled)}
                    </span>
                  </div>
                </ClayCard>
              ))}
            </div>
          )
        ) : (
          /* ORDERS & PAYMENTS TAB */
          orderResults.length === 0 ? (
            <ClayCard className="py-12 text-center text-xs text-[var(--text-muted)]">
              No purchase orders or payments match your query &quot;{query}&quot;.
            </ClayCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {orderResults.map((o) => (
                <ClayCard key={o.OrderID} className="flex flex-col justify-between hover:-translate-y-1 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[var(--accent-primary)]">
                          {o.OrderID}
                        </span>
                        <ClayChip
                          label={o.Status}
                          variant={o.Status === 'Delivered' ? 'delivered' : 'pending'}
                          className="text-[10px]"
                        />
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">{o.OrderDate}</span>
                    </div>

                    <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                      {highlightMatch(o.VendorName, query)}
                    </h4>

                    <div className="mt-2 space-y-1 text-xs">
                      {o.Items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                          <span>{highlightMatch(item.ProductName, query)} ({item.Quantity}x)</span>
                          <span className="font-mono">{formatINR(item.LineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--text-muted)] font-heading">
                      Derived Total:
                    </span>
                    <span className="font-heading font-extrabold text-base text-[var(--text-primary)]">
                      {formatINR(o.TotalCost)}
                    </span>
                  </div>
                </ClayCard>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, Send, Loader2, Bot, Terminal } from 'lucide-react';
import { db } from '../../db/db';
import { askVendorNest } from '../../services/ai';
import { useToast } from './ClayToast';

export const AskVendorNestBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string; sql?: string }[]
  >([
    {
      role: 'assistant',
      content:
        'Hello! I am your VendorNest Database Intelligence assistant. Ask me anything about vendors, products, purchase orders, or payments.',
    },
  ]);
  const { showToast } = useToast();

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    // Prepare compact DB snapshot
    const raw = db.getRawData();
    const snapshot = {
      vendorsCount: raw.VENDOR.length,
      vendorsSummary: raw.VENDOR.map((v) => ({
        id: v.VendorID,
        name: v.VendorName,
        category: v.Category,
      })),
      productsCount: raw.PRODUCT.length,
      ordersSummary: raw.PURCHASE_ORDER.map((o) => ({
        id: o.OrderID,
        vendor: o.VendorID,
        status: o.Status,
        totalCost: db.calculateOrderTotalCost(o.OrderID),
      })),
      paymentsSummary: raw.PAYMENT.map((p) => ({
        id: p.PaymentID,
        order: p.OrderID,
        amount: p.Amount,
        status: p.Status,
        paidInstallments: db.getPaymentInstallmentsSum(p.PaymentID),
      })),
    };

    const result = await askVendorNest(userText, snapshot);
    setLoading(false);

    if (result) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer, sql: result.relatedSql },
      ]);
      if (result.relatedSql) {
        db.logSql({
          action: 'SELECT',
          sql: `-- AI Question: "${userText}"\n${result.relatedSql}`,
        });
      }
    } else {
      showToast({
        type: 'warning',
        title: 'AI is unavailable',
        message: 'Could not contact Gemini API right now. Answering from local statistics.',
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I could not reach Gemini AI at the moment. You currently have ' +
            raw.VENDOR.length +
            ' registered vendors and ' +
            raw.PURCHASE_ORDER.length +
            ' purchase orders in the local database.',
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-14 right-5 z-[850]">
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="clay-btn-primary p-3.5 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 group"
          aria-label="Ask VendorNest AI"
        >
          <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-heading font-semibold text-xs ml-2 pr-1">
            Ask VendorNest
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="clay-card-elevated w-[360px] sm:w-[400px] h-[480px] flex flex-col p-4 shadow-2xl rounded-3xl border border-[var(--accent-primary)]/30 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--text-muted)]/15 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-heading font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  Ask VendorNest
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 font-bold">
                    ✨ AI
                  </span>
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">Live DBMS Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] flex items-center justify-center"
              aria-label="Close AI assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[var(--accent-primary)] text-white rounded-br-none shadow-md'
                      : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] rounded-bl-none border border-[var(--text-muted)]/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.sql && (
                    <div className="mt-2 pt-2 border-t border-current/15 font-mono text-[10px] opacity-90">
                      <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider mb-0.5">
                        <Terminal className="w-3 h-3" /> Related SQL
                      </div>
                      <code>{m.sql}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>VendorNest AI is analyzing the database...</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Queries */}
          <div className="py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <button
              onClick={() => setInput('Which vendor has the highest outstanding amount?')}
              className="px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] whitespace-nowrap border border-[var(--text-muted)]/15 transition-colors"
            >
              Top outstanding vendor?
            </button>
            <button
              onClick={() => setInput('How many orders are still Pending?')}
              className="px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] whitespace-nowrap border border-[var(--text-muted)]/15 transition-colors"
            >
              Pending orders count?
            </button>
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="pt-2 border-t border-[var(--text-muted)]/15 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vendors, orders, dues..."
              className="clay-input flex-1 py-2 px-3 text-xs"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="clay-btn-primary px-3 py-2 rounded-xl text-xs flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Send query"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

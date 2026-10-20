import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, ChevronUp, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import { db } from '../../db/db';
import { SqlLogEntry } from '../../types/database';

export const SqlTerminalDrawer: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({
  isOpen,
  onToggle,
}) => {
  const [logs, setLogs] = useState<SqlLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'latest' | 'history'>('latest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLogs(db.getSqlLogs());
    const unsubscribe = db.subscribeSql((entry) => {
      setLogs((prev) => [entry, ...prev.slice(0, 24)]);
    });
    return () => unsubscribe();
  }, []);

  const latest = logs[0];

  const handleCopy = (sqlText: string, id: string) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const highlightSql = (sql: string) => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'ON', 'GROUP BY',
      'ORDER BY', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'HAVING',
      'LIMIT', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'DESC', 'ASC',
      'COUNT', 'SUM', 'COALESCE', 'CASE', 'WHEN', 'THEN', 'END', 'USING', 'TRUNCATE'
    ];

    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    const parts = sql.split(regex);

    return parts.map((part, i) => {
      if (keywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
        return (
          <span key={i} className="text-[#8E94FF] font-bold">
            {part.toUpperCase()}
          </span>
        );
      }
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={i} className="text-[#5ED6B0]">
            {part}
          </span>
        );
      }
      if (part.startsWith('--') || part.startsWith('/*')) {
        return (
          <span key={i} className="text-[var(--text-muted)] italic">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[800] transition-transform duration-300 pointer-events-none ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-46px)]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 pointer-events-auto">
        <div
          className="clay-card-elevated rounded-t-[32px] rounded-b-none border-b-0 overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: '380px' }}
        >
          {/* Collapsible Header Pill */}
          <div
            onClick={onToggle}
            className="px-6 py-2.5 flex items-center justify-between cursor-pointer bg-[var(--surface-elevated)] border-b border-[var(--text-muted)]/15 select-none hover:bg-[var(--surface)] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-[var(--text-primary)]">
                  SQL Terminal (DBMS Logger)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] font-mono text-[var(--text-muted)]">
                  {logs.length} statement{logs.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {latest && (
                <span className="hidden md:inline-block text-xs font-mono text-[var(--text-muted)] truncate max-w-sm">
                  {latest.action}: {latest.sql.split('\n')[0]}
                </span>
              )}
              <button
                className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--surface)] transition-transform"
                aria-label={isOpen ? 'Collapse terminal' : 'Expand terminal'}
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          {isOpen && (
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-sunken)] p-4 sm:p-5">
              {/* Tab Selector & Actions */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--text-muted)]/15">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('latest')}
                    className={`px-3 py-1 text-xs font-heading rounded-full transition-colors ${
                      activeTab === 'latest'
                        ? 'bg-[var(--accent-primary)] text-white font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    Active Statement
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 text-xs font-heading rounded-full transition-colors ${
                      activeTab === 'history'
                        ? 'bg-[var(--accent-primary)] text-white font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    History ({logs.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {latest && activeTab === 'latest' && (
                    <button
                      onClick={() => handleCopy(latest.sql, latest.id)}
                      className="px-2.5 py-1 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] rounded-full flex items-center gap-1.5 transition-colors"
                      title="Copy SQL statement"
                    >
                      {copiedId === latest.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => db.clearSqlLogs()}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded-full transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Console display */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === 'latest' ? (
                  latest ? (
                    <div
                      className={`p-4 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto ${
                        latest.isError
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                          : 'bg-[var(--surface-elevated)] border border-[var(--text-muted)]/15 text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pb-2 mb-2 border-b border-current/10">
                        <span className="font-semibold flex items-center gap-1.5">
                          {latest.isError && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                          ACTION: {latest.action}
                          {latest.table ? ` ON ${latest.table}` : ''}
                        </span>
                        <span>{latest.timestamp}</span>
                      </div>
                      <pre className="whitespace-pre-wrap">{highlightSql(latest.sql)}</pre>
                      {latest.errorMessage && (
                        <div className="mt-3 pt-2 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 font-sans font-medium text-xs">
                          {latest.errorMessage}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-[var(--text-muted)] font-mono">
                      No SQL statements executed yet. Perform any database action to inspect generated SQL.
                    </div>
                  )
                ) : (
                  <div className="space-y-2.5">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl font-mono text-xs border transition-colors ${
                          log.isError
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                            : 'bg-[var(--surface-elevated)] border-[var(--text-muted)]/15 text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                          <span className="font-bold flex items-center gap-1">
                            {log.isError && <AlertCircle className="w-3 h-3 text-rose-500" />}
                            {log.action}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{log.timestamp}</span>
                            <button
                              onClick={() => handleCopy(log.sql, log.id)}
                              className="hover:text-[var(--text-primary)] p-0.5"
                              title="Copy SQL"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px]">
                          {highlightSql(log.sql)}
                        </pre>
                        {log.errorMessage && (
                          <div className="mt-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-sans font-medium">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

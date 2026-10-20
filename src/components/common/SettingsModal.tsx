import React from 'react';
import { Sun, Moon, Monitor, RotateCcw, Download, Sparkles, Sliders } from 'lucide-react';
import { ClayModal } from './ClayModal';
import { ClayButton } from './ClayButton';
import { useTheme, ThemeMode, Quality3D } from '../../theme/ThemeContext';
import { db } from '../../db/db';
import { useToast } from './ClayToast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    themeMode,
    setThemeMode,
    quality3D,
    setQuality3D,
    reducedMotion,
    setReducedMotion,
    aiEnabled,
    setAiEnabled,
  } = useTheme();

  const { showToast } = useToast();

  const handleResetData = () => {
    db.resetToSampleData();
    showToast({
      type: 'success',
      title: 'Database Reset',
      message: 'All 10 tables have been restored to the default 3NF sample catalog.',
    });
    onClose();
  };

  const handleExportJson = () => {
    const jsonStr = db.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendornest_database_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'info',
      title: 'Database Exported',
      message: 'A complete JSON snapshot of all 10 tables was downloaded.',
    });
  };

  return (
    <ClayModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[var(--accent-primary)]" />
          <span>System & Database Settings</span>
        </div>
      }
      subtitle="Customize interface theme, 3D graphics rendering, and manage database state."
      maxWidth="md"
    >
      <div className="space-y-6 pt-2">
        {/* Theme Mode Selector */}
        <div>
          <label className="font-heading font-medium text-xs text-[var(--text-secondary)] block mb-2">
            Appearance Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: 'light' as ThemeMode, label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
              { mode: 'dark' as ThemeMode, label: 'Dark', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
              { mode: 'system' as ThemeMode, label: 'System', icon: <Monitor className="w-4 h-4 text-[var(--text-muted)]" /> },
            ].map((t) => (
              <button
                key={t.mode}
                onClick={() => setThemeMode(t.mode)}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-xs font-heading ${
                  themeMode === t.mode
                    ? 'bg-[var(--accent-primary)] text-white font-medium shadow-md'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Visual Experience */}
        <div>
          <label className="font-heading font-medium text-xs text-[var(--text-secondary)] block mb-2">
            3D Modular Nest Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['high', 'low', 'off'] as Quality3D[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality3D(q)}
                className={`p-2.5 rounded-2xl capitalize text-xs font-heading transition-all ${
                  quality3D === q
                    ? 'bg-[var(--accent-primary)] text-white font-medium shadow-md'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {q === 'off' ? 'Off (Static 2D)' : `${q} Quality`}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility & AI Toggles */}
        <div className="space-y-3 pt-2 border-t border-[var(--text-muted)]/15">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-sunken)]">
            <div>
              <h5 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                Reduced Motion
              </h5>
              <p className="text-[11px] text-[var(--text-muted)]">
                Disables 3D camera pan and spring animations
              </p>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <h5 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Gemini AI Features
                </h5>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Enable natural language query, product suggestions & insights
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>
        </div>

        {/* Database Management Actions */}
        <div className="space-y-3 pt-2 border-t border-[var(--text-muted)]/15">
          <div className="flex flex-col sm:flex-row gap-2">
            <ClayButton
              variant="secondary"
              onClick={handleExportJson}
              icon={<Download className="w-4 h-4" />}
              className="flex-1 text-xs"
            >
              Export DB (JSON)
            </ClayButton>

            <ClayButton
              variant="danger"
              onClick={handleResetData}
              icon={<RotateCcw className="w-4 h-4" />}
              className="flex-1 text-xs"
            >
              Reset to Sample Data
            </ClayButton>
          </div>
        </div>
      </div>
    </ClayModal>
  );
};

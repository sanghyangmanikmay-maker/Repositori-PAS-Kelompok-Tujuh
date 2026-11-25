import React from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Language, ViewMode } from '../sim/types';
import { t } from '../data/i18n';

interface TopNavProps {
  language: Language;
  viewMode: ViewMode;
  audioEnabled: boolean;
  onChangeMode: (mode: ViewMode) => void;
  onToggleLanguage: () => void;
  onToggleAudio: () => void;
  onReset: () => void;
}

const MODES: ViewMode[] = ['topology', 'inspect', 'principle', 'faultlab'];

export const TopNav: React.FC<TopNavProps> = ({
  language,
  viewMode,
  audioEnabled,
  onChangeMode,
  onToggleLanguage,
  onToggleAudio,
  onReset,
}) => {
  const copy = t(language);

  return (
    <header className="h-14 shrink-0 bg-[#111924] border-b border-slate-800 px-3 lg:px-5 flex items-center justify-between gap-3 xl:gap-6 z-30">
      {/* Zone 1: Single-line Brand Title */}
      <div className="flex items-center shrink-0">
        <span className="text-base lg:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
          {copy.brand}
        </span>
      </div>

      {/* Zone 2: 4 View Mode Navigation Links */}
      <nav
        aria-label="Simulation Modes"
        className="flex items-center gap-1 lg:gap-1.5 xl:gap-2 overflow-x-auto no-scrollbar"
      >
        {MODES.map((mode, idx) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeMode(mode)}
              className={`px-2 lg:px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
              }`}
            >
              {idx + 1}. {copy.modes[mode]}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Audio, Language & Reset Controls */}
      <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleAudio}
          className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
            audioEnabled
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
          }`}
          aria-label={audioEnabled ? copy.audioOn : copy.audioOff}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{audioEnabled ? copy.audioOn : copy.audioOff}</span>
        </button>

        <button
          type="button"
          onClick={onToggleLanguage}
          className="px-2.5 py-1.5 text-xs font-semibold font-mono-tabular rounded-md bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0"
          aria-label="Toggle Language ID/EN"
        >
          {language === 'id' ? 'ID | EN' : 'EN | ID'}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors whitespace-nowrap shrink-0"
          aria-label={copy.reset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{copy.reset}</span>
        </button>
      </div>
    </header>
  );
};

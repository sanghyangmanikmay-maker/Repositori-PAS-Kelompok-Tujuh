import React, { useState } from 'react';
import { Camera, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import {
  CameraPreset,
  ComponentId,
  Language,
  ViewMode,
} from '../sim/types';
import { t } from '../data/i18n';

interface ViewportOverlayProps {
  language: Language;
  viewMode: ViewMode;
  activeComponent: ComponentId;
  cameraPreset: CameraPreset;
  explodeFactor: number;
  principleStage: number;
  onSelectComponent: (comp: ComponentId) => void;
  onSelectCamera: (preset: CameraPreset) => void;
  onChangeExplode: (val: number) => void;
  onChangePrincipleStage: (stage: number) => void;
}

const CAMERA_PRESETS: CameraPreset[] = ['default', 'front', 'rear', 'internal', 'ceiling'];
const PAS_COMPONENTS: ComponentId[] = ['mic', 'ncu', 'speaker'];
const SENSOR_MCU_COMPONENTS: ComponentId[] = ['sensor_sound', 'sensor_current', 'sensor_temp'];

export const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  language,
  viewMode,
  activeComponent,
  cameraPreset,
  explodeFactor,
  principleStage,
  onSelectComponent,
  onSelectCamera,
  onChangeExplode,
  onChangePrincipleStage,
}) => {
  const copy = t(language);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const showExplodeDock = viewMode === 'inspect';
  const showPrincipleDock = viewMode === 'principle';

  return (
    <>
      {/* Top-Left Camera Presets & Component Selector */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none max-w-[calc(100%-24px)]">
        {viewMode === 'inspect' && (
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#111924]/95 border border-slate-800 shadow-lg w-fit">
              {PAS_COMPONENTS.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => onSelectComponent(comp)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeComponent === comp
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {copy.components[comp]}
                </button>
              ))}
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#111924]/95 border border-slate-800 shadow-lg w-fit">
              <span className="px-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                MCU
              </span>
              {SENSOR_MCU_COMPONENTS.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => onSelectComponent(comp)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeComponent === comp
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {copy.components[comp]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pointer-events-auto inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#111924]/92 border border-slate-800 w-fit">
          <span className="px-2 py-1 text-[11px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap">
            <Camera className="w-3 h-3" />
          </span>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onSelectCamera(preset)}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                cameraPreset === preset
                  ? 'bg-slate-700 text-sky-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {copy.cameraPresets[preset]}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom-Left Compact Signal Color Legend (PRD §6.2) */}
      <div className="hidden sm:flex absolute bottom-3 left-3 z-20 flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-[#111924]/94 border border-slate-800 pointer-events-none">
        <div className="text-[11px] font-semibold text-slate-300">
          {copy.signalLegend.title}
        </div>
        <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8] shrink-0" />
            <span>{copy.signalLegend.acoustic}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] shrink-0" />
            <span>{copy.signalLegend.analog}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6] shrink-0" />
            <span>{copy.signalLegend.ip}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] shrink-0" />
            <span>{copy.signalLegend.dc}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E] shrink-0" />
            <span>{copy.signalLegend.line100v}</span>
          </div>
        </div>
      </div>

      {/* Bottom-Center Collapsible Dock: Exploded View Slider or 5-Stage Working Principle */}
      {(showExplodeDock || showPrincipleDock) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center max-w-[92%] sm:max-w-[540px] w-full">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="px-3 py-0.5 text-[11px] font-medium text-slate-300 bg-[#111924] border border-b-0 border-slate-800 rounded-t-md hover:text-white flex items-center gap-1"
            aria-expanded={!dockCollapsed}
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {showExplodeDock ? copy.explodeLabel : copy.modes.principle}
            </span>
          </button>

          {!dockCollapsed && showExplodeDock && (
            <div className="w-full px-4 py-2.5 rounded-lg bg-[#111924]/95 border border-slate-800 flex items-center gap-3 shadow-xl">
              <Layers className="w-4 h-4 text-sky-400 shrink-0" />
              <label htmlFor="explode-slider" className="sr-only">
                {copy.explodeLabel}
              </label>
              <input
                id="explode-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(explodeFactor * 100)}
                onChange={(e) => onChangeExplode(Number(e.target.value) / 100)}
                className="pas-slider flex-1"
              />
              <span className="font-mono-tabular text-xs text-sky-300 w-10 text-right">
                {Math.round(explodeFactor * 100)}%
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[0, 0.5, 1].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeExplode(preset)}
                    className={`px-2 py-1 text-[11px] font-mono-tabular rounded border transition-colors ${
                      Math.abs(explodeFactor - preset) < 0.05
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {preset * 100}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {!dockCollapsed && showPrincipleDock && (
            <div className="w-full px-4 py-3 rounded-lg bg-[#111924]/95 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between gap-1.5 mb-2">
                {copy.principleStages.map((st) => (
                  <button
                    key={st.stage}
                    type="button"
                    onClick={() => onChangePrincipleStage(st.stage)}
                    className={`flex-1 py-1 text-xs font-mono-tabular font-semibold rounded border transition-colors ${
                      principleStage === st.stage
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : principleStage > st.stage
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {st.stage}
                  </button>
                ))}
              </div>
              <div className="text-xs font-semibold text-slate-100">
                {copy.principleStages[principleStage - 1]?.title}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {copy.principleStages[principleStage - 1]?.desc}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

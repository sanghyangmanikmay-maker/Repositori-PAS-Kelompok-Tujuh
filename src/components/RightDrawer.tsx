import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  Gauge,
  Mic,
  Radio,
  ShieldAlert,
  Sliders,
  Thermometer,
  Volume2,
  Zap,
} from 'lucide-react';
import {
  ComponentId,
  CurrentSensorLocation,
  DrawerTab,
  MicInputSource,
  SimulationState,
  SoundSensorLocation,
  SystemTelemetry,
  TempSensorLocation,
  WattageTap,
  ZoneId,
} from '../sim/types';
import { t } from '../data/i18n';
import { getAnatomyByComponent, getAnatomyById } from '../data/anatomy';
import {
  SENSOR_MCU_SPECS,
  getSensorKitIdForAnatomyPart,
  isSensorMcuComponent,
} from '../data/sensorPinouts';
import { QUIZ_QUESTIONS } from '../data/quizzes';

interface RightDrawerProps {
  simState: SimulationState;
  telemetry: SystemTelemetry;
  activeTab: DrawerTab;
  onChangeTab: (tab: DrawerTab) => void;
  onUpdateState: (updater: (prev: SimulationState) => SimulationState) => void;
  onTriggerChime: () => void;
  onSelectPart: (partId: string, component?: ComponentId) => void;
  onApplyScenario: (preset: '1' | '2' | '3a' | '3b') => void;
  onInspectSensorMcu: (comp: 'sensor_sound' | 'sensor_current' | 'sensor_temp') => void;
}

const WATTAGE_TAPS: WattageTap[] = [0.25, 0.5, 1, 2];
const ZONES: ZoneId[] = ['A', 'B', 'C'];

export const RightDrawer: React.FC<RightDrawerProps> = ({
  simState,
  telemetry,
  activeTab,
  onChangeTab,
  onUpdateState,
  onTriggerChime,
  onSelectPart,
  onApplyScenario,
  onInspectSensorMcu,
}) => {
  const lang = simState.language;
  const copy = t(lang);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    message: string;
    explanation: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Record<string, boolean>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const selectedAnatomy = getAnatomyById(simState.selectedPartId);
  const moduleParts = getAnatomyByComponent(simState.activeComponent);

  const currentQuestion = QUIZ_QUESTIONS[quizIndex];

  const handleLoadQuizCase = () => {
    if (!currentQuestion?.setupPatch) return;
    const patch = currentQuestion.setupPatch;
    onUpdateState((prev) => ({
      ...prev,
      bgmPlaying: patch.bgmPlaying ?? prev.bgmPlaying,
      faults: { ...prev.faults, ...(patch.faults || {}) },
      matrix: {
        micToZones: { ...prev.matrix.micToZones, ...(patch.matrix?.micToZones || {}) },
        bgmToZones: { ...prev.matrix.bgmToZones, ...(patch.matrix?.bgmToZones || {}) },
      },
      speaker: { ...prev.speaker, ...(patch.speaker || {}) },
      mic: { ...prev.mic, ...(patch.mic || {}) },
    }));
  };

  const handleSubmitQuiz = () => {
    if (!currentQuestion) return;
    let isCorrect = false;
    if (currentQuestion.type === 'diagnostic') {
      isCorrect = selectedOption === currentQuestion.correctOptionId;
    } else if (currentQuestion.validateConfig) {
      isCorrect = currentQuestion.validateConfig(simState, telemetry);
    }

    if (isCorrect && !answeredIds[currentQuestion.id]) {
      setScore((s) => s + 1);
      setAnsweredIds((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }

    setQuizFeedback({
      correct: isCorrect,
      message: isCorrect ? copy.quiz.correct : copy.quiz.incorrect,
      explanation: currentQuestion.explanation[lang],
    });
  };

  const handleNextCase = () => {
    setQuizFeedback(null);
    setSelectedOption('');
    if (quizIndex + 1 >= QUIZ_QUESTIONS.length) {
      setQuizCompleted(true);
    } else {
      setQuizIndex((i) => i + 1);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedOption('');
    setQuizFeedback(null);
    setScore(0);
    setAnsweredIds({});
    setQuizCompleted(false);
  };

  const statusBadgeText = (status: 'nominal' | 'warning' | 'critical') => {
    if (status === 'critical') return copy.telemetry.statusCritical;
    if (status === 'warning') return copy.telemetry.statusWarning;
    return copy.telemetry.statusNominal;
  };

  const statusTextColor = (status: 'nominal' | 'warning' | 'critical') => {
    if (status === 'critical') return 'text-rose-400';
    if (status === 'warning') return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <aside
      aria-label="Inspector and Controls"
      className="w-full lg:w-[34%] xl:w-[30%] shrink-0 bg-[#111924] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[44vh] lg:h-full overflow-hidden z-20"
    >
      {/* Drawer Tabs */}
      <div
        role="tablist"
        aria-label="Inspector Tabs"
        className="grid grid-cols-4 border-b border-slate-800 bg-[#0E151F] shrink-0"
      >
        {(
          [
            { id: 'anatomy', label: copy.drawerTabs.anatomy, icon: Cpu },
            { id: 'controls', label: copy.drawerTabs.controls, icon: Sliders },
            { id: 'faultlab', label: copy.drawerTabs.faultlab, icon: ShieldAlert },
            { id: 'quiz', label: copy.drawerTabs.quiz, icon: CheckCircle2 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center justify-center gap-1 py-2.5 px-1 text-[10.5px] xl:text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-sky-400 text-sky-300 bg-[#111924]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Tab Body */}
      <div className="flex-1 overflow-y-auto pas-scroll p-4 space-y-5">
        {/* ==================== TAB 1: INFO ANATOMI ==================== */}
        {activeTab === 'anatomy' && (
          <div className="space-y-4">
            <div className="space-y-2 pb-3 border-b border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {copy.anatomy.pasHardwareGroup}
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {(['mic', 'ncu', 'speaker'] as const).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => {
                      const parts = getAnatomyByComponent(comp);
                      onSelectPart(parts[0]?.id ?? 'ncu_cpu', comp);
                    }}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded border transition-colors whitespace-nowrap truncate ${
                      simState.activeComponent === comp
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {copy.components[comp]}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 pt-1">
                {copy.anatomy.sensorMcuGroup}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sensor_sound', 'sensor_current', 'sensor_temp'] as const).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => onInspectSensorMcu(comp)}
                    className={`py-1.5 px-1.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap truncate ${
                      simState.activeComponent === comp
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {copy.components[comp]}
                  </button>
                ))}
              </div>
            </div>

            {selectedAnatomy ? (
              <div className="space-y-3 bg-[#0E151F] border border-slate-800 rounded-lg p-3.5">
                {selectedAnatomy.subsystem && (
                  <div className="text-[11px] font-medium text-sky-400">
                    {copy.anatomy.subsystem} · {selectedAnatomy.subsystem[lang]}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                  {selectedAnatomy.name[lang]}
                </h3>
                <div className="space-y-2.5 text-xs leading-relaxed">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">
                      {copy.anatomy.function}
                    </div>
                    <p className="text-slate-200">
                      {selectedAnatomy.functionDesc[lang]}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">
                      {copy.anatomy.specs}
                    </div>
                    <p className="font-mono-tabular text-[11px] text-slate-300">
                      {selectedAnatomy.specs[lang]}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">
                      {copy.anatomy.signalRole}
                    </div>
                    <p className="text-slate-300">
                      {selectedAnatomy.signalRole[lang]}
                    </p>
                  </div>
                </div>

                {!isSensorMcuComponent(simState.activeComponent) &&
                  (() => {
                    const linkedKit = getSensorKitIdForAnatomyPart(selectedAnatomy.id);
                    if (!linkedKit) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => onInspectSensorMcu(linkedKit)}
                        className="w-full mt-2 py-2 px-3 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{copy.anatomy.inspectWithMcu}</span>
                      </button>
                    );
                  })()}
              </div>
            ) : (
              <p className="text-xs text-slate-400">{copy.anatomy.selectPrompt}</p>
            )}

            {/* Sensor + Microcontroller Pinout & Live Register Monitor */}
            {isSensorMcuComponent(simState.activeComponent) &&
              (() => {
                const kit = SENSOR_MCU_SPECS[simState.activeComponent];
                return (
                  <div className="space-y-3 bg-[#0E151F] border border-emerald-500/30 rounded-lg p-3.5">
                    <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>{copy.anatomy.mcuBenchTitle}</span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{copy.anatomy.mcuBoardLabel}:</span>
                        <span className="font-semibold text-slate-100 text-right">
                          {kit.mcuTitle[lang]}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{copy.anatomy.protocolLabel}:</span>
                        <span className="font-mono-tabular text-sky-300 text-right">
                          {kit.busProtocol[lang]}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{copy.anatomy.supplyLabel}:</span>
                        <span className="font-mono-tabular text-amber-300 text-right">
                          {kit.operatingVoltage}
                        </span>
                      </div>
                    </div>

                    {/* Live Microcontroller Register & ADC Readout */}
                    <div className="bg-[#090E14] border border-slate-800 rounded p-2.5 space-y-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        {copy.anatomy.liveMcuMonitor}
                      </div>

                      {kit.id === 'sensor_sound' && (
                        <div className="grid grid-cols-2 gap-2 font-mono-tabular text-[11px]">
                          <div>
                            <div className="text-[10px] text-slate-400">SPL (IEC 61672)</div>
                            <div className="text-slate-100 font-semibold">
                              {telemetry.soundSensor.measuredSplDb.toFixed(1)} dB
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">INMP441 Level</div>
                            <div className="text-sky-300 font-semibold">
                              {telemetry.soundSensor.dbfs.toFixed(1)} dBFS
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">24-Bit I2S PCM</div>
                            <div className="text-emerald-300">
                              {telemetry.soundSensor.rawPcmCount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">SNR / BCLK</div>
                            <div className="text-slate-200">
                              {telemetry.soundSensor.snrDb >= 0 ? '+' : ''}
                              {telemetry.soundSensor.snrDb.toFixed(1)} dB · 48kHz
                            </div>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
                            {copy.controls.testLocation}:{' '}
                            <span className="text-slate-200">
                              {copy.controls.soundLocations[telemetry.soundSensor.locationKey]}
                            </span>
                          </div>
                        </div>
                      )}

                      {kit.id === 'sensor_current' && (
                        <div className="grid grid-cols-2 gap-2 font-mono-tabular text-[11px]">
                          <div>
                            <div className="text-[10px] text-slate-400">VIOUT (Pin A0)</div>
                            <div className="text-amber-300 font-semibold">
                              {telemetry.currentSensor.vioutVolts.toFixed(3)} V
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">10-Bit ADC Raw</div>
                            <div className="text-slate-100 font-semibold">
                              {telemetry.currentSensor.adc10Bit} / 1023
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">0.1Ω Shunt Drop</div>
                            <div className="text-emerald-300">
                              {telemetry.currentSensor.shuntDropMv.toFixed(2)} mV
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Sensitivity</div>
                            <div className="text-slate-200">
                              {telemetry.currentSensor.sensitivityMvPerA} mV/A
                            </div>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
                            {copy.controls.testLocation}:{' '}
                            <span className="text-slate-200">
                              {copy.controls.currentLocations[telemetry.currentSensor.locationKey]}
                            </span>
                          </div>
                        </div>
                      )}

                      {kit.id === 'sensor_temp' && (
                        <div className="grid grid-cols-2 gap-2 font-mono-tabular text-[11px]">
                          <div>
                            <div className="text-[10px] text-slate-400">DS18B20 (Pin D2)</div>
                            <div className="text-emerald-300 font-semibold">
                              {telemetry.tempSensor.measuredTempC.toFixed(1)} °C ({telemetry.tempSensor.ds18b20RawHex})
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">NTC 10kΩ R_T</div>
                            <div className="text-sky-300 font-semibold">
                              {telemetry.tempSensor.ntcResistanceKOhm.toFixed(2)} kΩ
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Divider (Pin A1)</div>
                            <div className="text-slate-100">
                              {telemetry.tempSensor.dividerVolts.toFixed(3)} V
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">10-Bit ADC Raw</div>
                            <div className="text-slate-200">
                              {telemetry.tempSensor.adc10Bit} / 1023
                            </div>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
                            {copy.controls.testLocation}:{' '}
                            <span className="text-slate-200">
                              {copy.controls.tempLocations[telemetry.tempSensor.locationKey]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pinout Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-left">
                            <th className="py-1 pr-2 font-medium">{copy.anatomy.pinSensorCol}</th>
                            <th className="py-1 pr-2 font-medium">{copy.anatomy.pinMcuCol}</th>
                            <th className="py-1 font-medium">{copy.anatomy.pinSignalCol}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {kit.pinouts.map((row) => (
                            <tr key={row.sensorPin}>
                              <td className="py-1.5 pr-2 font-mono-tabular text-slate-100 whitespace-nowrap">
                                <span
                                  className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
                                  style={{ backgroundColor: row.wireColorHex }}
                                />
                                {row.sensorPin}
                              </td>
                              <td className="py-1.5 pr-2 font-mono-tabular text-sky-300 whitespace-nowrap">
                                {row.mcuPin}
                              </td>
                              <td className="py-1.5 text-slate-300 leading-snug">
                                {row.signalDesc[lang]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Firmware Conversion Formula */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="text-[10px] font-medium text-slate-400">
                        {copy.anatomy.codeFormulaLabel}
                      </div>
                      <p className="font-mono-tabular text-[10px] text-slate-300">
                        {kit.formulaNote[lang]}
                      </p>
                      <pre className="bg-[#090E14] border border-slate-800 rounded p-2 text-[10px] font-mono-tabular text-emerald-300 overflow-x-auto leading-relaxed">
                        {kit.firmwareSnippet}
                      </pre>
                    </div>
                  </div>
                );
              })()}

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-300">
                {copy.anatomy.quickParts}
              </div>
              <div className="space-y-1">
                {moduleParts.map((part) => {
                  const selected = simState.selectedPartId === part.id;
                  const isSensor = part.id.startsWith('sensor_');
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => onSelectPart(part.id, part.component)}
                      className={`w-full text-left px-3 py-2 rounded-md border text-xs flex items-center justify-between gap-2 transition-colors ${
                        selected
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-200'
                          : 'bg-[#0E151F] border-slate-800/90 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate font-medium">
                        {isSensor ? `[Sensor] ${part.name[lang]}` : part.name[lang]}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PANEL KONTROL ==================== */}
        {activeTab === 'controls' && (
          <div className="space-y-5">
            {/* 1. Gooseneck Microphone Controls */}
            <section className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>{copy.controls.micSection}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onPointerDown={() =>
                    onUpdateState((s) => ({ ...s, mic: { ...s.mic, pttActive: true } }))
                  }
                  onPointerUp={() =>
                    onUpdateState((s) => ({ ...s, mic: { ...s.mic, pttActive: false } }))
                  }
                  onPointerLeave={() =>
                    onUpdateState((s) =>
                      s.mic.pttActive ? { ...s, mic: { ...s.mic, pttActive: false } } : s,
                    )
                  }
                  onClick={() => {
                    // Keyboard Space/Enter accessibility fallback
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border transition-colors ${
                    simState.mic.pttActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  {copy.controls.pttHold}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      mic: { ...s.mic, pttLatched: !s.mic.pttLatched },
                    }))
                  }
                  className={`py-2 px-3 text-xs font-semibold rounded-md border transition-colors ${
                    simState.mic.pttLatched
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {copy.controls.pttLatch}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="gooseneck-angle" className="text-slate-300">
                    {copy.controls.gooseneckAngle}
                  </label>
                  <span className="font-mono-tabular text-sky-300">
                    {simState.mic.gooseneckAngleDeg}°
                  </span>
                </div>
                <input
                  id="gooseneck-angle"
                  type="range"
                  min={-45}
                  max={45}
                  value={simState.mic.gooseneckAngleDeg}
                  onChange={(e) =>
                    onUpdateState((s) => ({
                      ...s,
                      mic: { ...s.mic, gooseneckAngleDeg: Number(e.target.value) },
                    }))
                  }
                  className="pas-slider w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      mic: { ...s.mic, windTestActive: !s.mic.windTestActive },
                    }))
                  }
                  className={`py-1.5 px-2.5 text-xs font-medium rounded border transition-colors ${
                    simState.mic.windTestActive
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {copy.controls.windTest}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      mic: {
                        ...s.mic,
                        windshieldInstalled: !s.mic.windshieldInstalled,
                      },
                    }))
                  }
                  className={`py-1.5 px-2.5 text-xs font-medium rounded border transition-colors ${
                    simState.mic.windshieldInstalled
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {copy.controls.windshield}
                </button>
              </div>

              <div>
                <label
                  htmlFor="mic-input-source"
                  className="block text-[11px] text-slate-400 mb-1"
                >
                  {copy.controls.inputSource}
                </label>
                <select
                  id="mic-input-source"
                  value={simState.mic.inputSource}
                  onChange={(e) =>
                    onUpdateState((s) => ({
                      ...s,
                      mic: {
                        ...s.mic,
                        inputSource: e.target.value as MicInputSource,
                      },
                    }))
                  }
                  className="w-full bg-[#0E151F] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                >
                  <option value="sample_voice">{copy.controls.sources.sample_voice}</option>
                  <option value="chime_test">{copy.controls.sources.chime_test}</option>
                  <option value="live_mic">{copy.controls.sources.live_mic}</option>
                </select>
              </div>
            </section>

            {/* 2. NCU DSP & Audio Matrix Router */}
            <section className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>{copy.controls.ncuSection}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label htmlFor="ncu-gain" className="text-slate-300">
                      {copy.controls.gain}
                    </label>
                    <span className="font-mono-tabular text-sky-300">
                      {simState.dsp.gainDb >= 0 ? `+${simState.dsp.gainDb}` : simState.dsp.gainDb} dB
                    </span>
                  </div>
                  <input
                    id="ncu-gain"
                    type="range"
                    min={-12}
                    max={24}
                    value={simState.dsp.gainDb}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        dsp: { ...s.dsp, gainDb: Number(e.target.value) },
                      }))
                    }
                    className="pas-slider w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label htmlFor="ncu-fader" className="text-slate-300">
                      {copy.controls.fader}
                    </label>
                    <span className="font-mono-tabular text-sky-300">
                      {simState.dsp.masterFader}%
                    </span>
                  </div>
                  <input
                    id="ncu-fader"
                    type="range"
                    min={0}
                    max={100}
                    value={simState.dsp.masterFader}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        dsp: { ...s.dsp, masterFader: Number(e.target.value) },
                      }))
                    }
                    className="pas-slider w-full"
                  />
                </div>
              </div>

              {/* 3-Band EQ */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'eqBassDb', label: 'Bass' },
                    { key: 'eqMidDb', label: 'Mid' },
                    { key: 'eqTrebleDb', label: 'Treble' },
                  ] as const
                ).map((band) => (
                  <div key={band.key} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{band.label}</span>
                      <span className="font-mono-tabular text-slate-200">
                        {simState.dsp[band.key] >= 0 ? `+${simState.dsp[band.key]}` : simState.dsp[band.key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      aria-label={band.label}
                      value={simState.dsp[band.key]}
                      onChange={(e) =>
                        onUpdateState((s) => ({
                          ...s,
                          dsp: { ...s.dsp, [band.key]: Number(e.target.value) },
                        }))
                      }
                      className="pas-slider w-full"
                    />
                  </div>
                ))}
              </div>

              {/* DSP Toggles */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {(
                  [
                    { key: 'phantomPower48V', label: copy.controls.phantom48v },
                    { key: 'compressorEnabled', label: copy.controls.compressor },
                    { key: 'feedbackSuppressorEnabled', label: copy.controls.feedback },
                    { key: 'cueMonitorEnabled', label: copy.controls.cueMonitor },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      onUpdateState((s) => ({
                        ...s,
                        dsp: { ...s.dsp, [item.key]: !s.dsp[item.key] },
                      }))
                    }
                    className={`py-1.5 px-2 rounded border text-left truncate transition-colors ${
                      simState.dsp[item.key]
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({ ...s, bgmPlaying: !s.bgmPlaying }))
                  }
                  className={`py-1.5 px-2.5 text-xs font-medium rounded border transition-colors ${
                    simState.bgmPlaying
                      ? 'bg-sky-500/20 text-sky-200 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {copy.controls.bgmToggle}
                </button>
                <button
                  type="button"
                  onClick={onTriggerChime}
                  className="py-1.5 px-2.5 text-xs font-medium rounded border bg-slate-800 text-slate-200 border-slate-700 hover:border-sky-400 transition-colors"
                >
                  {copy.controls.chimeTrigger}
                </button>
              </div>

              {/* Audio Matrix Router */}
              <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-200">
                  {copy.controls.matrixTitle}
                </div>
                <div className="space-y-1.5">
                  {ZONES.map((z) => (
                    <div
                      key={z}
                      className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-800/70 last:border-0"
                    >
                      <span className="text-slate-300 truncate">{copy.controls.zones[z]}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateState((s) => ({
                              ...s,
                              matrix: {
                                ...s.matrix,
                                micToZones: {
                                  ...s.matrix.micToZones,
                                  [z]: !s.matrix.micToZones[z],
                                },
                              },
                            }))
                          }
                          className={`px-2 py-0.5 rounded border font-medium ${
                            simState.matrix.micToZones[z]
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          Mic
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateState((s) => ({
                              ...s,
                              matrix: {
                                ...s.matrix,
                                bgmToZones: {
                                  ...s.matrix.bgmToZones,
                                  [z]: !s.matrix.bgmToZones[z],
                                },
                              },
                            }))
                          }
                          className={`px-2 py-0.5 rounded border font-medium ${
                            simState.matrix.bgmToZones[z]
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          BGM
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Ceiling Speaker Controls */}
            <section className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Radio className="w-4 h-4 text-rose-400" />
                <span>{copy.controls.speakerSection}</span>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1.5">
                  {copy.controls.wattageTap}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {WATTAGE_TAPS.map((tap) => (
                    <button
                      key={tap}
                      type="button"
                      onClick={() =>
                        onUpdateState((s) => ({
                          ...s,
                          speaker: { ...s.speaker, wattageTap: tap },
                        }))
                      }
                      className={`py-1.5 text-xs font-mono-tabular font-semibold rounded border transition-colors ${
                        simState.speaker.wattageTap === tap
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {tap === 0.25 ? '1/4W' : tap === 0.5 ? '1/2W' : `${tap}W`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex rounded border border-slate-800 overflow-hidden">
                  {([70, 100] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        onUpdateState((s) => ({
                          ...s,
                          speaker: { ...s.speaker, lineVoltageMode: v },
                        }))
                      }
                      className={`flex-1 py-1.5 text-xs font-mono-tabular font-medium ${
                        simState.speaker.lineVoltageMode === v
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {v}V
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      speaker: {
                        ...s.speaker,
                        grilleTransparent: !s.speaker.grilleTransparent,
                      },
                    }))
                  }
                  className={`py-1.5 px-2 text-xs font-medium rounded border truncate ${
                    simState.speaker.grilleTransparent
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {copy.controls.grilleXray}
                </button>
              </div>
            </section>

            {/* 4. Instrumentation & Sensor Test Lab (Sound, Current, Temperature) */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>{copy.controls.sensorsSection}</span>
              </div>

              {/* Sound Sensor */}
              <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{copy.controls.soundSensorTitle}</span>
                  </div>
                  <span className={`font-mono-tabular text-[11px] font-semibold ${statusTextColor(telemetry.soundSensor.status)}`}>
                    {telemetry.soundSensor.measuredSplDb.toFixed(1)} dB · {statusBadgeText(telemetry.soundSensor.status)}
                  </span>
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-400">
                  {telemetry.soundSensor.sensorName} ({telemetry.soundSensor.sensorType})
                </div>
                <div>
                  <label htmlFor="sound-sensor-loc" className="block text-[11px] text-slate-400 mb-1">
                    {copy.controls.testLocation}
                  </label>
                  <select
                    id="sound-sensor-loc"
                    value={simState.sensors.soundLocation}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        sensors: { ...s.sensors, soundLocation: e.target.value as SoundSensorLocation },
                      }))
                    }
                    className="w-full bg-[#111924] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  >
                    <option value="speaker_baffle">{copy.controls.soundLocations.speaker_baffle}</option>
                    <option value="terminal_zone_c">{copy.controls.soundLocations.terminal_zone_c}</option>
                    <option value="mic_desk">{copy.controls.soundLocations.mic_desk}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label htmlFor="ambient-noise-slider" className="text-slate-400">
                      {copy.controls.ambientNoise}
                    </label>
                    <span className="font-mono-tabular text-slate-200">
                      {simState.sensors.ambientNoiseDb} dB
                    </span>
                  </div>
                  <input
                    id="ambient-noise-slider"
                    type="range"
                    min={38}
                    max={88}
                    value={simState.sensors.ambientNoiseDb}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        sensors: { ...s.sensors, ambientNoiseDb: Number(e.target.value) },
                      }))
                    }
                    className="pas-slider w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onInspectSensorMcu('sensor_sound')}
                  className="w-full py-1.5 px-2.5 rounded border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{copy.anatomy.inspectWithMcu} (INMP441 + ESP32)</span>
                </button>
              </div>

              {/* Electrical Current Sensor */}
              <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{copy.controls.currentSensorTitle}</span>
                  </div>
                  <span className={`font-mono-tabular text-[11px] font-semibold ${statusTextColor(telemetry.currentSensor.status)}`}>
                    {statusBadgeText(telemetry.currentSensor.status)}
                  </span>
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-400">
                  {telemetry.currentSensor.sensorName} ({telemetry.currentSensor.sensorType})
                </div>
                <div className="text-xs font-mono-tabular text-slate-100 bg-[#111924] px-2.5 py-1.5 rounded border border-slate-800">
                  {telemetry.currentSensor.measuredCurrentDisplay}
                </div>
                <div>
                  <label htmlFor="current-sensor-loc" className="block text-[11px] text-slate-400 mb-1">
                    {copy.controls.testLocation}
                  </label>
                  <select
                    id="current-sensor-loc"
                    value={simState.sensors.currentLocation}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        sensors: { ...s.sensors, currentLocation: e.target.value as CurrentSensorLocation },
                      }))
                    }
                    className="w-full bg-[#111924] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  >
                    <option value="ncu_line_out">{copy.controls.currentLocations.ncu_line_out}</option>
                    <option value="speaker_terminal">{copy.controls.currentLocations.speaker_terminal}</option>
                    <option value="ups_dc_bus">{copy.controls.currentLocations.ups_dc_bus}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectSensorMcu('sensor_current')}
                  className="w-full py-1.5 px-2.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{copy.anatomy.inspectWithMcu} (ACS712 + Nano)</span>
                </button>
              </div>

              {/* Temperature Sensor */}
              <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>{copy.controls.tempSensorTitle}</span>
                  </div>
                  <span className={`font-mono-tabular text-[11px] font-semibold ${statusTextColor(telemetry.tempSensor.status)}`}>
                    {telemetry.tempSensor.measuredTempC.toFixed(1)} °C · {statusBadgeText(telemetry.tempSensor.status)}
                  </span>
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-400">
                  {telemetry.tempSensor.sensorName} ({telemetry.tempSensor.sensorType})
                </div>
                <div>
                  <label htmlFor="temp-sensor-loc" className="block text-[11px] text-slate-400 mb-1">
                    {copy.controls.testLocation}
                  </label>
                  <select
                    id="temp-sensor-loc"
                    value={simState.sensors.tempLocation}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        sensors: { ...s.sensors, tempLocation: e.target.value as TempSensorLocation },
                      }))
                    }
                    className="w-full bg-[#111924] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  >
                    <option value="ncu_heatsink">{copy.controls.tempLocations.ncu_heatsink}</option>
                    <option value="speaker_voice_coil">{copy.controls.tempLocations.speaker_voice_coil}</option>
                    <option value="ncu_psu">{copy.controls.tempLocations.ncu_psu}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label htmlFor="ambient-temp-slider" className="text-slate-400">
                      {copy.controls.ambientTemp}
                    </label>
                    <span className="font-mono-tabular text-slate-200">
                      {simState.sensors.ambientTempC} °C
                    </span>
                  </div>
                  <input
                    id="ambient-temp-slider"
                    type="range"
                    min={20}
                    max={45}
                    value={simState.sensors.ambientTempC}
                    onChange={(e) =>
                      onUpdateState((s) => ({
                        ...s,
                        sensors: { ...s.sensors, ambientTempC: Number(e.target.value) },
                      }))
                    }
                    className="pas-slider w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onInspectSensorMcu('sensor_temp')}
                  className="w-full py-1.5 px-2.5 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{copy.anatomy.inspectWithMcu} (DS18B20/NTC + Uno)</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 3: LAB DARURAT & GANGGUAN ==================== */}
        {activeTab === 'faultlab' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">
                {copy.faults.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {copy.faults.subtitle}
              </p>
            </div>

            {/* FACP Fire Alarm GPIO Trigger */}
            <button
              type="button"
              onClick={() =>
                onUpdateState((s) => ({
                  ...s,
                  faults: { ...s.faults, facpFireAlarm: !s.faults.facpFireAlarm },
                }))
              }
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                simState.faults.facpFireAlarm
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
              }`}
            >
              <Flame className="w-4 h-4 shrink-0" />
              <span>
                {simState.faults.facpFireAlarm
                  ? copy.faults.facpActive
                  : copy.faults.facpBtn}
              </span>
            </button>

            {/* Line Supervision Fault Injection */}
            <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Line Supervision (70V/100V)</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      faults: { ...s.faults, speakerLineFault: 'normal' },
                    }))
                  }
                  className={`py-1.5 px-2.5 text-xs rounded border text-left ${
                    simState.faults.speakerLineFault === 'normal'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {copy.faults.normalLineBtn}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      faults: { ...s.faults, speakerLineFault: 'open' },
                    }))
                  }
                  className={`py-1.5 px-2.5 text-xs rounded border text-left ${
                    simState.faults.speakerLineFault === 'open'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {copy.faults.openLineBtn}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((s) => ({
                      ...s,
                      faults: { ...s.faults, speakerLineFault: 'short' },
                    }))
                  }
                  className={`py-1.5 px-2.5 text-xs rounded border text-left ${
                    simState.faults.speakerLineFault === 'short'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {copy.faults.shortLineBtn}
                </button>
              </div>
            </div>

            {/* Infrastructure Redundancy & Thermal Faults */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateState((s) => ({
                    ...s,
                    faults: {
                      ...s.faults,
                      primaryEthernetCut: !s.faults.primaryEthernetCut,
                    },
                  }))
                }
                className={`w-full py-2 px-3 rounded border text-xs font-medium text-left flex items-center justify-between ${
                  simState.faults.primaryEthernetCut
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                    : 'bg-[#0E151F] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{copy.faults.ethCutBtn}</span>
                <span className="font-mono-tabular text-[11px]">
                  {simState.faults.primaryEthernetCut ? 'LAN-B' : 'LAN-A'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateState((s) => ({
                    ...s,
                    faults: { ...s.faults, acMainsCut: !s.faults.acMainsCut },
                  }))
                }
                className={`w-full py-2 px-3 rounded border text-xs font-medium text-left flex items-center justify-between ${
                  simState.faults.acMainsCut
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                    : 'bg-[#0E151F] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{copy.faults.acCutBtn}</span>
                <span className="font-mono-tabular text-[11px]">
                  {simState.faults.acMainsCut ? '24V UPS' : '220V AC'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateState((s) => ({
                    ...s,
                    faults: {
                      ...s.faults,
                      coolingFanBlocked: !s.faults.coolingFanBlocked,
                    },
                  }))
                }
                className={`w-full py-2 px-3 rounded border text-xs font-medium text-left flex items-center justify-between ${
                  simState.faults.coolingFanBlocked
                    ? 'bg-rose-500/20 text-rose-200 border-rose-500/50'
                    : 'bg-[#0E151F] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{copy.faults.fanBlockedBtn}</span>
                <span className="font-mono-tabular text-[11px]">
                  {telemetry.tempSensor.ncuHeatsinkC.toFixed(1)}°C
                </span>
              </button>
            </div>

            {/* Quick PRD Scenarios */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-xs font-semibold text-slate-300">
                {copy.faults.scenariosTitle}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    { id: '1', label: copy.faults.scenario1 },
                    { id: '2', label: copy.faults.scenario2 },
                    { id: '3a', label: copy.faults.scenario3a },
                    { id: '3b', label: copy.faults.scenario3b },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onApplyScenario(sc.id)}
                    className="py-1.5 px-3 rounded border border-slate-800 bg-[#0E151F] text-xs text-slate-200 hover:border-sky-500/50 text-left transition-colors"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: EVALUASI / KUIS ==================== */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-100">
                {copy.quiz.title}
              </span>
              <span className="font-mono-tabular text-xs text-sky-300">
                {copy.quiz.score}: {score}/{QUIZ_QUESTIONS.length}
              </span>
            </div>

            {quizCompleted ? (
              <div className="bg-[#0E151F] border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="text-sm font-semibold text-emerald-300">
                  {copy.quiz.completedTitle}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {copy.quiz.completedDesc}
                </p>
                <div className="font-mono-tabular text-lg font-bold text-slate-100">
                  {score} / {QUIZ_QUESTIONS.length}
                </div>
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="w-full py-2 px-3 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 transition-colors"
                >
                  {copy.quiz.restartQuiz}
                </button>
              </div>
            ) : (
              currentQuestion && (
                <div className="space-y-3">
                  <div className="text-[11px] font-mono-tabular text-slate-400">
                    {copy.quiz.progress} {quizIndex + 1} / {QUIZ_QUESTIONS.length}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-100">
                    {currentQuestion.title[lang]}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentQuestion.scenario[lang]}
                  </p>

                  {currentQuestion.setupPatch && (
                    <button
                      type="button"
                      onClick={handleLoadQuizCase}
                      className="w-full py-1.5 px-3 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition-colors"
                    >
                      {copy.quiz.applySetup}
                    </button>
                  )}

                  {currentQuestion.type === 'diagnostic' &&
                    currentQuestion.options && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedOption(opt.id)}
                            className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors ${
                              selectedOption === opt.id
                                ? 'bg-sky-500/15 border-sky-400 text-slate-100'
                                : 'bg-[#0E151F] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt.label[lang]}
                          </button>
                        ))}
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={
                      currentQuestion.type === 'diagnostic' && !selectedOption
                    }
                    className="w-full py-2 px-3 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentQuestion.type === 'configuration'
                      ? copy.quiz.checkConfig
                      : copy.quiz.submitChoice}
                  </button>

                  {quizFeedback && (
                    <div
                      className={`p-3 rounded-lg border text-xs space-y-2 ${
                        quizFeedback.correct
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        {quizFeedback.correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>{quizFeedback.message}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {quizFeedback.explanation}
                      </p>
                      <button
                        type="button"
                        onClick={handleNextCase}
                        className="w-full py-1.5 px-3 rounded bg-slate-800 text-slate-100 font-medium hover:bg-slate-700 transition-colors"
                      >
                        {copy.quiz.nextCase}
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

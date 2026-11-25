import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CameraPreset,
  ComponentId,
  DrawerTab,
  SimulationState,
  ViewMode,
} from './sim/types';
import {
  computeSystemTelemetry,
  DEFAULT_SIMULATION_STATE,
} from './sim/engine';
import { PasDspAudioEngine } from './audio/dspAudio';
import { TopNav } from './components/TopNav';
import { Viewport3D } from './three/Viewport3D';
import { ViewportOverlay } from './components/ViewportOverlay';
import { RightDrawer } from './components/RightDrawer';
import { TelemetryBar } from './components/TelemetryBar';
import { getAnatomyByComponent } from './data/anatomy';

export default function App() {
  const [simState, setSimState] = useState<SimulationState>(
    () => structuredClone(DEFAULT_SIMULATION_STATE),
  );
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('anatomy');

  const audioEngineRef = useRef<PasDspAudioEngine | null>(null);
  if (!audioEngineRef.current) {
    audioEngineRef.current = new PasDspAudioEngine();
  }
  const waveformRef = useRef<Float32Array>(new Float32Array(128));
  const chimeTimerRef = useRef<number | null>(null);

  const telemetry = useMemo(
    () => computeSystemTelemetry(simState),
    [simState],
  );

  // Sync Web Audio DSP parameters whenever state/telemetry updates
  useEffect(() => {
    audioEngineRef.current?.update({
      mode: telemetry.priorityState,
      dsp: simState.dsp,
      wattageTap: simState.speaker.wattageTap,
      lineFault: simState.faults.speakerLineFault,
      windTestActive: simState.mic.windTestActive,
      windshieldInstalled: simState.mic.windshieldInstalled,
      inputSource: simState.mic.inputSource,
      phantom48V: simState.dsp.phantomPower48V,
    });
  }, [simState, telemetry.priorityState]);

  useEffect(() => {
    return () => {
      if (chimeTimerRef.current) window.clearTimeout(chimeTimerRef.current);
      audioEngineRef.current?.dispose();
    };
  }, []);

  const handleToggleAudio = useCallback(async () => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    if (simState.audioEnabled) {
      engine.disable();
      setSimState((s) => ({ ...s, audioEnabled: false }));
    } else {
      await engine.enable(simState.mic.inputSource === 'live_mic');
      setSimState((s) => ({ ...s, audioEnabled: true }));
    }
  }, [simState.audioEnabled, simState.mic.inputSource]);

  const handleTriggerChime = useCallback(() => {
    audioEngineRef.current?.triggerChime();
    setSimState((s) => ({ ...s, chimeActive: true }));
    if (chimeTimerRef.current) window.clearTimeout(chimeTimerRef.current);
    chimeTimerRef.current = window.setTimeout(() => {
      setSimState((s) => ({ ...s, chimeActive: false }));
    }, 1500);
  }, []);

  const handleChangeMode = useCallback((mode: ViewMode) => {
    setSimState((prev) => {
      const next: SimulationState = {
        ...prev,
        viewMode: mode,
        cameraPreset: 'default',
      };
      if (mode === 'principle') {
        next.activeComponent = 'speaker';
        next.selectedPartId = 'spk_terminal';
        next.speaker = { ...prev.speaker, grilleTransparent: true };
      } else if (mode === 'faultlab') {
        next.activeComponent = 'ncu';
      }
      return next;
    });
    if (mode === 'faultlab') {
      setDrawerTab('faultlab');
    } else if (mode === 'inspect') {
      setDrawerTab('anatomy');
    }
  }, []);

  const handleSelectPart = useCallback(
    (partId: string, component?: ComponentId) => {
      setSimState((prev) => ({
        ...prev,
        selectedPartId: partId,
        activeComponent: component ?? prev.activeComponent,
      }));
      setDrawerTab('anatomy');
    },
    [],
  );

  const handleSelectComponent = useCallback((comp: ComponentId) => {
    const parts = getAnatomyByComponent(comp);
    setSimState((prev) => ({
      ...prev,
      activeComponent: comp,
      selectedPartId: parts[0]?.id ?? prev.selectedPartId,
      cameraPreset: 'default',
    }));
  }, []);

  const handleInspectSensorMcu = useCallback(
    (sensorComp: 'sensor_sound' | 'sensor_current' | 'sensor_temp') => {
      const parts = getAnatomyByComponent(sensorComp);
      setSimState((prev) => ({
        ...prev,
        viewMode: 'inspect',
        activeComponent: sensorComp,
        selectedPartId: parts[0]?.id ?? prev.selectedPartId,
        cameraPreset: 'default',
      }));
      setDrawerTab('anatomy');
    },
    [],
  );

  const handleSelectCamera = useCallback((preset: CameraPreset) => {
    setSimState((prev) => ({
      ...prev,
      cameraPreset: preset,
    }));
  }, []);

  const handleChangePrincipleStage = useCallback((stage: number) => {
    const stagePartMap: Record<number, string> = {
      1: 'spk_terminal',
      2: 'spk_terminal',
      3: 'spk_tap',
      4: 'spk_transformer',
      5: 'spk_voicecoil',
    };
    setSimState((prev) => ({
      ...prev,
      principleStage: stage,
      selectedPartId: stagePartMap[stage] ?? prev.selectedPartId,
    }));
  }, []);

  const handleApplyScenario = useCallback(
    (preset: '1' | '2' | '3a' | '3b') => {
      setSimState((prev) => {
        const base = structuredClone(DEFAULT_SIMULATION_STATE);
        base.language = prev.language;
        base.audioEnabled = prev.audioEnabled;
        base.viewMode = prev.viewMode;

        if (preset === '1') {
          base.bgmPlaying = true;
          base.matrix.bgmToZones = { A: false, B: false, C: true };
          base.matrix.micToZones = { A: false, B: true, C: false };
          base.mic.pttLatched = true;
          return base;
        }
        if (preset === '2') {
          base.bgmPlaying = true;
          base.faults.facpFireAlarm = true;
          return base;
        }
        if (preset === '3a') {
          base.faults.speakerLineFault = 'open';
          return base;
        }
        // 3b
        base.bgmPlaying = true;
        base.matrix.bgmToZones = { A: false, B: true, C: true };
        base.faults.acMainsCut = true;
        return base;
      });

      if (preset === '1') {
        audioEngineRef.current?.triggerChime();
      }
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSimState((prev) => ({
      ...structuredClone(DEFAULT_SIMULATION_STATE),
      language: prev.language,
      audioEnabled: prev.audioEnabled,
    }));
    setDrawerTab('anatomy');
  }, []);

  const handleSignalSample = useCallback((samples: Float32Array) => {
    waveformRef.current = samples;
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B1118] text-slate-100 overflow-hidden">
      <TopNav
        language={simState.language}
        viewMode={simState.viewMode}
        audioEnabled={simState.audioEnabled}
        onChangeMode={handleChangeMode}
        onToggleLanguage={() =>
          setSimState((s) => ({
            ...s,
            language: s.language === 'id' ? 'en' : 'id',
          }))
        }
        onToggleAudio={handleToggleAudio}
        onReset={handleReset}
      />

      <main
        data-mode={simState.viewMode}
        data-priority={telemetry.priorityState}
        data-fault={telemetry.faultLedOn ? 'fault' : 'ok'}
        className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden"
      >
        {/* Main 3D Viewport (~70% on desktop) */}
        <div className="relative flex-1 min-h-[260px] lg:min-h-0 lg:w-[66%] xl:w-[70%] overflow-hidden">
          <Viewport3D
            simState={simState}
            telemetry={telemetry}
            audioEngine={audioEngineRef.current}
            onSelectPart={handleSelectPart}
            onSignalSample={handleSignalSample}
          />

          <ViewportOverlay
            language={simState.language}
            viewMode={simState.viewMode}
            activeComponent={simState.activeComponent}
            cameraPreset={simState.cameraPreset}
            explodeFactor={simState.explodeFactor}
            principleStage={simState.principleStage}
            onSelectComponent={handleSelectComponent}
            onSelectCamera={handleSelectCamera}
            onChangeExplode={(val) =>
              setSimState((s) => ({ ...s, explodeFactor: val }))
            }
            onChangePrincipleStage={handleChangePrincipleStage}
          />
        </div>

        {/* Right Inspector & Control Drawer (~30% on desktop) */}
        <RightDrawer
          simState={simState}
          telemetry={telemetry}
          activeTab={drawerTab}
          onChangeTab={setDrawerTab}
          onUpdateState={setSimState}
          onTriggerChime={handleTriggerChime}
          onSelectPart={handleSelectPart}
          onApplyScenario={handleApplyScenario}
          onInspectSensorMcu={handleInspectSensorMcu}
        />
      </main>

      <TelemetryBar
        simState={simState}
        telemetry={telemetry}
        waveformRef={waveformRef}
        onInspectSensorMcu={handleInspectSensorMcu}
      />
    </div>
  );
}

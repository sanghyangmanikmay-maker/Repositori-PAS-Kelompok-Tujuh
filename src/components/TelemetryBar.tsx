import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SimulationState, SystemTelemetry } from '../sim/types';
import { t } from '../data/i18n';

interface TelemetryBarProps {
  simState: SimulationState;
  telemetry: SystemTelemetry;
  waveformRef: React.MutableRefObject<Float32Array>;
  onInspectSensorMcu?: (comp: 'sensor_sound' | 'sensor_current' | 'sensor_temp') => void;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  simState,
  telemetry,
  waveformRef,
  onInspectSensorMcu,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const copy = t(simState.language);

  useEffect(() => {
    if (collapsed) return;
    let raf = 0;
    let lastDraw = 0;

    const renderOsc = (now: number) => {
      if (now - lastDraw > 50) {
        lastDraw = now;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = '#090E14';
            ctx.fillRect(0, 0, w, h);

            // Grid centerline
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Waveform trace
            const samples = waveformRef.current;
            ctx.strokeStyle =
              telemetry.priorityState === 'emergency'
                ? '#F43F5E'
                : telemetry.priorityState === 'paging'
                  ? '#10B981'
                  : telemetry.priorityState === 'bgm'
                    ? '#38BDF8'
                    : '#475569';
            ctx.lineWidth = 1.75;
            ctx.beginPath();
            for (let i = 0; i < samples.length; i++) {
              const x = (i / (samples.length - 1)) * w;
              const y = h / 2 - samples[i] * (h * 0.42);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(renderOsc);
    };

    raf = requestAnimationFrame(renderOsc);
    return () => cancelAnimationFrame(raf);
  }, [collapsed, telemetry.priorityState, waveformRef]);

  const soundLocLabel = copy.controls.soundLocations[telemetry.soundSensor.locationKey];
  const currentLocLabel = copy.controls.currentLocations[telemetry.currentSensor.locationKey];
  const tempLocLabel = copy.controls.tempLocations[telemetry.tempSensor.locationKey];

  return (
    <section
      aria-label="Signal Oscilloscope and Telemetry"
      className="shrink-0 bg-[#0E151F] border-t border-slate-800 z-30"
    >
      {/* Header Strip */}
      <div className="px-4 py-1.5 flex items-center justify-between gap-4 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{copy.telemetry.toggle}</span>
        </button>

        <div className="flex items-center gap-4 text-[11px] font-mono-tabular text-slate-300 overflow-x-auto no-scrollbar">
          <span>
            {copy.telemetry.priority}:{' '}
            <strong
              className={
                telemetry.priorityState === 'emergency'
                  ? 'text-rose-400'
                  : telemetry.priorityState === 'paging'
                    ? 'text-emerald-400'
                    : 'text-sky-300'
              }
            >
              {telemetry.priorityState.toUpperCase()}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <span>
            {telemetry.powerSource === 'dc_24v_ups'
              ? copy.telemetry.dc24
              : copy.telemetry.ac220}
          </span>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <span>
            {telemetry.networkStatus === 'failover_lan_b'
              ? copy.telemetry.lanB
              : copy.telemetry.lanA}
          </span>
        </div>
      </div>

      {/* Collapsible Telemetry Grid & Oscilloscope */}
      {!collapsed && (
        <div className="px-4 py-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Live Oscilloscope Canvas */}
          <div className="md:col-span-3 h-14 rounded border border-slate-800 overflow-hidden bg-[#090E14]">
            <canvas
              ref={canvasRef}
              width={280}
              height={56}
              className="w-full h-full block"
              aria-label="Real-time Signal Oscilloscope"
            />
          </div>

          {/* Core Line & Sensor Telemetry Readouts */}
          <div className="md:col-span-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-[#111924] border border-slate-800 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-slate-400 truncate">
                {copy.telemetry.lineVoltage}
              </div>
              <div className="font-mono-tabular font-semibold text-rose-300">
                {telemetry.lineVoltageV} V
              </div>
              <div className="font-mono-tabular text-[10px] text-slate-500">
                {telemetry.totalOutputWatts.toFixed(2)} W Out
              </div>
            </div>

            <div className="bg-[#111924] border border-slate-800 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-slate-400 truncate">
                {copy.telemetry.impedance}
              </div>
              <div className="font-mono-tabular font-semibold text-amber-300">
                {telemetry.lineImpedanceOhm > 50000
                  ? 'OL (>99kΩ)'
                  : `${telemetry.lineImpedanceOhm} Ω`}
              </div>
              <div className="font-mono-tabular text-[10px] text-slate-500">
                DC Supv: {telemetry.supervisionCurrentMa.toFixed(1)} mA
              </div>
            </div>

            {/* Sound Sensor Telemetry */}
            <button
              type="button"
              onClick={() => onInspectSensorMcu?.('sensor_sound')}
              className="text-left bg-[#111924] border border-slate-800 hover:border-sky-500/50 rounded px-2.5 py-1.5 transition-colors"
              aria-label={`${copy.telemetry.spl} — ${copy.anatomy.inspectWithMcu}`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] text-sky-400">
                <span className="truncate">{copy.telemetry.spl}</span>
                <span className="font-mono-tabular text-[9px] text-slate-500">ESP32</span>
              </div>
              <div className="font-mono-tabular font-semibold text-slate-100">
                {telemetry.soundSensor.measuredSplDb.toFixed(1)} dB
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={soundLocLabel}>
                {soundLocLabel}
              </div>
            </button>

            {/* Electrical Current Sensor Telemetry */}
            <button
              type="button"
              onClick={() => onInspectSensorMcu?.('sensor_current')}
              className="text-left bg-[#111924] border border-slate-800 hover:border-amber-500/50 rounded px-2.5 py-1.5 transition-colors"
              aria-label={`${copy.telemetry.currentSensor} — ${copy.anatomy.inspectWithMcu}`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] text-amber-400">
                <span className="truncate">{copy.telemetry.currentSensor}</span>
                <span className="font-mono-tabular text-[9px] text-slate-500">Nano</span>
              </div>
              <div
                className={`font-mono-tabular font-semibold truncate ${
                  telemetry.currentSensor.status === 'critical'
                    ? 'text-rose-400'
                    : telemetry.currentSensor.status === 'warning'
                      ? 'text-amber-300'
                      : 'text-slate-100'
                }`}
              >
                {simState.sensors.currentLocation === 'ups_dc_bus'
                  ? `${telemetry.currentSensor.upsBusCurrentA.toFixed(2)} A`
                  : `${telemetry.currentSensor.acLoadCurrentMa.toFixed(1)} mA`}
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={currentLocLabel}>
                {currentLocLabel}
              </div>
            </button>

            {/* Temperature Sensor Telemetry */}
            <button
              type="button"
              onClick={() => onInspectSensorMcu?.('sensor_temp')}
              className="text-left bg-[#111924] border border-slate-800 hover:border-emerald-500/50 rounded px-2.5 py-1.5 transition-colors"
              aria-label={`${copy.telemetry.tempSensor} — ${copy.anatomy.inspectWithMcu}`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-400">
                <span className="truncate">{copy.telemetry.tempSensor}</span>
                <span className="font-mono-tabular text-[9px] text-slate-500">Uno</span>
              </div>
              <div
                className={`font-mono-tabular font-semibold ${
                  telemetry.tempSensor.status === 'critical'
                    ? 'text-rose-400'
                    : telemetry.tempSensor.status === 'warning'
                      ? 'text-amber-300'
                      : 'text-slate-100'
                }`}
              >
                {telemetry.tempSensor.measuredTempC.toFixed(1)} °C
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={tempLocLabel}>
                {tempLocLabel}
              </div>
            </button>

            {/* Sensor Model Summary */}
            <div className="bg-[#111924] border border-slate-800 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-slate-400 truncate">
                {copy.telemetry.outputPower} / Radius
              </div>
              <div className="font-mono-tabular font-semibold text-slate-100">
                {simState.speaker.wattageTap}W · {telemetry.acousticRadiusM} m
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                INMP441 · ACS712 · DS18B20
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

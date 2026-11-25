import { DspParams, MicInputSource } from '../sim/types';

export type AudioPlaybackMode = 'idle' | 'bgm' | 'chime' | 'paging' | 'emergency';

/**
 * Procedural Web Audio API DSP Engine
 * Chains: Source -> Pre-Amp Gain (+48V) -> 3-Band BiquadFilter EQ -> DynamicsCompressor -> Master Fader/Tap Gain -> AnalyserNode -> Destination
 */
export class PasDspAudioEngine {
  private ctx: AudioContext | null = null;
  private preAmpGain: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private bgmGain: GainNode | null = null;
  private pagingGain: GainNode | null = null;
  private emergencyGain: GainNode | null = null;
  private windGain: GainNode | null = null;

  private bgmOscs: OscillatorNode[] = [];
  private pagingOsc: OscillatorNode | null = null;
  private pagingModOsc: OscillatorNode | null = null;
  private emergencyOsc: OscillatorNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private liveMicStream: MediaStream | null = null;
  private liveMicNode: MediaStreamAudioSourceNode | null = null;
  private liveMicGain: GainNode | null = null;

  private initialized = false;
  private isEnabled = false;
  private currentMode: AudioPlaybackMode = 'idle';
  private timeData = new Uint8Array(256);

  public async enable(liveMicRequested = false): Promise<boolean> {
    if (!this.initialized) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.preAmpGain = this.ctx.createGain();
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 120;

      this.midFilter = this.ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1200;
      this.midFilter.Q.value = 1.1;

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 5500;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.ratio.value = 4;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      this.preAmpGain
        .connect(this.bassFilter)
        .connect(this.midFilter)
        .connect(this.trebleFilter)
        .connect(this.compressor)
        .connect(this.masterGain)
        .connect(this.analyser)
        .connect(this.ctx.destination);

      this.setupProceduralSources();
      this.initialized = true;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (liveMicRequested && !this.liveMicNode && navigator.mediaDevices?.getUserMedia) {
      try {
        this.liveMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (this.ctx && this.preAmpGain) {
          this.liveMicNode = this.ctx.createMediaStreamSource(this.liveMicStream);
          this.liveMicGain = this.ctx.createGain();
          this.liveMicGain.gain.value = 0;
          this.liveMicNode.connect(this.liveMicGain).connect(this.preAmpGain);
        }
      } catch {
        // Fallback gracefully to procedural voice synthesis if mic permission denied
      }
    }

    this.isEnabled = true;
    return true;
  }

  public disable() {
    this.isEnabled = false;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }
  }

  private setupProceduralSources() {
    if (!this.ctx || !this.preAmpGain) return;

    // 1. Warm Airport Lounge BGM Pad (C Maj9 chord soft sine/triangle)
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0;
    const bgmFilter = this.ctx.createBiquadFilter();
    bgmFilter.type = 'lowpass';
    bgmFilter.frequency.value = 950;
    this.bgmGain.connect(bgmFilter).connect(this.preAmpGain);

    const freqs = [261.63, 329.63, 392.0, 493.88];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = 0.06;
      osc.connect(g).connect(this.bgmGain!);
      osc.start();
      this.bgmOscs.push(osc);
    });

    // 2. Paging Voice Formant Carrier (modulated speech-like formant)
    this.pagingGain = this.ctx.createGain();
    this.pagingGain.gain.value = 0;
    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.value = 1150;
    formantFilter.Q.value = 2.4;

    this.pagingOsc = this.ctx.createOscillator();
    this.pagingOsc.type = 'sawtooth';
    this.pagingOsc.frequency.value = 148;

    this.pagingModOsc = this.ctx.createOscillator();
    this.pagingModOsc.type = 'sine';
    this.pagingModOsc.frequency.value = 4.2;
    const modGain = this.ctx.createGain();
    modGain.gain.value = 28;
    this.pagingModOsc.connect(modGain).connect(this.pagingOsc.frequency);

    this.pagingOsc.connect(formantFilter).connect(this.pagingGain).connect(this.preAmpGain);
    this.pagingOsc.start();
    this.pagingModOsc.start();

    // 3. Emergency Evacuation Dual-Tone Sweep (ISO 8201 / Airport Evac Siren)
    this.emergencyGain = this.ctx.createGain();
    this.emergencyGain.gain.value = 0;
    this.emergencyOsc = this.ctx.createOscillator();
    this.emergencyOsc.type = 'square';
    this.emergencyOsc.frequency.value = 780;
    const evacFilter = this.ctx.createBiquadFilter();
    evacFilter.type = 'lowpass';
    evacFilter.frequency.value = 2100;

    const sirenLfo = this.ctx.createOscillator();
    sirenLfo.type = 'triangle';
    sirenLfo.frequency.value = 1.6;
    const sirenDepth = this.ctx.createGain();
    sirenDepth.gain.value = 220;
    sirenLfo.connect(sirenDepth).connect(this.emergencyOsc.frequency);

    this.emergencyOsc.connect(evacFilter).connect(this.emergencyGain).connect(this.preAmpGain);
    this.emergencyOsc.start();
    sirenLfo.start();

    // 4. Wind Gust Noise Generator (for Windshield test)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 450;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    this.windSource.connect(this.windFilter).connect(this.windGain).connect(this.preAmpGain);
    this.windSource.start();
  }

  public triggerChime() {
    if (!this.ctx || !this.preAmpGain || !this.isEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const env = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      env.gain.setValueAtTime(0.001, start);
      env.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      osc.connect(env).connect(this.preAmpGain!);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  public update(params: {
    mode: AudioPlaybackMode;
    dsp: DspParams;
    wattageTap: number;
    lineFault: 'normal' | 'open' | 'short';
    windTestActive: boolean;
    windshieldInstalled: boolean;
    inputSource: MicInputSource;
    phantom48V: boolean;
  }) {
    this.currentMode = params.mode;
    if (!this.ctx || !this.initialized) return;

    const now = this.ctx.currentTime;
    const tapGain = 0.25 + (params.wattageTap / 2) * 0.75; // 0.34 .. 1.0
    const faderLin = params.dsp.masterFader / 100;
    const gainLin = Math.pow(10, params.dsp.gainDb / 20);
    const mutedByFault = params.lineFault !== 'normal' && !params.dsp.cueMonitorEnabled;

    if (this.preAmpGain) {
      this.preAmpGain.gain.setTargetAtTime(
        params.mode === 'emergency' ? 1.0 : Math.min(2.2, gainLin * 0.5),
        now,
        0.04,
      );
    }

    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(params.dsp.eqBassDb, now, 0.04);
    }
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(params.dsp.eqMidDb, now, 0.04);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(params.dsp.eqTrebleDb, now, 0.04);
    }
    if (this.compressor) {
      this.compressor.ratio.setTargetAtTime(
        params.dsp.compressorEnabled ? 5 : 1,
        now,
        0.05,
      );
    }

    const masterTarget =
      !this.isEnabled || mutedByFault || params.mode === 'idle'
        ? 0
        : params.mode === 'emergency'
          ? 0.42 * tapGain
          : 0.38 * faderLin * tapGain;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.05);
    }

    // Source routing levels
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(params.mode === 'bgm' ? 0.55 : 0, now, 0.05);
    }

    const useLiveMic =
      params.mode === 'paging' &&
      params.inputSource === 'live_mic' &&
      this.liveMicGain !== null;

    if (this.pagingGain) {
      const phantomScale = params.phantom48V ? 1.0 : 0.12;
      this.pagingGain.gain.setTargetAtTime(
        params.mode === 'paging' && !useLiveMic ? 0.25 * phantomScale : 0,
        now,
        0.04,
      );
    }
    if (this.liveMicGain) {
      this.liveMicGain.gain.setTargetAtTime(useLiveMic ? 1.0 : 0, now, 0.04);
    }
    if (this.emergencyGain) {
      this.emergencyGain.gain.setTargetAtTime(
        params.mode === 'emergency' ? 0.14 : 0,
        now,
        0.03,
      );
    }
    if (this.windGain && this.windFilter) {
      const windLevel =
        params.windTestActive && params.mode === 'paging'
          ? params.windshieldInstalled
            ? 0.025
            : 0.22
          : 0;
      this.windGain.gain.setTargetAtTime(windLevel, now, 0.05);
      this.windFilter.frequency.setTargetAtTime(
        params.windshieldInstalled ? 180 : 900,
        now,
        0.05,
      );
    }
  }

  /**
   * Returns instantaneous audio amplitude (0..1) and waveform samples for oscilloscope + 3D speaker cone excursion
   */
  public sampleSignal(timeSec: number, activeMode: AudioPlaybackMode, tapWatts: number): {
    rms: number;
    samples: Float32Array;
  } {
    const out = new Float32Array(128);
    if (this.isEnabled && this.analyser && activeMode !== 'idle') {
      this.analyser.getByteTimeDomainData(this.timeData);
      let sumSq = 0;
      for (let i = 0; i < 128; i++) {
        const v = (this.timeData[i] - 128) / 128;
        out[i] = v;
        sumSq += v * v;
      }
      const rms = Math.min(1, Math.sqrt(sumSq / 128) * 3.2);
      if (rms > 0.01) {
        return { rms, samples: out };
      }
    }

    // Deterministic procedural waveform when audio is muted or in headless environment
    if (activeMode === 'idle') {
      return { rms: 0, samples: out };
    }
    const ampScale =
      activeMode === 'emergency'
        ? 0.92
        : activeMode === 'paging'
          ? 0.72 * (0.4 + 0.3 * tapWatts)
          : activeMode === 'chime'
            ? 0.65
            : 0.38 * (0.4 + 0.25 * tapWatts);

    let sumSq = 0;
    for (let i = 0; i < 128; i++) {
      const t = timeSec * 8 + i * 0.14;
      let val = 0;
      if (activeMode === 'emergency') {
        val = Math.sin(t * 2.8 + Math.sin(t * 0.5) * 1.6) * 0.8 + Math.sin(t * 5.6) * 0.2;
      } else if (activeMode === 'paging') {
        val = (Math.sin(t * 1.4) * 0.5 + Math.sin(t * 3.1) * 0.35 + Math.sin(t * 5.2) * 0.15) * (0.65 + 0.35 * Math.sin(timeSec * 6));
      } else if (activeMode === 'chime') {
        val = Math.sin(t * 2.1) * 0.7 + Math.sin(t * 4.2) * 0.3;
      } else {
        val = Math.sin(t * 0.9) * 0.6 + Math.sin(t * 1.8) * 0.4;
      }
      const clamped = Math.max(-1, Math.min(1, val * ampScale));
      out[i] = clamped;
      sumSq += clamped * clamped;
    }
    return { rms: Math.min(1, Math.sqrt(sumSq / 128) * 1.4), samples: out };
  }

  public dispose() {
    if (this.liveMicStream) {
      this.liveMicStream.getTracks().forEach((tr) => tr.stop());
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
  }
}

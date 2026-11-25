export type Language = 'id' | 'en';

export type ViewMode = 'topology' | 'inspect' | 'principle' | 'faultlab';

export type ComponentId =
  | 'mic'
  | 'ncu'
  | 'speaker'
  | 'sensor_sound'
  | 'sensor_current'
  | 'sensor_temp';

export type CameraPreset = 'default' | 'front' | 'rear' | 'internal' | 'ceiling';

export type ZoneId = 'A' | 'B' | 'C';

export type WattageTap = 0.25 | 0.5 | 1 | 2;

export type LineVoltageMode = 70 | 100;

export type SpeakerLineFault = 'normal' | 'open' | 'short';

export type NetworkStatus = 'primary_lan_a' | 'failover_lan_b';

export type PowerSource = 'ac_220v' | 'dc_24v_ups';

export type MicInputSource = 'sample_voice' | 'chime_test' | 'live_mic';

export type ActiveBroadcastType =
  | 'idle'
  | 'bgm'
  | 'chime'
  | 'paging'
  | 'emergency';

export type DrawerTab = 'anatomy' | 'controls' | 'faultlab' | 'quiz';

export type SoundSensorLocation = 'speaker_baffle' | 'terminal_zone_c' | 'mic_desk';
export type CurrentSensorLocation = 'ncu_line_out' | 'speaker_terminal' | 'ups_dc_bus';
export type TempSensorLocation = 'ncu_heatsink' | 'speaker_voice_coil' | 'ncu_psu';

export type SensorStatus = 'nominal' | 'warning' | 'critical';

export interface MatrixRouting {
  micToZones: Record<ZoneId, boolean>;
  bgmToZones: Record<ZoneId, boolean>;
}

export interface DspParams {
  gainDb: number; // -12 to +24 dB
  masterFader: number; // 0 to 100 %
  eqBassDb: number; // -12 to +12 dB
  eqMidDb: number; // -12 to +12 dB
  eqTrebleDb: number; // -12 to +12 dB
  compressorEnabled: boolean;
  feedbackSuppressorEnabled: boolean;
  noiseCancellingEnabled: boolean;
  phantomPower48V: boolean;
  cueMonitorEnabled: boolean;
}

export interface MicState {
  pttActive: boolean;
  pttLatched: boolean;
  gooseneckAngleDeg: number; // -45 (away) to +45 (toward speaker)
  windTestActive: boolean;
  windshieldInstalled: boolean;
  inputSource: MicInputSource;
}

export interface FaultState {
  facpFireAlarm: boolean;
  speakerLineFault: SpeakerLineFault;
  primaryEthernetCut: boolean;
  acMainsCut: boolean;
  coolingFanBlocked: boolean;
}

export interface SpeakerState {
  wattageTap: WattageTap;
  lineVoltageMode: LineVoltageMode;
  grilleTransparent: boolean;
}

export interface SensorTestConfig {
  ambientNoiseDb: number; // 38 to 88 dB
  soundLocation: SoundSensorLocation;
  currentLocation: CurrentSensorLocation;
  tempLocation: TempSensorLocation;
  ambientTempC: number; // 20 to 45 C
}

export interface SimulationState {
  language: Language;
  viewMode: ViewMode;
  activeComponent: ComponentId;
  selectedPartId: string;
  cameraPreset: CameraPreset;
  explodeFactor: number; // 0 to 1
  principleStage: number; // 1 to 5
  audioEnabled: boolean;
  bgmPlaying: boolean;
  chimeActive: boolean;
  mic: MicState;
  dsp: DspParams;
  matrix: MatrixRouting;
  speaker: SpeakerState;
  faults: FaultState;
  sensors: SensorTestConfig;
}

export interface ZoneTelemetry {
  zoneId: ZoneId;
  activeBroadcast: ActiveBroadcastType;
  lineVoltageV: number;
  outputWatts: number;
  splDb: number;
  receivingAudio: boolean;
}

export interface SoundSensorTelemetry {
  sensorName: string;
  sensorType: string;
  mcuName: string;
  mcuInterface: string;
  locationKey: SoundSensorLocation;
  measuredSplDb: number;
  ambientNoiseDb: number;
  snrDb: number;
  dbfs: number;
  i2sSampleRateHz: number;
  rawPcmCount: number;
  status: SensorStatus;
}

export interface CurrentSensorTelemetry {
  sensorName: string;
  sensorType: string;
  mcuName: string;
  mcuInterface: string;
  locationKey: CurrentSensorLocation;
  acLoadCurrentMa: number;
  dcSupervisionMa: number;
  upsBusCurrentA: number;
  measuredCurrentDisplay: string;
  vioutVolts: number;
  adc10Bit: number;
  sensitivityMvPerA: number;
  shuntDropMv: number;
  status: SensorStatus;
}

export interface TempSensorTelemetry {
  sensorName: string;
  sensorType: string;
  mcuName: string;
  mcuInterface: string;
  locationKey: TempSensorLocation;
  ncuHeatsinkC: number;
  voiceCoilC: number;
  psuTempC: number;
  measuredTempC: number;
  ds18b20RawHex: string;
  ntcResistanceKOhm: number;
  dividerVolts: number;
  adc10Bit: number;
  status: SensorStatus;
}

export interface SystemTelemetry {
  priorityState: ActiveBroadcastType;
  lineVoltageV: number; // 0, 70, or 100
  supervisionCurrentMa: number; // ~12.4mA normal, 0mA open, >45mA short
  lineImpedanceOhm: number; // e.g., 5000 Ohm at 100V/2W, Infinity on open, < 5 Ohm on short
  totalOutputWatts: number;
  speakerSplDb: number;
  acousticRadiusM: number;
  windNoiseAttenuationDb: number;
  powerSource: PowerSource;
  networkStatus: NetworkStatus;
  faultLedOn: boolean;
  alarmLedOn: boolean;
  signalLedOn: boolean;
  networkLedOn: boolean;
  lcdLine1: string;
  lcdLine2: string;
  zones: Record<ZoneId, ZoneTelemetry>;
  dcBlockedAtCapacitor: boolean;
  audioPassingToDriver: boolean;
  soundSensor: SoundSensorTelemetry;
  currentSensor: CurrentSensorTelemetry;
  tempSensor: TempSensorTelemetry;
}

export interface LocalizedText {
  id: string;
  en: string;
}

export interface AnatomyPartInfo {
  id: string;
  component: ComponentId;
  subsystem?: LocalizedText;
  name: LocalizedText;
  functionDesc: LocalizedText;
  specs: LocalizedText;
  signalRole: LocalizedText;
}

export interface QuizQuestion {
  id: string;
  type: 'diagnostic' | 'configuration';
  title: LocalizedText;
  scenario: LocalizedText;
  /** Optional interactive preset applied when the user starts this case */
  setupPatch?: Omit<Partial<SimulationState>, 'faults' | 'matrix' | 'speaker' | 'mic'> & {
    faults?: Partial<FaultState>;
    matrix?: Partial<MatrixRouting>;
    speaker?: Partial<SpeakerState>;
    mic?: Partial<MicState>;
  };
  /** For multiple choice diagnostic questions */
  options?: {
    id: string;
    label: LocalizedText;
  }[];
  correctOptionId?: string;
  /** For live system configuration challenges, evaluates current SimulationState */
  validateConfig?: (state: SimulationState, telemetry: SystemTelemetry) => boolean;
  explanation: LocalizedText;
}

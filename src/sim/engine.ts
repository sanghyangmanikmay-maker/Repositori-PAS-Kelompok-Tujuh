import {
  ActiveBroadcastType,
  SensorStatus,
  SimulationState,
  SystemTelemetry,
  WattageTap,
  ZoneId,
  ZoneTelemetry,
} from './types';

export const DEFAULT_SIMULATION_STATE: SimulationState = {
  language: 'id',
  viewMode: 'topology',
  activeComponent: 'ncu',
  selectedPartId: 'ncu_cpu',
  cameraPreset: 'default',
  explodeFactor: 0,
  principleStage: 1,
  audioEnabled: false,
  bgmPlaying: true,
  chimeActive: false,
  mic: {
    pttActive: false,
    pttLatched: false,
    gooseneckAngleDeg: 10,
    windTestActive: false,
    windshieldInstalled: true,
    inputSource: 'sample_voice',
  },
  dsp: {
    gainDb: 6,
    masterFader: 78,
    eqBassDb: 0,
    eqMidDb: 2,
    eqTrebleDb: 1,
    compressorEnabled: true,
    feedbackSuppressorEnabled: true,
    noiseCancellingEnabled: true,
    phantomPower48V: true,
    cueMonitorEnabled: false,
  },
  matrix: {
    micToZones: { A: false, B: true, C: false },
    bgmToZones: { A: false, B: false, C: true },
  },
  speaker: {
    wattageTap: 1,
    lineVoltageMode: 100,
    grilleTransparent: false,
  },
  faults: {
    facpFireAlarm: false,
    speakerLineFault: 'normal',
    primaryEthernetCut: false,
    acMainsCut: false,
    coolingFanBlocked: false,
  },
  sensors: {
    ambientNoiseDb: 52,
    soundLocation: 'speaker_baffle',
    currentLocation: 'ncu_line_out',
    tempLocation: 'ncu_heatsink',
    ambientTempC: 25,
  },
};

const TAP_SPL_BASE: Record<WattageTap, number> = {
  0.25: 84,
  0.5: 87,
  1: 90,
  2: 93,
};

const TAP_RADIUS_M: Record<WattageTap, number> = {
  0.25: 3.2,
  0.5: 4.5,
  1: 6.4,
  2: 9.0,
};

/**
 * Pure Finite State Machine (FSM) and electrical/acoustic/sensor telemetry calculator.
 * Enforces priority: Emergency Override (FACP) > Paging Mic (PTT) > Scheduled Chime > BGM.
 * Computes real-time 70V/100V impedance, DC supervision current, SPL, and Sound/Current/Temp sensors.
 */
export function computeSystemTelemetry(state: SimulationState): SystemTelemetry {
  const isPttEngaged = state.mic.pttActive || state.mic.pttLatched;
  const isEmergency = state.faults.facpFireAlarm;
  const isPaging = !isEmergency && isPttEngaged;
  const isChime = !isEmergency && !isPaging && state.chimeActive;
  const isBgm = !isEmergency && !isPaging && !isChime && state.bgmPlaying;

  const priorityState: ActiveBroadcastType = isEmergency
    ? 'emergency'
    : isPaging
      ? 'paging'
      : isChime
        ? 'chime'
        : isBgm
          ? 'bgm'
          : 'idle';

  const powerSource = state.faults.acMainsCut ? 'dc_24v_ups' : 'ac_220v';
  const networkStatus = state.faults.primaryEthernetCut
    ? 'failover_lan_b'
    : 'primary_lan_a';

  // Nominal impedance Z = V^2 / P for 70V/100V constant-voltage line
  const vNominal = state.speaker.lineVoltageMode;
  const nominalImpedance = Math.round(
    (vNominal * vNominal) / state.speaker.wattageTap,
  );

  let lineImpedanceOhm = nominalImpedance;
  let supervisionCurrentMa = 12.4;

  if (state.faults.speakerLineFault === 'open') {
    lineImpedanceOhm = 99999; // Open circuit (OL)
    supervisionCurrentMa = 0;
  } else if (state.faults.speakerLineFault === 'short') {
    lineImpedanceOhm = 1.8; // Short circuit
    supervisionCurrentMa = 48.6;
  }

  const lineBrokenOrShorted = state.faults.speakerLineFault !== 'normal';

  // Gain & Fader scaling factor (0.0 to 1.25)
  const faderNorm = state.dsp.masterFader / 100;
  const gainLinear = Math.pow(10, state.dsp.gainDb / 20);
  const effectiveLevel = isEmergency
    ? 1.0
    : Math.min(1.2, faderNorm * (0.55 + (0.45 * Math.min(gainLinear, 2.5)) / 2.5));

  // Angle attenuation on mic (0 deg optimal, +/-45 deg reduces pickup)
  const angleRad = (state.mic.gooseneckAngleDeg * Math.PI) / 180;
  const micPickupFactor = isPaging
    ? Math.max(0.45, Math.cos(angleRad * 0.75))
    : 1.0;

  // Phantom power reduces condenser capsule output sharply if off
  const phantomFactor =
    isPaging && !state.dsp.phantomPower48V ? 0.15 : 1.0;

  const zoneIds: ZoneId[] = ['A', 'B', 'C'];
  const zones = {} as Record<ZoneId, ZoneTelemetry>;

  let anyAudioOutput = false;
  let activeLineVoltageV = 0;
  let maxZoneWatts = 0;

  for (const z of zoneIds) {
    let zoneBroadcast: ActiveBroadcastType = 'idle';
    if (isEmergency) {
      zoneBroadcast = 'emergency';
    } else if (isPttEngaged && state.matrix.micToZones[z]) {
      zoneBroadcast = 'paging';
    } else if (state.chimeActive && state.matrix.micToZones[z]) {
      zoneBroadcast = 'chime';
    } else if (state.bgmPlaying && state.matrix.bgmToZones[z]) {
      zoneBroadcast = 'bgm';
    }

    const receivingAudio =
      zoneBroadcast !== 'idle' && !lineBrokenOrShorted;

    const outputScale =
      zoneBroadcast === 'emergency'
        ? 1.0
        : zoneBroadcast === 'paging'
          ? effectiveLevel * micPickupFactor * phantomFactor
          : zoneBroadcast === 'chime'
            ? Math.max(0.6, faderNorm)
            : zoneBroadcast === 'bgm'
              ? faderNorm * 0.65
              : 0;

    const outputWatts = receivingAudio
      ? Number((state.speaker.wattageTap * outputScale).toFixed(2))
      : 0;

    const lineVoltageV = receivingAudio
      ? Math.round(vNominal * Math.sqrt(Math.max(0.15, outputScale)))
      : 0;

    const splDb = receivingAudio
      ? Number(
          (
            TAP_SPL_BASE[state.speaker.wattageTap] +
            10 * Math.log10(Math.max(0.1, outputScale))
          ).toFixed(1),
        )
      : state.sensors.ambientNoiseDb;

    if (receivingAudio) {
      anyAudioOutput = true;
      activeLineVoltageV = Math.max(activeLineVoltageV, lineVoltageV);
      maxZoneWatts = Math.max(maxZoneWatts, outputWatts);
    }

    zones[z] = {
      zoneId: z,
      activeBroadcast: zoneBroadcast,
      lineVoltageV,
      outputWatts,
      splDb,
      receivingAudio,
    };
  }

  // Total active output wattage across active zones
  const totalOutputWatts = Number(
    zoneIds.reduce((sum, z) => sum + zones[z].outputWatts, 0).toFixed(2),
  );

  // Representative speaker SPL (Zone B or max active zone)
  const speakerSplDb =
    zones.B.receivingAudio
      ? zones.B.splDb
      : zones.C.receivingAudio
        ? zones.C.splDb
        : zones.A.receivingAudio
          ? zones.A.splDb
          : state.sensors.ambientNoiseDb;

  const acousticRadiusM = anyAudioOutput
    ? Number(
        (
          TAP_RADIUS_M[state.speaker.wattageTap] *
          Math.max(0.5, maxZoneWatts / state.speaker.wattageTap)
        ).toFixed(1),
      )
    : 0;

  const windNoiseAttenuationDb =
    state.mic.windTestActive && state.mic.windshieldInstalled ? -18.5 : 0;

  // --- SENSOR 1: SOUND SENSOR (MEMS SPL INMP441 / IEC 61672 Class 2) ---
  let rawAcousticSpl = state.sensors.ambientNoiseDb;
  if (state.sensors.soundLocation === 'speaker_baffle') {
    const activeSpkDb = zones.B.receivingAudio ? zones.B.splDb : speakerSplDb;
    // Combine acoustic output + ambient via logarithmic energy sum
    rawAcousticSpl = Number(
      (
        10 *
        Math.log10(
          Math.pow(10, activeSpkDb / 10) +
            Math.pow(10, state.sensors.ambientNoiseDb / 10),
        )
      ).toFixed(1),
    );
  } else if (state.sensors.soundLocation === 'terminal_zone_c') {
    const zoneCDb = zones.C.receivingAudio
      ? zones.C.splDb
      : state.sensors.ambientNoiseDb;
    rawAcousticSpl = Number(
      (
        10 *
        Math.log10(
          Math.pow(10, zoneCDb / 10) +
            Math.pow(10, state.sensors.ambientNoiseDb / 10),
        )
      ).toFixed(1),
    );
  } else {
    // Mic desk location picks up operator voice + wind gust if unshielded
    const voiceDb = isPttEngaged ? 76 + state.dsp.gainDb * 0.35 : state.sensors.ambientNoiseDb;
    const windPenalty =
      state.mic.windTestActive && !state.mic.windshieldInstalled ? 14.0 : 0;
    rawAcousticSpl = Number(Math.max(voiceDb + windPenalty, state.sensors.ambientNoiseDb).toFixed(1));
  }

  const snrDb = Number((rawAcousticSpl - state.sensors.ambientNoiseDb).toFixed(1));
  let soundStatus: SensorStatus = 'nominal';
  if (rawAcousticSpl >= 92 || (state.mic.windTestActive && !state.mic.windshieldInstalled && state.sensors.soundLocation === 'mic_desk')) {
    soundStatus = 'warning';
  }
  if (state.sensors.ambientNoiseDb >= 82 && !isEmergency && !anyAudioOutput) {
    soundStatus = 'warning';
  }

  // --- SENSOR 2: ELECTRICAL CURRENT SENSOR (Hall-Effect ACS712-05B & Shunt) ---
  // I_ac = P_total / V_line (in mA) when line is normal; spikes on short circuit; 0 on open circuit
  const nominalAcCurrentMa =
    state.faults.speakerLineFault === 'open'
      ? 0
      : state.faults.speakerLineFault === 'short'
        ? 4850.0
        : activeLineVoltageV > 0
          ? Number(((totalOutputWatts / activeLineVoltageV) * 1000).toFixed(1))
          : 0;

  // 24V DC UPS bus draw: idle NCU takes ~0.65A, active amp adds P_total / (24 * 0.82 efficiency)
  const upsBusCurrentA = state.faults.acMainsCut
    ? Number((0.65 + totalOutputWatts / (24 * 0.82)).toFixed(2))
    : 0.05; // trickle float current on AC mains

  let currentStatus: SensorStatus = 'nominal';
  if (state.faults.speakerLineFault === 'short' || state.faults.speakerLineFault === 'open') {
    currentStatus = 'critical';
  } else if (state.faults.acMainsCut) {
    currentStatus = 'warning';
  }

  const measuredCurrentDisplay =
    state.sensors.currentLocation === 'ups_dc_bus'
      ? `${upsBusCurrentA.toFixed(2)} A (24V DC)`
      : state.sensors.currentLocation === 'speaker_terminal'
        ? `${nominalAcCurrentMa.toFixed(1)} mA AC / ${supervisionCurrentMa.toFixed(1)} mA DC`
        : `${nominalAcCurrentMa.toFixed(1)} mA AC (${supervisionCurrentMa.toFixed(1)} mA Supv)`;

  // --- SENSOR 3: TEMPERATURE SENSOR (NTC Thermistor / DS18B20 Digital Probe) ---
  const loadHeatFactor = totalOutputWatts * 3.8 + (isEmergency ? 8.5 : 0);
  const fanPenalty = state.faults.coolingFanBlocked ? 26.0 : 0;
  const ncuHeatsinkC = Number(
    (state.sensors.ambientTempC + 11.5 + loadHeatFactor + fanPenalty).toFixed(1),
  );
  const voiceCoilC = Number(
    (
      state.sensors.ambientTempC +
      4.0 +
      (anyAudioOutput ? state.speaker.wattageTap * 9.5 : 0) +
      (isEmergency ? 7.0 : 0)
    ).toFixed(1),
  );
  const psuTempC = Number(
    (
      state.sensors.ambientTempC +
      9.0 +
      (state.faults.acMainsCut ? 6.5 : 3.0) +
      fanPenalty * 0.7
    ).toFixed(1),
  );

  const measuredTempC =
    state.sensors.tempLocation === 'speaker_voice_coil'
      ? voiceCoilC
      : state.sensors.tempLocation === 'ncu_psu'
        ? psuTempC
        : ncuHeatsinkC;

  let tempStatus: SensorStatus = 'nominal';
  if (measuredTempC >= 72) {
    tempStatus = 'critical';
  } else if (measuredTempC >= 56) {
    tempStatus = 'warning';
  }

  const faultLedOn =
    lineBrokenOrShorted ||
    state.faults.acMainsCut ||
    state.faults.primaryEthernetCut ||
    state.faults.coolingFanBlocked ||
    tempStatus === 'critical';
  const alarmLedOn = isEmergency;
  const signalLedOn = anyAudioOutput || isPttEngaged;
  const networkLedOn = true; // Redundant dual-NIC stays active even when LAN A cut

  let lcdLine1 = 'PA SYSTEM READY';
  let lcdLine2 =
    powerSource === 'dc_24v_ups' ? '24V DC UPS ACTIVE' : 'AC 220V | LAN-A OK';

  if (isEmergency) {
    lcdLine1 = 'ALARM: EVACUATION';
    lcdLine2 = 'FACP OVERRIDE ALL';
  } else if (state.faults.speakerLineFault === 'open') {
    lcdLine1 = 'FAULT: OPEN LINE';
    lcdLine2 = 'Z-LINE > 99k OHM';
  } else if (state.faults.speakerLineFault === 'short') {
    lcdLine1 = 'FAULT: SHORT CKT';
    lcdLine2 = 'I-LOAD > 4800 mA';
  } else if (state.faults.coolingFanBlocked || tempStatus === 'critical') {
    lcdLine1 = 'WARN: THERMAL HI';
    lcdLine2 = `TEMP ${ncuHeatsinkC.toFixed(1)}C FAN ERR`;
  } else if (isPaging) {
    const activeMicZones = zoneIds
      .filter((z) => state.matrix.micToZones[z])
      .join(',');
    lcdLine1 = 'PAGING MIC LIVE';
    lcdLine2 = activeMicZones ? `ZONE: ${activeMicZones}` : 'NO ZONE ROUTED';
  } else if (isChime) {
    lcdLine1 = 'SCHEDULED CHIME';
    lcdLine2 = 'PRE-ANNOUNCE TONE';
  } else if (isBgm) {
    const activeBgmZones = zoneIds
      .filter((z) => state.matrix.bgmToZones[z])
      .join(',');
    lcdLine1 = 'BGM STREAMING';
    lcdLine2 = activeBgmZones ? `BGM Z:${activeBgmZones}` : 'BGM STANDBY';
  }

  if (
    !isEmergency &&
    state.faults.primaryEthernetCut &&
    !lineBrokenOrShorted &&
    !state.faults.coolingFanBlocked
  ) {
    lcdLine2 = 'LAN-A ERR -> LAN-B';
  } else if (
    !isEmergency &&
    state.faults.acMainsCut &&
    !lineBrokenOrShorted &&
    !state.faults.coolingFanBlocked
  ) {
    lcdLine2 = 'FAILOVER: 24V UPS';
  }

  const soundDbfs = Number(Math.max(-80, Math.min(-0.5, rawAcousticSpl - 120)).toFixed(1));
  const rawPcmCount = Math.round(Math.pow(10, soundDbfs / 20) * 8388607);

  const activeAmpsForMcu =
    state.sensors.currentLocation === 'ups_dc_bus'
      ? upsBusCurrentA
      : state.faults.speakerLineFault === 'short'
        ? 4.85
        : state.faults.speakerLineFault === 'open'
          ? 0
          : nominalAcCurrentMa / 1000;
  const sensitivityMvPerA = 185;
  const vioutVolts = Number(Math.min(4.98, 2.5 + activeAmpsForMcu * (sensitivityMvPerA / 1000)).toFixed(3));
  const acsAdc10Bit = Math.min(1023, Math.max(0, Math.round((vioutVolts / 5.0) * 1023)));
  const shuntDropMv = Number((activeAmpsForMcu * 100).toFixed(2)); // 0.1 Ohm shunt

  const ds18b20RawCounts = Math.round(measuredTempC / 0.0625);
  const ds18b20RawHex = `0x${ds18b20RawCounts.toString(16).toUpperCase().padStart(4, '0')}`;
  const tempKelvin = measuredTempC + 273.15;
  const ntcResistanceKOhm = Number(
    (10 * Math.exp(3950 * (1 / tempKelvin - 1 / 298.15))).toFixed(2),
  );
  const dividerVolts = Number(
    (5.0 * (ntcResistanceKOhm / (10 + ntcResistanceKOhm))).toFixed(3),
  );
  const ntcAdc10Bit = Math.min(1023, Math.max(0, Math.round((dividerVolts / 5.0) * 1023)));

  return {
    priorityState,
    lineVoltageV: activeLineVoltageV,
    supervisionCurrentMa,
    lineImpedanceOhm,
    totalOutputWatts,
    speakerSplDb,
    acousticRadiusM,
    windNoiseAttenuationDb,
    powerSource,
    networkStatus,
    faultLedOn,
    alarmLedOn,
    signalLedOn,
    networkLedOn,
    lcdLine1,
    lcdLine2,
    zones,
    dcBlockedAtCapacitor: !lineBrokenOrShorted,
    audioPassingToDriver: anyAudioOutput,
    soundSensor: {
      sensorName: 'MEMS Digital SPL Sensor',
      sensorType: 'INMP441 / IEC 61672 Class 2',
      mcuName: 'ESP32-WROOM-32 DevKit v1',
      mcuInterface: 'I2S Digital DMA (48 kHz / 24-bit)',
      locationKey: state.sensors.soundLocation,
      measuredSplDb: rawAcousticSpl,
      ambientNoiseDb: state.sensors.ambientNoiseDb,
      snrDb,
      dbfs: soundDbfs,
      i2sSampleRateHz: 48000,
      rawPcmCount,
      status: soundStatus,
    },
    currentSensor: {
      sensorName: 'Hall-Effect & Shunt Current Sensor',
      sensorType: 'ACS712-05B / Precision Shunt',
      mcuName: 'Arduino Nano V3 (ATmega328P)',
      mcuInterface: '10-bit Ratiometric ADC (A0, 5.0V Ref)',
      locationKey: state.sensors.currentLocation,
      acLoadCurrentMa: nominalAcCurrentMa,
      dcSupervisionMa: supervisionCurrentMa,
      upsBusCurrentA,
      measuredCurrentDisplay,
      vioutVolts,
      adc10Bit: acsAdc10Bit,
      sensitivityMvPerA,
      shuntDropMv,
      status: currentStatus,
    },
    tempSensor: {
      sensorName: 'Digital Thermal & NTC Probe',
      sensorType: 'DS18B20 + NTC 10kΩ Thermistor',
      mcuName: 'Arduino Uno R3 (ATmega328P)',
      mcuInterface: '1-Wire Bus (D2 + 4.7kΩ) & ADC (A1)',
      locationKey: state.sensors.tempLocation,
      ncuHeatsinkC,
      voiceCoilC,
      psuTempC,
      measuredTempC,
      ds18b20RawHex,
      ntcResistanceKOhm,
      dividerVolts,
      adc10Bit: ntcAdc10Bit,
      status: tempStatus,
    },
  };
}

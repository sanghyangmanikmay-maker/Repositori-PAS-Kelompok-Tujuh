import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSystemTelemetry, DEFAULT_SIMULATION_STATE } from './engine';
import { SimulationState } from './types';

function cloneState(): SimulationState {
  return structuredClone(DEFAULT_SIMULATION_STATE);
}

test('Scenario 1: Normal Paging & BGM preserves BGM on Zone C while paging Zone B', () => {
  const state = cloneState();
  state.bgmPlaying = true;
  state.matrix.bgmToZones = { A: false, B: false, C: true };
  state.matrix.micToZones = { A: false, B: true, C: false };
  state.mic.pttActive = true;

  const telemetry = computeSystemTelemetry(state);
  assert.equal(telemetry.priorityState, 'paging');
  assert.equal(telemetry.zones.B.activeBroadcast, 'paging');
  assert.equal(telemetry.zones.C.activeBroadcast, 'bgm');
  assert.equal(telemetry.zones.A.activeBroadcast, 'idle');
  assert.equal(telemetry.zones.B.receivingAudio, true);
  assert.equal(telemetry.zones.C.receivingAudio, true);
});

test('Scenario 2: FACP Fire Alarm triggers Priority Override across all zones and mutes BGM', () => {
  const state = cloneState();
  state.bgmPlaying = true;
  state.matrix.bgmToZones = { A: false, B: false, C: true };
  state.faults.facpFireAlarm = true;

  const telemetry = computeSystemTelemetry(state);
  assert.equal(telemetry.priorityState, 'emergency');
  assert.equal(telemetry.alarmLedOn, true);
  assert.equal(telemetry.lcdLine1, 'ALARM: EVACUATION');
  assert.equal(telemetry.zones.A.activeBroadcast, 'emergency');
  assert.equal(telemetry.zones.B.activeBroadcast, 'emergency');
  assert.equal(telemetry.zones.C.activeBroadcast, 'emergency');
  assert.equal(telemetry.zones.C.outputWatts, state.speaker.wattageTap);
});

test('Scenario 3a: Open and Short speaker line faults are detected by Line Supervision & Current Sensor', () => {
  const openState = cloneState();
  openState.faults.speakerLineFault = 'open';
  const openTel = computeSystemTelemetry(openState);
  assert.equal(openTel.faultLedOn, true);
  assert.equal(openTel.supervisionCurrentMa, 0);
  assert.ok(openTel.lineImpedanceOhm > 50000);
  assert.equal(openTel.audioPassingToDriver, false);
  assert.equal(openTel.currentSensor.status, 'critical');
  assert.equal(openTel.currentSensor.acLoadCurrentMa, 0);

  const shortState = cloneState();
  shortState.faults.speakerLineFault = 'short';
  const shortTel = computeSystemTelemetry(shortState);
  assert.equal(shortTel.faultLedOn, true);
  assert.ok(shortTel.supervisionCurrentMa > 40);
  assert.ok(shortTel.lineImpedanceOhm < 5);
  assert.equal(shortTel.audioPassingToDriver, false);
  assert.equal(shortTel.currentSensor.status, 'critical');
  assert.ok(shortTel.currentSensor.acLoadCurrentMa > 4000);
});

test('Scenario 3b: AC Mains failure seamlessly switches to 24V DC UPS without dropping BGM/Paging', () => {
  const state = cloneState();
  state.bgmPlaying = true;
  state.matrix.bgmToZones.C = true;
  state.faults.acMainsCut = true;

  const telemetry = computeSystemTelemetry(state);
  assert.equal(telemetry.powerSource, 'dc_24v_ups');
  assert.equal(telemetry.faultLedOn, true);
  assert.equal(telemetry.zones.C.receivingAudio, true);
  assert.ok(telemetry.zones.C.outputWatts > 0);
  assert.ok(telemetry.currentSensor.upsBusCurrentA > 0.5);
});

test('FR-06: Wattage Tap Selector scales SPL, acoustic radius, and Sound Sensor reading', () => {
  const lowTap = cloneState();
  lowTap.bgmPlaying = true;
  lowTap.matrix.bgmToZones.B = true;
  lowTap.speaker.wattageTap = 0.25;
  const lowTel = computeSystemTelemetry(lowTap);

  const highTap = cloneState();
  highTap.bgmPlaying = true;
  highTap.matrix.bgmToZones.B = true;
  highTap.speaker.wattageTap = 2;
  const highTel = computeSystemTelemetry(highTap);

  assert.ok(highTel.speakerSplDb > lowTel.speakerSplDb);
  assert.ok(highTel.acousticRadiusM > lowTel.acousticRadiusM);
  assert.ok(highTel.lineImpedanceOhm < lowTel.lineImpedanceOhm);
  assert.ok(highTel.soundSensor.measuredSplDb > lowTel.soundSensor.measuredSplDb);
});

test('FR-09: Primary Ethernet cut activates Dual-NIC Failover LAN-B without dropping network', () => {
  const state = cloneState();
  state.faults.primaryEthernetCut = true;
  const telemetry = computeSystemTelemetry(state);
  assert.equal(telemetry.networkStatus, 'failover_lan_b');
  assert.equal(telemetry.networkLedOn, true);
  assert.equal(telemetry.faultLedOn, true);
});

test('Sensors: Temperature sensor rises under FACP load and triggers critical alert when fan blocked', () => {
  const normal = cloneState();
  const normalTel = computeSystemTelemetry(normal);
  assert.equal(normalTel.tempSensor.status, 'nominal');

  const hot = cloneState();
  hot.faults.facpFireAlarm = true;
  hot.faults.coolingFanBlocked = true;
  hot.sensors.ambientTempC = 35;
  const hotTel = computeSystemTelemetry(hot);
  assert.ok(hotTel.tempSensor.ncuHeatsinkC > normalTel.tempSensor.ncuHeatsinkC + 20);
  assert.equal(hotTel.tempSensor.status, 'critical');
  assert.equal(hotTel.faultLedOn, true);
});

test('Sensor MCU: INMP441+ESP32 I2S, ACS712+Nano 10-bit ADC, and DS18B20/NTC+Uno telemetry are physically accurate', () => {
  const base = cloneState();
  const baseTel = computeSystemTelemetry(base);

  // INMP441 + ESP32 I2S 48kHz/24-bit
  assert.equal(baseTel.soundSensor.i2sSampleRateHz, 48000);
  assert.ok(baseTel.soundSensor.dbfs < 0 && baseTel.soundSensor.dbfs > -80);
  assert.ok(baseTel.soundSensor.rawPcmCount > 0);

  // ACS712-05B + Nano 10-bit ADC (open circuit = 2.500V baseline -> ADC ~512; short = 4.85A -> ~3.397V -> ADC ~696)
  const openState = cloneState();
  openState.faults.speakerLineFault = 'open';
  const openTel = computeSystemTelemetry(openState);
  assert.equal(openTel.currentSensor.vioutVolts, 2.5);
  assert.equal(openTel.currentSensor.adc10Bit, 512);
  assert.equal(openTel.currentSensor.shuntDropMv, 0);

  const shortState = cloneState();
  shortState.faults.speakerLineFault = 'short';
  const shortTel = computeSystemTelemetry(shortState);
  assert.ok(shortTel.currentSensor.vioutVolts > 3.3);
  assert.ok(shortTel.currentSensor.adc10Bit > 680);
  assert.ok(shortTel.currentSensor.shuntDropMv > 400);

  // DS18B20 + NTC 10kOhm + Uno: NTC resistance decreases as temperature increases
  const hotState = cloneState();
  hotState.faults.coolingFanBlocked = true;
  hotState.sensors.ambientTempC = 38;
  const hotTel = computeSystemTelemetry(hotState);
  assert.ok(hotTel.tempSensor.ntcResistanceKOhm < baseTel.tempSensor.ntcResistanceKOhm);
  assert.ok(hotTel.tempSensor.dividerVolts < baseTel.tempSensor.dividerVolts);
  assert.match(hotTel.tempSensor.ds18b20RawHex, /^0x[0-9A-F]{4}$/);
});


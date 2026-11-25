import { Language, LocalizedText } from '../sim/types';

export type SensorMcuComponentId = 'sensor_sound' | 'sensor_current' | 'sensor_temp';

export interface PinConnectionRow {
  sensorPin: string;
  mcuPin: string;
  wireColorHex: string;
  wireColorLabel: LocalizedText;
  signalDesc: LocalizedText;
}

export interface SensorMcuKitSpec {
  id: SensorMcuComponentId;
  sensorTitle: LocalizedText;
  mcuTitle: LocalizedText;
  busProtocol: LocalizedText;
  operatingVoltage: string;
  formulaNote: LocalizedText;
  pinouts: PinConnectionRow[];
  firmwareSnippet: string;
}

export const SENSOR_MCU_SPECS: Record<SensorMcuComponentId, SensorMcuKitSpec> = {
  sensor_sound: {
    id: 'sensor_sound',
    sensorTitle: {
      id: 'MEMS Digital SPL Sensor (INMP441 / IEC 61672 Class 2)',
      en: 'MEMS Digital SPL Sensor (INMP441 / IEC 61672 Class 2)',
    },
    mcuTitle: {
      id: 'ESP32-WROOM-32 DevKit v1 (Dual-Core + I2S DMA)',
      en: 'ESP32-WROOM-32 DevKit v1 (Dual-Core + I2S DMA)',
    },
    busProtocol: {
      id: 'Digital I2S 24-bit PCM @ 48 kHz (Tegangan Logika 3.3V Wajib)',
      en: 'Digital I2S 24-bit PCM @ 48 kHz (Strict 3.3V Logic)',
    },
    operatingVoltage: '3.3V DC (Strictly < 3.6V)',
    formulaNote: {
      id: 'dBFS = 20·log10(RMS / 2²³) · SPL_dB = dBFS + 120 dB (Kalibrasi IEC 61672 Class 2)',
      en: 'dBFS = 20·log10(RMS / 2²³) · SPL_dB = dBFS + 120 dB (IEC 61672 Class 2 Cal)',
    },
    pinouts: [
      {
        sensorPin: 'VDD',
        mcuPin: '3.3V',
        wireColorHex: '#ef4444',
        wireColorLabel: { id: 'Merah', en: 'Red' },
        signalDesc: { id: 'Catu daya 3.3V (jangan hubungkan ke 5V)', en: '3.3V power rail (do not connect to 5V)' },
      },
      {
        sensorPin: 'GND',
        mcuPin: 'GND',
        wireColorHex: '#64748b',
        wireColorLabel: { id: 'Hitam', en: 'Black' },
        signalDesc: { id: 'Ground referensi bersama', en: 'Common ground reference' },
      },
      {
        sensorPin: 'SCK',
        mcuPin: 'GPIO 26',
        wireColorHex: '#10b981',
        wireColorLabel: { id: 'Hijau', en: 'Green' },
        signalDesc: { id: 'I2S Serial Bit Clock (BCLK)', en: 'I2S Serial Bit Clock (BCLK)' },
      },
      {
        sensorPin: 'WS',
        mcuPin: 'GPIO 22',
        wireColorHex: '#f59e0b',
        wireColorLabel: { id: 'Kuning', en: 'Yellow' },
        signalDesc: { id: 'Word Select / Frame Clock (LRCLK)', en: 'Word Select / Frame Clock (LRCLK)' },
      },
      {
        sensorPin: 'SD',
        mcuPin: 'GPIO 21',
        wireColorHex: '#38bdf8',
        wireColorLabel: { id: 'Biru', en: 'Blue' },
        signalDesc: { id: 'Serial Data 24-bit PCM (DOUT -> ESP32)', en: '24-bit PCM Serial Data (DOUT -> ESP32)' },
      },
      {
        sensorPin: 'L/R',
        mcuPin: 'GND',
        wireColorHex: '#94a3b8',
        wireColorLabel: { id: 'Abu-abu', en: 'Gray' },
        signalDesc: { id: 'Pemilih kanal Left Mono (tarik ke GND)', en: 'Left Mono channel select (tied to GND)' },
      },
    ],
    firmwareSnippet: `i2s_pin_config_t cfg = { .bck_io_num = 26, .ws_io_num = 22, .data_in_num = 21 };\nfloat dbfs = 20.0 * log10(rms_24bit / 8388607.0);\nfloat spl_db = dbfs + 120.0;`,
  },
  sensor_current: {
    id: 'sensor_current',
    sensorTitle: {
      id: 'Hall-Effect & Shunt Current Sensor (ACS712-05B / 0.1Ω Shunt)',
      en: 'Hall-Effect & Shunt Current Sensor (ACS712-05B / 0.1Ω Shunt)',
    },
    mcuTitle: {
      id: 'Arduino Nano V3 (ATmega328P · 5V Native 10-bit ADC)',
      en: 'Arduino Nano V3 (ATmega328P · 5V Native 10-bit ADC)',
    },
    busProtocol: {
      id: 'Ratiometric Analog Voltage (2.50V @ 0A, 185 mV/A) + Seri Beban IP+/IP-',
      en: 'Ratiometric Analog Voltage (2.50V @ 0A, 185 mV/A) + Series IP+/IP- Load',
    },
    operatingVoltage: '5.0V DC Regulated',
    formulaNote: {
      id: 'VIOUT = 2.50V + (0.185 · I_A) · ADC = (VIOUT / 5.0) × 1023 · V_shunt = I · 0.1Ω',
      en: 'VIOUT = 2.50V + (0.185 · I_A) · ADC = (VIOUT / 5.0) × 1023 · V_shunt = I · 0.1Ω',
    },
    pinouts: [
      {
        sensorPin: 'VCC',
        mcuPin: '5V',
        wireColorHex: '#ef4444',
        wireColorLabel: { id: 'Merah', en: 'Red' },
        signalDesc: { id: 'Suplai 5V presisi agar titik nol VIOUT tetap 2.50V', en: 'Regulated 5V rail to hold 2.50V zero-amp offset' },
      },
      {
        sensorPin: 'GND',
        mcuPin: 'GND',
        wireColorHex: '#64748b',
        wireColorLabel: { id: 'Hitam', en: 'Black' },
        signalDesc: { id: 'Ground referensi sinyal analog', en: 'Analog reference ground' },
      },
      {
        sensorPin: 'OUT (VIOUT)',
        mcuPin: 'A0 (ADC)',
        wireColorHex: '#f59e0b',
        wireColorLabel: { id: 'Oranye', en: 'Amber' },
        signalDesc: { id: 'Sinyal analog proporsional arus (185 mV/A)', en: 'Ratiometric analog voltage (185 mV/A)' },
      },
      {
        sensorPin: 'IP+ / IP-',
        mcuPin: 'Seri Jalur Beban',
        wireColorHex: '#f43f5e',
        wireColorLabel: { id: 'Merah Tebal', en: 'Heavy Red' },
        signalDesc: { id: 'Koneksi seri ke jalur 70V/100V NCU atau Bus 24V UPS + Shunt 0.1Ω', en: 'Series loop through 70V/100V NCU line or 24V UPS Bus + 0.1Ω Shunt' },
      },
    ],
    firmwareSnippet: `float vout = (analogRead(A0) / 1023.0) * 5.0;\nfloat currentA = (vout - 2.500) / 0.185; // ACS712-05B (185 mV/A)\nfloat shunt_mV = currentA * 100.0;       // 0.1 Ohm Precision Shunt`,
  },
  sensor_temp: {
    id: 'sensor_temp',
    sensorTitle: {
      id: 'Digital Thermal & NTC Probe (DS18B20 + NTC 10kΩ Thermistor)',
      en: 'Digital Thermal & NTC Probe (DS18B20 + NTC 10kΩ Thermistor)',
    },
    mcuTitle: {
      id: 'Arduino Uno R3 (ATmega328P · 1-Wire Digital + ADC)',
      en: 'Arduino Uno R3 (ATmega328P · 1-Wire Digital + ADC)',
    },
    busProtocol: {
      id: '1-Wire Bus (D2 + Pull-Up 4.7kΩ) & Pembagi Tegangan NTC (A1)',
      en: '1-Wire Digital Bus (D2 + 4.7kΩ Pull-Up) & NTC Voltage Divider (A1)',
    },
    operatingVoltage: '5.0V DC (Dual Channel)',
    formulaNote: {
      id: 'DS18B20: 12-bit (0.0625°C/LSB) · NTC: R_T = 10k·exp[3950·(1/T - 1/298.15)]',
      en: 'DS18B20: 12-bit (0.0625°C/LSB) · NTC: R_T = 10k·exp[3950·(1/T - 1/298.15)]',
    },
    pinouts: [
      {
        sensorPin: 'DS18B20 VDD',
        mcuPin: '5V',
        wireColorHex: '#ef4444',
        wireColorLabel: { id: 'Merah', en: 'Red' },
        signalDesc: { id: 'Suplai probe digital DS18B20', en: 'DS18B20 probe power rail' },
      },
      {
        sensorPin: 'DS18B20 DQ',
        mcuPin: 'D2 (+ 4.7kΩ->5V)',
        wireColorHex: '#eab308',
        wireColorLabel: { id: 'Kuning', en: 'Yellow' },
        signalDesc: { id: 'Bus data 1-Wire dengan resistor pull-up wajib 4.7kΩ ke 5V', en: '1-Wire data bus with mandatory 4.7kΩ pull-up to 5V' },
      },
      {
        sensorPin: 'DS18B20 GND',
        mcuPin: 'GND',
        wireColorHex: '#64748b',
        wireColorLabel: { id: 'Hitam', en: 'Black' },
        signalDesc: { id: 'Ground probe digital DS18B20', en: 'DS18B20 digital probe ground' },
      },
      {
        sensorPin: 'NTC 10kΩ Div',
        mcuPin: 'A1 (10kΩ->5V)',
        wireColorHex: '#10b981',
        wireColorLabel: { id: 'Hijau', en: 'Green' },
        signalDesc: { id: 'Titik tengah pembagi tegangan (R_ref 10kΩ ke 5V, NTC ke GND)', en: 'Voltage divider midpoint (10kΩ fixed to 5V, NTC bead to GND)' },
      },
    ],
    firmwareSnippet: `float temp_ds = sensors.getTempCByIndex(0); // 1-Wire Pin D2 (4.7k pull-up)\nfloat v_div = (analogRead(A1) / 1023.0) * 5.0;\nfloat r_ntc = 10000.0 * (v_div / (5.0 - v_div)); // Steinhart-Hart B=3950`,
  },
};

export function isSensorMcuComponent(id: string): id is SensorMcuComponentId {
  return id === 'sensor_sound' || id === 'sensor_current' || id === 'sensor_temp';
}

export function getSensorKitIdForAnatomyPart(partId: string): SensorMcuComponentId | null {
  if (partId === 'sensor_sound_mic' || partId === 'sensor_sound_spk' || partId.startsWith('s_snd_')) {
    return 'sensor_sound';
  }
  if (partId === 'sensor_current_ncu' || partId.startsWith('s_cur_')) {
    return 'sensor_current';
  }
  if (partId === 'sensor_temp_ncu' || partId === 'sensor_temp_spk' || partId.startsWith('s_tmp_')) {
    return 'sensor_temp';
  }
  return null;
}

export function getDefaultPinSummary(id: SensorMcuComponentId, lang: Language): string {
  return SENSOR_MCU_SPECS[id].busProtocol[lang];
}

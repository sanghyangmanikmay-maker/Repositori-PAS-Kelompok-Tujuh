import { QuizQuestion, SimulationState, SystemTelemetry } from '../sim/types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1_matrix_paging',
    type: 'configuration',
    title: {
      id: 'Studi Kasus 1: Konfigurasi Paging Terzonasi & BGM',
      en: 'Case Study 1: Zoned Paging & BGM Configuration',
    },
    scenario: {
      id: 'Aktifkan musik latar (BGM) hanya di Zona C (Ruang Tunggu Terminal), lalu arahkan dan aktifkan Paging Mic (PTT Latch) ke Zona B (Ruang Informasi) tanpa memutus BGM di Zona C.',
      en: 'Enable Background Music (BGM) only in Zone C (Terminal Hall), then route and latch the Paging Microphone (PTT) to Zone B (Information Room) without interrupting Zone C BGM.',
    },
    setupPatch: {
      bgmPlaying: false,
      faults: { facpFireAlarm: false, speakerLineFault: 'normal', primaryEthernetCut: false, acMainsCut: false },
      matrix: {
        micToZones: { A: false, B: false, C: false },
        bgmToZones: { A: false, B: false, C: false },
      },
      mic: { pttActive: false, pttLatched: false, gooseneckAngleDeg: 10, windTestActive: false, windshieldInstalled: true, inputSource: 'sample_voice' },
    },
    validateConfig: (state: SimulationState, telemetry: SystemTelemetry) => {
      return (
        !state.faults.facpFireAlarm &&
        state.bgmPlaying &&
        state.matrix.bgmToZones.C &&
        !state.matrix.bgmToZones.B &&
        state.matrix.micToZones.B &&
        !state.matrix.micToZones.C &&
        (state.mic.pttActive || state.mic.pttLatched) &&
        telemetry.zones.B.activeBroadcast === 'paging' &&
        telemetry.zones.C.activeBroadcast === 'bgm'
      );
    },
    explanation: {
      id: 'Audio Matrix Router pada NCU mengisolasi jalur Zona B untuk Paging Mic sementara Zona C tetap menerima aliran BGM secara independen.',
      en: 'The NCU Audio Matrix Router isolates Zone B for Paging Mic while keeping Zone C streaming BGM independently.',
    },
  },
  {
    id: 'q2_wattage_tap',
    type: 'configuration',
    title: {
      id: 'Studi Kasus 2: Penyesuaian Daya Speaker Area Bising',
      en: 'Case Study 2: High-Noise Terminal Wattage Tap',
    },
    scenario: {
      id: 'Area terminal sedang ramai dengan kebisingan latar tinggi. Atur Wattage Tap Selector pada Ceiling Speaker ke daya maksimum (2W) dengan tegangan jalur 100V agar tekanan suara mencapai > 91 dB.',
      en: 'The terminal waiting hall has elevated ambient noise. Set the Ceiling Speaker Wattage Tap Selector to maximum power (2W) on a 100V line so acoustic SPL reaches > 91 dB.',
    },
    setupPatch: {
      bgmPlaying: true,
      faults: { facpFireAlarm: false, speakerLineFault: 'normal', primaryEthernetCut: false, acMainsCut: false },
      matrix: {
        micToZones: { A: false, B: true, C: false },
        bgmToZones: { A: false, B: true, C: true },
      },
      speaker: { wattageTap: 0.25, lineVoltageMode: 70, grilleTransparent: false },
    },
    validateConfig: (state: SimulationState, telemetry: SystemTelemetry) => {
      return (
        state.speaker.wattageTap === 2 &&
        state.speaker.lineVoltageMode === 100 &&
        telemetry.lineImpedanceOhm === 5000
      );
    },
    explanation: {
      id: 'Pada jalur 100V, memilih tap 2W menurunkan impedansi efektif menjadi Z = V²/P = 100²/2 = 5.000 Ω sehingga arus lebih besar mengalir ke trafo dan menghasilkan SPL maksimal.',
      en: 'On a 100V line, the 2W tap lowers impedance to Z = V²/P = 100²/2 = 5,000 Ω, drawing higher current through the transformer for maximum SPL.',
    },
  },
  {
    id: 'q3_line_supervision',
    type: 'diagnostic',
    title: {
      id: 'Studi Kasus 3: Diagnosis Gangguan Jalur Speaker',
      en: 'Case Study 3: Speaker Line Fault Diagnosis',
    },
    scenario: {
      id: 'Muat kondisi gangguan ke sistem dan amati layar OLED NCU, LED Fault, serta panel telemetri di bawah. Apa penyebab gangguan yang terdeteksi oleh Line Supervision Module?',
      en: 'Load the fault condition into the 3D simulation and inspect the NCU OLED display, Fault LED, and telemetry bar. What fault did the Line Supervision Module detect?',
    },
    setupPatch: {
      faults: {
        facpFireAlarm: false,
        speakerLineFault: 'open',
        primaryEthernetCut: false,
        acMainsCut: false,
      },
    },
    options: [
      {
        id: 'open_circuit',
        label: {
          id: 'Kabel jalur speaker putus (Open Circuit — Arus supervisi DC = 0 mA, Impedansi tak terhingga)',
          en: 'Broken speaker cable (Open Circuit — DC supervision = 0 mA, Infinite impedance)',
        },
      },
      {
        id: 'short_circuit',
        label: {
          id: 'Korsleting antar konduktor (Short Circuit — Arus supervisi melonjak > 45 mA)',
          en: 'Conductor short circuit (Short Circuit — DC supervision spikes > 45 mA)',
        },
      },
      {
        id: 'ac_failure',
        label: {
          id: 'Pemadaman catu daya utama 220V AC (Failover ke 24V DC UPS)',
          en: '220V AC mains power loss (Failover to 24V DC UPS)',
        },
      },
    ],
    correctOptionId: 'open_circuit',
    explanation: {
      id: 'Ketika kabel jalur 100V putus, arus DC supervisi jatuh ke 0.0 mA dan impedansi terbaca > 99 kΩ, sehingga NCU menyalakan LED Fault dan menampilkan FAULT: OPEN LINE.',
      en: 'When the 100V speaker line opens, DC supervision drops to 0.0 mA and impedance reads > 99 kΩ, triggering the Fault LED and FAULT: OPEN LINE.',
    },
  },
  {
    id: 'q4_dc_capacitor',
    type: 'diagnostic',
    title: {
      id: 'Studi Kasus 4: Fungsi DC Blocking Capacitor',
      en: 'Case Study 4: Role of the DC Blocking Capacitor',
    },
    scenario: {
      id: 'Pada modul Public Address Ceiling Speaker, mengapa terdapat DC Blocking Capacitor secara seri sebelum Line Matching Transformer?',
      en: 'Inside the Public Address Ceiling Speaker, why is a DC Blocking Capacitor wired in series before the Line Matching Transformer?',
    },
    options: [
      {
        id: 'block_dc_pass_ac',
        label: {
          id: 'Memblokir arus DC supervisi agar tidak bocor/terbuang di lilitan trafo sambil meloloskan sinyal audio AC',
          en: 'Blocks DC supervision current from shorting through the transformer while passing AC audio signals',
        },
      },
      {
        id: 'boost_voltage',
        label: {
          id: 'Menaikkan tegangan suara dari 24V DC menjadi 100V AC',
          en: 'Steps up audio voltage from 24V DC to 100V AC',
        },
      },
      {
        id: 'cool_magnet',
        label: {
          id: 'Mendinginkan kumparan voice coil saat volume penuh',
          en: 'Cools the voice coil during full-volume broadcasts',
        },
      },
    ],
    correctOptionId: 'block_dc_pass_ac',
    explanation: {
      id: 'Kapasitor memiliki impedansi tak terhingga untuk arus DC (f = 0 Hz) namun sangat rendah untuk audio AC, sehingga Line Supervision NCU dapat memantau kabel tanpa mengganggu speaker.',
      en: 'A capacitor presents infinite impedance to DC (f = 0 Hz) while passing AC audio freely, letting the NCU supervise line continuity without saturating the transformer.',
    },
  },
  {
    id: 'q5_facp_override',
    type: 'configuration',
    title: {
      id: 'Studi Kasus 5: Uji Priority Override Kebakaran (FACP)',
      en: 'Case Study 5: FACP Fire Alarm Priority Override',
    },
    scenario: {
      id: 'Simulasikan kondisi darurat kebakaran dari Fire Alarm Control Panel (FACP) sehingga BGM otomatis terputus dan pesan evakuasi aktif di seluruh zona (Zona A, B, dan C).',
      en: 'Trigger an emergency fire alarm from the FACP GPIO panel so BGM is automatically muted and the evacuation broadcast overrides all zones (A, B, and C).',
    },
    setupPatch: {
      bgmPlaying: true,
      faults: { facpFireAlarm: false, speakerLineFault: 'normal', primaryEthernetCut: false, acMainsCut: false },
      matrix: {
        micToZones: { A: false, B: true, C: false },
        bgmToZones: { A: false, B: false, C: true },
      },
    },
    validateConfig: (state: SimulationState, telemetry: SystemTelemetry) => {
      return (
        state.faults.facpFireAlarm &&
        telemetry.priorityState === 'emergency' &&
        telemetry.zones.A.activeBroadcast === 'emergency' &&
        telemetry.zones.B.activeBroadcast === 'emergency' &&
        telemetry.zones.C.activeBroadcast === 'emergency'
      );
    },
    explanation: {
      id: 'Sinyal dry-contact GPIO dari FACP memicu Priority Override Circuit pada NCU, memutus seluruh BGM/paging reguler dan menyiarkan pesan evakuasi pada level maksimum.',
      en: 'The FACP dry-contact GPIO signal activates the NCU Priority Override Circuit, muting all BGM/regular paging and broadcasting the evacuation message at maximum level.',
    },
  },
  {
    id: 'q6_sensors_thermal_current',
    type: 'diagnostic',
    title: {
      id: 'Studi Kasus 6: Pembacaan Sensor Arus & Suhu Saat Beban Tinggi',
      en: 'Case Study 6: Current & Temperature Sensor Diagnostics',
    },
    scenario: {
      id: 'Muat skenario ini, lalu periksa sensor arus listrik (Hall-Effect ACS712) dan sensor suhu (DS18B20) pada telemetri bawah. Apa kondisi yang sedang terjadi pada NCU?',
      en: 'Load this scenario, then inspect the electrical current sensor (Hall-Effect ACS712) and temperature sensor (DS18B20) in the telemetry bar. What condition is occurring on the NCU?',
    },
    setupPatch: {
      faults: {
        facpFireAlarm: true,
        speakerLineFault: 'normal',
        primaryEthernetCut: false,
        acMainsCut: true,
        coolingFanBlocked: true,
      },
    },
    options: [
      {
        id: 'ups_thermal_warn',
        label: {
          id: 'NCU disuplai baterai 24V DC UPS dan suhu heatsink melewati ambang kritis (>72°C) akibat kipas pendingin terhambat',
          en: 'NCU is running on 24V DC UPS battery while heatsink temperature exceeds critical threshold (>72°C) due to blocked cooling fan',
        },
      },
      {
        id: 'open_line_only',
        label: {
          id: 'Jalur speaker terputus dengan suhu normal di bawah 30°C',
          en: 'Speaker line is open-circuit with normal temperature below 30°C',
        },
      },
      {
        id: 'short_circuit_only',
        label: {
          id: 'Korsleting pada mikrofon gooseneck tanpa suplai cadangan',
          en: 'Short circuit inside the gooseneck microphone with no backup power',
        },
      },
    ],
    correctOptionId: 'ups_thermal_warn',
    explanation: {
      id: 'Sensor Arus Hall-Effect pada bus 24V DC UPS membaca tarikan arus baterai (>0.65 A), sementara sensor suhu DS18B20 di heatsink mendeteksi kenaikan suhu kritis akibat kipas terhambat saat beban evakuasi.',
      en: 'The Hall-Effect sensor on the 24V DC UPS bus reports battery current draw (>0.65 A), while the heatsink DS18B20 sensor detects critical thermal rise due to blocked cooling airflow.',
    },
  },
];

import { AnatomyPartInfo, ComponentId } from '../sim/types';

export const ANATOMY_PARTS: AnatomyPartInfo[] = [
  // ================= MODULE 1: GOOSENECK MICROPHONE =================
  {
    id: 'mic_windshield',
    component: 'mic',
    subsystem: { id: 'Akustik Mekanik', en: 'Acoustic Mechanics' },
    name: {
      id: 'Windshield (Busa Pelindung)',
      en: 'Foam Windshield',
    },
    functionDesc: {
      id: 'Busa berpori di ujung kepala mikrofon yang meredam suara hembusan angin, letupan napas (pop), dan kebisingan aliran udara eksternal.',
      en: 'Open-cell acoustic foam covering the microphone head to attenuate wind gusts, vocal plosives, and ambient air turbulence.',
    },
    specs: {
      id: 'Material: Open-cell Polyurethane Foam · Redaman angin: -18.5 dB @ 120 Hz',
      en: 'Material: Open-cell Polyurethane Foam · Wind Attenuation: -18.5 dB @ 120 Hz',
    },
    signalRole: {
      id: 'Filter akustik pasif pertama sebelum gelombang tekanan suara menyentuh diafragma kapsul.',
      en: 'First passive acoustic filter before sound pressure waves reach the capsule diaphragm.',
    },
  },
  {
    id: 'mic_capsule',
    component: 'mic',
    subsystem: { id: 'Transduser Elektro-Akustik', en: 'Electro-Acoustic Transducer' },
    name: {
      id: 'Capsule Microphone',
      en: 'Microphone Capsule',
    },
    functionDesc: {
      id: 'Komponen inti di dalam kepala mikrofon yang menangkap gelombang tekanan suara melalui diafragma kondensor dan mengubahnya menjadi sinyal listrik analog.',
      en: 'Core transducer inside the mic head that captures acoustic pressure via a condenser diaphragm and converts it into low-voltage analog electrical signals.',
    },
    specs: {
      id: 'Tipe: Back-Electret Condenser (Cardioid) · Respon: 80 Hz – 16 kHz · Suplai: +48V Phantom',
      en: 'Type: Back-Electret Condenser (Cardioid) · Response: 80 Hz – 16 kHz · Power: +48V Phantom',
    },
    signalRole: {
      id: 'Mengubah energi mekanik gelombang akustik menjadi sinyal analog level mikrofon (-55 dBV).',
      en: 'Converts mechanical acoustic waves into mic-level analog voltage (-55 dBV).',
    },
  },
  {
    id: 'mic_gooseneck',
    component: 'mic',
    subsystem: { id: 'Artikulasi Posisi', en: 'Positional Articulation' },
    name: {
      id: 'Gooseneck (Leher Fleksibel)',
      en: 'Flexible Gooseneck Arm',
    },
    functionDesc: {
      id: 'Batang logam fleksibel berlapis spiral yang memungkinkan operator menekuk dan mengarahkan posisi kapsul mikrofon secara ergonomis.',
      en: 'Articulated spiral-wound metallic neck allowing operators to bend and aim the microphone capsule ergonomically.',
    },
    specs: {
      id: 'Panjang: 420 mm · Baja fleksibel berlapis anodized matte · Sudut tekuk ±45°',
      en: 'Length: 420 mm · Matte-anodized flexible steel · Bend range ±45°',
    },
    signalRole: {
      id: 'Melindungi jalur kabel internal sekaligus menjaga sudut penangkapan suara optimal terhadap mulut pembicara.',
      en: 'Shields internal conductors while maintaining optimal off-axis rejection and vocal pickup angle.',
    },
  },
  {
    id: 'mic_cable',
    component: 'mic',
    subsystem: { id: 'Konduktor Internal', en: 'Internal Wiring' },
    name: {
      id: 'Kabel Internal (Shielded Conductor)',
      en: 'Internal Shielded Conductor',
    },
    functionDesc: {
      id: 'Jalur penghantar berpelindung noise di dalam leher fleksibel yang mengalirkan sinyal audio seimbang dari capsule menuju bagian base.',
      en: 'Shielded twisted-pair conductor inside the gooseneck routing balanced low-voltage audio from the capsule down to the base.',
    },
    specs: {
      id: 'Konfigurasi: Balanced Twisted Pair + Copper Braided Shield · Impedansi: 200 Ω',
      en: 'Topology: Balanced Twisted Pair + Braided Shield · Impedance: 200 Ω',
    },
    signalRole: {
      id: 'Menyalurkan sinyal analog bertegangan rendah menuju sakelar PTT dengan penolakan interferensi EMI.',
      en: 'Carries low-voltage analog audio toward the PTT switch with high EMI rejection.',
    },
  },
  {
    id: 'mic_ptt',
    component: 'mic',
    subsystem: { id: 'Kontrol Gerbang Suara', en: 'Audio Gate Control' },
    name: {
      id: 'Tombol PTT (Push-to-Talk)',
      en: 'PTT (Push-to-Talk) Switch',
    },
    functionDesc: {
      id: 'Sakelar taktil pada dudukan mikrofon dengan cincin indikator LED untuk membuka atau menutup gerbang sinyal suara dan memicu kontrol paging ke NCU.',
      en: 'Tactile base switch with status LED ring that gates microphone audio and sends paging priority triggers to the NCU.',
    },
    specs: {
      id: 'Kontak: Momentary / Latching + GPIO Trigger · Indikator LED Merah/Hijau',
      en: 'Contacts: Momentary / Latching + GPIO Trigger · Status LED Ring',
    },
    signalRole: {
      id: 'Mengisolasi sinyal mikrofon saat standby sehingga hanya aktif ketika operator menekan/mengunci tombol PTT.',
      en: 'Keeps the mic line muted at rest and opens the audio path only when pressed or latched.',
    },
  },
  {
    id: 'mic_base',
    component: 'mic',
    subsystem: { id: 'Penopang & Keluaran', en: 'Base & Output Interface' },
    name: {
      id: 'Base (Dudukan) & Connector XLR',
      en: 'Weighted Base & XLR Connector',
    },
    functionDesc: {
      id: 'Pemberat dasar anti-getar meja dengan port keluaran fisik XLR 3-pin seimbang untuk menyambungkan mikrofon ke NCU/Mixer.',
      en: 'Shock-isolated weighted die-cast base housing a balanced 3-pin XLR output connector leading to the NCU/Mixer.',
    },
    specs: {
      id: 'Port: 3-Pin XLR Male Balanced · Bobot Dasar: 1.15 kg · Bantalan anti-resonansi',
      en: 'Port: 3-Pin Balanced XLR Male · Base Weight: 1.15 kg · Isolation Pad',
    },
    signalRole: {
      id: 'Titik antarmuka keluaran sinyal listrik analog seimbang dan daya +48V Phantom dari NCU.',
      en: 'Physical interface transmitting balanced analog audio to the NCU while receiving +48V Phantom power.',
    },
  },
  {
    id: 'sensor_sound_mic',
    component: 'mic',
    subsystem: { id: 'Sensor Instrumentasi (Suara)', en: 'Instrumentation Sensor (Sound)' },
    name: {
      id: 'Sensor Suara: MEMS SPL Ambient Monitor (INMP441)',
      en: 'Sound Sensor: MEMS SPL Ambient Monitor (INMP441)',
    },
    functionDesc: {
      id: 'Sensor suara referensi di meja operator (dekat kapsul Gooseneck Mic) untuk mengukur tekanan akustik vokal, kebisingan latar ruang kontrol, dan efektivitas redaman busa windshield.',
      en: 'Reference acoustic sensor at the operator desk (near the Gooseneck capsule) measuring vocal SPL, control-room ambient noise, and windshield attenuation.',
    },
    specs: {
      id: 'Jenis: MEMS Digital I2S SPL (INMP441 / IEC 61672 Class 2) · Letak: Meja Operator ATC / Pangkal Leher Mic (Zona A)',
      en: 'Type: MEMS Digital I2S SPL (INMP441 / IEC 61672 Class 2) · Placement: ATC Operator Desk / Mic Neck (Zone A)',
    },
    signalRole: {
      id: 'Mengirimkan data tingkat kebisingan (dB SPL) ke DSP NCU untuk fitur Noise Cancelling dan deteksi wind-pop.',
      en: 'Streams ambient dB SPL telemetry to the NCU DSP for noise cancellation and wind-gust detection.',
    },
  },

  // ================= MODULE 2: NETWORK CONTROL UNIT (NCU) =================
  {
    id: 'ncu_cpu',
    component: 'ncu',
    subsystem: { id: '1. Pemrosesan & Kontrol Inti', en: '1. Core Processing & Control' },
    name: {
      id: 'Main CPU / System Controller',
      en: 'Main CPU / System Controller',
    },
    functionDesc: {
      id: 'Prosesor utama yang menjalankan perangkat lunak manajemen sistem PA, penjadwalan otomatis (scheduled chime/message), dan mesin logika prioritas siaran.',
      en: 'Primary system processor executing PA management firmware, automated chime scheduling, and broadcast priority arbitration.',
    },
    specs: {
      id: 'Arsitektur: Dual-Core ARM Cortex · Prioritas: FACP Emergency > Paging > Chime > BGM',
      en: 'Architecture: Dual-Core ARM Cortex · Priority: FACP Emergency > Paging > Chime > BGM',
    },
    signalRole: {
      id: 'Mengatur rute mana yang berhak mengambil alih amplifier berdasarkan level prioritas secara real-time.',
      en: 'Arbitrates which audio source takes control of each zone output based on priority state.',
    },
  },
  {
    id: 'ncu_dsp',
    component: 'ncu',
    subsystem: { id: '1. Pemrosesan & Kontrol Inti', en: '1. Core Processing & Control' },
    name: {
      id: 'Digital Signal Processor (DSP)',
      en: 'Digital Signal Processor (DSP)',
    },
    functionDesc: {
      id: 'Chip pengolah sinyal audio real-time untuk Equalizer (Bass/Mid/Treble), Compressor/Limiter, Feedback Suppressor, dan Noise Cancelling.',
      en: 'Dedicated real-time audio processor handling Parametric EQ, Compressor/Limiter, Feedback Suppression, and Noise Cancelling.',
    },
    specs: {
      id: 'Sampling: 48 kHz / 24-bit · Latensi DSP < 1.8 ms · 3-Band EQ + Dynamics',
      en: 'Sample Rate: 48 kHz / 24-bit · DSP Latency < 1.8 ms · 3-Band EQ + Dynamics',
    },
    signalRole: {
      id: 'Membentuk kejernihan vokal pengumuman dan mencegah distorsi/feedback sebelum sinyal masuk ke matriks zona.',
      en: 'Shapes vocal intelligibility and prevents clipping or acoustic feedback before zone routing.',
    },
  },
  {
    id: 'ncu_matrix',
    component: 'ncu',
    subsystem: { id: '1. Pemrosesan & Kontrol Inti', en: '1. Core Processing & Control' },
    name: {
      id: 'Audio Matrix Router',
      en: 'Audio Matrix Router',
    },
    functionDesc: {
      id: 'Matriks sakelar digital (switching matrix) yang mengarahkan sumber input (Mic Paging, BGM, Pesan Evakuasi) ke zona speaker tertentu (Zona A, B, C).',
      en: 'Digital crosspoint switching matrix routing input sources (Paging Mic, BGM, Evacuation Message) to independent speaker zones.',
    },
    specs: {
      id: 'Matriks: 8-In × 8-Zone Digital Crosspoint · Isolasi antar zona > 85 dB',
      en: 'Matrix: 8-In × 8-Zone Digital Crosspoint · Inter-zone Isolation > 85 dB',
    },
    signalRole: {
      id: 'Memungkinkan paging di Zona B berlangsung bersamaan tanpa memutus musik latar (BGM) di Zona C.',
      en: 'Enables simultaneous Zone B paging without interrupting background music in Zone C.',
    },
  },
  {
    id: 'ncu_flash',
    component: 'ncu',
    subsystem: { id: '1. Pemrosesan & Kontrol Inti', en: '1. Core Processing & Control' },
    name: {
      id: 'Internal Flash Memory / SD Card',
      en: 'Internal Flash Memory / SD Card',
    },
    functionDesc: {
      id: 'Media penyimpanan solid-state internal untuk file audio bawaan seperti nada chime bandara, BGM, dan rekaman pesan evakuasi darurat.',
      en: 'Solid-state onboard storage holding pre-recorded emergency evacuation messages, pre-announce chimes, and BGM tracks.',
    },
    specs: {
      id: 'Kapasitas: 16 GB Industrial Flash + SD Slot · Format: PCM WAV 48 kHz',
      en: 'Capacity: 16 GB Industrial Flash + SD Slot · Format: Uncompressed PCM WAV',
    },
    signalRole: {
      id: 'Menyuplai audio pesan evakuasi langsung ke jalur prioritas tertinggi saat FACP aktif meskipun jaringan eksternal terputus.',
      en: 'Feeds fail-safe evacuation audio directly during FACP override even if external audio sources fail.',
    },
  },
  {
    id: 'ncu_preamp',
    component: 'ncu',
    subsystem: { id: '2. Input & Output Audio', en: '2. Audio I/O & Mixing' },
    name: {
      id: 'Mic Pre-Amp, +48V Phantom & ADC/DAC',
      en: 'Mic Pre-Amp, +48V Phantom & ADC/DAC',
    },
    functionDesc: {
      id: 'Menguatkan sinyal lemah dari mikrofon paging (+48V Phantom Power untuk kondensor) serta mengonversi sinyal analog menjadi data digital (ADC) dan sebaliknya (DAC).',
      en: 'Boosts weak mic signals with selectable +48V Phantom Power and converts analog audio to digital streams (ADC) and back (DAC).',
    },
    specs: {
      id: 'Gain: -12 to +24 dB · Phantom: +48V DC · Konversi: 24-bit Sigma-Delta ADC/DAC',
      en: 'Gain: -12 to +24 dB · Phantom: +48V DC · Conversion: 24-bit Sigma-Delta ADC/DAC',
    },
    signalRole: {
      id: 'Jembatan konversi antara domain sinyal listrik analog mikrofon/amplifier dan domain pemrosesan digital.',
      en: 'Bridges analog electrical mic signals into digital DSP/IP packets and back to analog line output.',
    },
  },
  {
    id: 'ncu_io_rear',
    component: 'ncu',
    subsystem: { id: '2. Input & Output Audio', en: '2. Audio I/O & Mixing' },
    name: {
      id: 'Analog Audio I/O (XLR, TRS, Line Out)',
      en: 'Analog Audio I/O (XLR, TRS, Line Out)',
    },
    functionDesc: {
      id: 'Port konektor fisik belakang untuk input mikrofon/BGM eksternal serta keluaran daya 70V/100V ke jalur speaker terzonasi.',
      en: 'Rear physical I/O terminals for external analog sources and 70V/100V speaker zone line outputs.',
    },
    specs: {
      id: 'Input: XLR Balanced, TRS, RCA · Output: 70V/100V Constant Voltage & Pre-Out',
      en: 'Inputs: Balanced XLR, TRS, RCA · Outputs: 70V/100V Constant Voltage & Pre-Out',
    },
    signalRole: {
      id: 'Menghubungkan NCU ke perangkat keras mikrofon di meja operator dan kabel speaker jarak jauh di plafon terminal.',
      en: 'Physical link connecting operator desk microphones and long-run 70V/100V ceiling speaker lines.',
    },
  },
  {
    id: 'ncu_nic',
    component: 'ncu',
    subsystem: { id: '3. Jaringan & Komunikasi', en: '3. Networking & Communications' },
    name: {
      id: 'Dual-Port NIC (RJ45) & PoE / Fiber SFP',
      en: 'Dual-Port NIC (RJ45) & PoE / Fiber SFP',
    },
    functionDesc: {
      id: 'Antarmuka jaringan audio berbasis IP (Dante, AES67, CobraNet) dengan redundansi LAN-A/LAN-B, port PoE, serta slot transceiver serat optik (SFP) bebas interferensi EMI.',
      en: 'Redundant dual-port Gigabit Ethernet (Dante/AES67), PoE power delivery, and EMI-immune Fiber Optic SFP transceiver.',
    },
    specs: {
      id: 'Protokol: Dante / AES67 / IGMP Multicast · Redundansi: Primary LAN-A + Failover LAN-B · SFP 1Gbps',
      en: 'Protocols: Dante / AES67 / IGMP Multicast · Redundancy: Dual-NIC Failover · 1Gbps Fiber SFP',
    },
    signalRole: {
      id: 'Mengirimkan paket audio IP terenkapsulasi antar gedung terminal bandara dan berpindah otomatis ke LAN-B jika LAN-A putus.',
      en: 'Transports IP audio packets across airport terminals with zero-drop failover to LAN-B if LAN-A fails.',
    },
  },
  {
    id: 'ncu_facp',
    component: 'ncu',
    subsystem: { id: '4. Darurat & Otomasi', en: '4. Emergency & Integration' },
    name: {
      id: 'GPIO / FACP Relays & Line Supervision',
      en: 'GPIO / FACP Relays & Line Supervision',
    },
    functionDesc: {
      id: 'Terminal integrasi Fire Alarm Control Panel (FACP), sirkuit Priority Override, dan modul pemantau impedansi jalur kabel speaker secara real-time.',
      en: 'Dry-contact GPIO interface to the Fire Alarm Control Panel (FACP), Priority Override relay, and real-time DC impedance Line Supervision.',
    },
    specs: {
      id: 'Deteksi Fault: < 2 detik (Open/Short Circuit) · Sinyal Supervisi: Arus DC konstan ~12.4 mA',
      en: 'Fault Detection: < 2 sec (Open/Short Circuit) · Supervision Signal: ~12.4 mA DC',
    },
    signalRole: {
      id: 'Mendeteksi kabel putus/korsleting melalui perubahan arus DC serta memicu pesan evakuasi prioritas utama saat kebakaran.',
      en: 'Detects broken or shorted speaker lines via DC impedance shift and enforces emergency evacuation override.',
    },
  },
  {
    id: 'ncu_power',
    component: 'ncu',
    subsystem: { id: '5. Catu Daya & Antarmuka', en: '5. Power Supply & UI' },
    name: {
      id: 'Dual Power Supply (220V AC & 24V DC UPS)',
      en: 'Dual Power Supply (220V AC & 24V DC UPS)',
    },
    functionDesc: {
      id: 'Catu daya ganda yang menerima listrik utama 100–240V AC dan melakukan perpindahan mulus (failover) ke baterai cadangan 24V DC UPS saat listrik padam.',
      en: 'Redundant power supply accepting 100–240V AC mains with seamless automatic failover to 24V DC UPS battery backup.',
    },
    specs: {
      id: 'Input AC: 100–240V AC 50/60Hz · Backup DC: 24V DC UPS · Waktu Transisi: 0 ms (Hot-Swap)',
      en: 'AC Input: 100–240V AC 50/60Hz · DC Backup: 24V DC UPS · Transfer Time: 0 ms',
    },
    signalRole: {
      id: 'Menjaga kelangsungan siaran darurat dan supervisi jalur agar tidak pernah terputus saat pemadaman listrik gedung.',
      en: 'Ensures uninterrupted emergency broadcasting and line supervision during mains power blackouts.',
    },
  },
  {
    id: 'ncu_front',
    component: 'ncu',
    subsystem: { id: '5. Catu Daya & Antarmuka', en: '5. Power Supply & UI' },
    name: {
      id: 'Front Panel LCD, LED Indikator & Monitor Jack',
      en: 'Front Panel LCD, Status LEDs & Monitor Jack',
    },
    functionDesc: {
      id: 'Layar status OLED/LCD interaktif, indikator LED (Power, Signal/Peak, Network, Fault/Alarm), dan jack headphone untuk cue/monitoring lokal.',
      en: 'Interactive OLED/LCD status display, status LEDs (Power, Signal/Peak, Network, Fault/Alarm), and headphone cue monitoring jack.',
    },
    specs: {
      id: 'Display: Dual-line High-Contrast OLED · Jack Monitor: 6.35mm Stereo Cue Out',
      en: 'Display: Dual-line High-Contrast OLED · Monitor Jack: 6.35mm Stereo Cue Out',
    },
    signalRole: {
      id: 'Memberikan umpan balik visual status sistem secara langsung kepada operator serta pratinjau audio lokal tanpa ke publik.',
      en: 'Provides instant visual diagnostics to technicians and private audio preview before public paging.',
    },
  },
  {
    id: 'sensor_current_ncu',
    component: 'ncu',
    subsystem: { id: 'Sensor Instrumentasi (Arus)', en: 'Instrumentation Sensor (Current)' },
    name: {
      id: 'Sensor Arus Listrik: Hall-Effect ACS712-05B & Precision Shunt',
      en: 'Current Sensor: Hall-Effect ACS712-05B & Precision Shunt',
    },
    functionDesc: {
      id: 'Sensor arus non-invasif berbasis efek Hall dan resistor shunt presisi untuk membaca arus beban AC 70V/100V, arus supervisi DC (12.4 mA), serta arus baterai cadangan 24V DC UPS.',
      en: 'Hall-effect and precision shunt current sensor measuring 70V/100V AC line load current, DC supervision current (12.4 mA), and 24V DC UPS battery draw.',
    },
    specs: {
      id: 'Jenis: Hall-Effect IC (ACS712-05B) + 0.1Ω Shunt · Letak Pengujian: Terminal Output 70V/100V NCU & Bus 24V DC UPS',
      en: 'Type: Hall-Effect IC (ACS712-05B) + 0.1Ω Shunt · Placement: NCU 70V/100V Output Terminal & 24V DC UPS Bus',
    },
    signalRole: {
      id: 'Mendeteksi lonjakan arus korsleting (>4.8 A) atau putusnya arus (0 mA) secara real-time dalam < 2 detik untuk mengaktifkan proteksi NCU.',
      en: 'Detects short-circuit current spikes (>4.8 A) or open-line zero current in < 2 sec to trip NCU line protection.',
    },
  },
  {
    id: 'sensor_temp_ncu',
    component: 'ncu',
    subsystem: { id: 'Sensor Instrumentasi (Suhu)', en: 'Instrumentation Sensor (Temp)' },
    name: {
      id: 'Sensor Suhu: Digital Thermal Probe DS18B20 & NTC 10kΩ',
      en: 'Temperature Sensor: DS18B20 Digital Probe & 10kΩ NTC',
    },
    functionDesc: {
      id: 'Probe suhu digital 1-Wire dan termistor NTC untuk memantau temperatur heatsink amplifier kelas-D, CPU, serta modul catu daya PSU selama operasi siaran kontinu.',
      en: '1-Wire digital thermal probe and NTC thermistor monitoring Class-D amplifier heatsink, CPU, and PSU temperatures during continuous broadcast loads.',
    },
    specs: {
      id: 'Jenis: DS18B20 Digital (-55°C to +125°C, ±0.5°C) · Letak Pengujian: Sirip Heatsink Amplifier & Modul PSU NCU',
      en: 'Type: DS18B20 Digital (-55°C to +125°C, ±0.5°C) · Placement: NCU Amplifier Heatsink & PSU Module',
    },
    signalRole: {
      id: 'Memberikan peringatan thermal overheat (>72°C) bila kipas pendingin terhambat atau beban darurat FACP berjalan terlalu lama.',
      en: 'Triggers thermal overheat warnings (>72°C) when cooling airflow is blocked or sustained emergency loads occur.',
    },
  },

  // ================= MODULE 3: GENESIS CEILING SPEAKER =================
  {
    id: 'spk_grille',
    component: 'speaker',
    subsystem: { id: 'Anatomi Luar', en: 'External Assembly' },
    name: {
      id: 'Low-Profile Perforated Ceiling Grille',
      en: 'Low-Profile Perforated Ceiling Grille',
    },
    functionDesc: {
      id: 'Kisi-kisi penutup luar berlubang mikro yang rata dengan plafon untuk melindungi driver sekaligus menyebarkan gelombang suara secara merata.',
      en: 'Flush-mount micro-perforated acoustic grille protecting internal drivers while dispersing sound evenly across the zone.',
    },
    specs: {
      id: 'Material: Powder-coated Perforated Steel · Rasio Lubang Terbuka: 62% · Sudut Dispersi: 130°',
      en: 'Material: Powder-coated Perforated Steel · Open Area: 62% · Dispersion: 130°',
    },
    signalRole: {
      id: 'Pelindung mekanis sekaligus difuser gelombang akustik dari speaker cone menuju area ruangan.',
      en: 'Mechanical guard and acoustic wave diffuser coupling speaker cone energy into the room.',
    },
  },
  {
    id: 'spk_cone',
    component: 'speaker',
    subsystem: { id: 'Konversi Akustik', en: 'Acoustic Radiation' },
    name: {
      id: 'Full-Range Speaker Cone',
      en: 'Full-Range Speaker Cone',
    },
    functionDesc: {
      id: 'Kerucut getar berbahan kertas/komposit yang dirancang khusus untuk mereproduksi frekuensi vokal manusia dan pengumuman secara jernih.',
      en: 'Lightweight treated paper/composite diaphragm engineered for high vocal intelligibility in PA announcements.',
    },
    specs: {
      id: 'Diameter: 5-inch (127 mm) · Respon Frekuensi: 120 Hz – 15 kHz · Sensitivitas: 90 dB @ 1W/1m',
      en: 'Diameter: 5-inch (127 mm) · Frequency Response: 120 Hz – 15 kHz · Sensitivity: 90 dB @ 1W/1m',
    },
    signalRole: {
      id: 'Bergetar maju-mundur mengikuti gerakan voice coil untuk mendorong udara menjadi gelombang tekanan suara.',
      en: 'Reciprocates axially with the voice coil, displacing air into audible acoustic pressure waves.',
    },
  },
  {
    id: 'spk_voicecoil',
    component: 'speaker',
    subsystem: { id: 'Motor Elektromagnetik', en: 'Electromagnetic Motor' },
    name: {
      id: 'Voice Coil & Suspension (Spider)',
      en: 'Voice Coil & Suspension (Spider)',
    },
    functionDesc: {
      id: 'Kumparan kawat tembaga halus yang bergerak aksial di dalam celah magnet akibat Gaya Lorentz dan distabilkan secara presisi oleh suspensi spider.',
      en: 'Precision copper winding reciprocating axially inside the magnetic gap via Lorentz force, centered by the corrugated spider.',
    },
    specs: {
      id: 'Impedansi Driver: 8 Ω · Gulungan Tembaga Tahan Panas (Kapton Former)',
      en: 'Driver Impedance: 8 Ω · High-Temp Copper Winding on Kapton Former',
    },
    signalRole: {
      id: 'Mengubah sinyal arus listrik AC bertegangan rendah dari trafo menjadi gaya mekanik bolak-balik.',
      en: 'Converts stepped-down AC audio current from the transformer into linear mechanical motion.',
    },
  },
  {
    id: 'spk_magnet',
    component: 'speaker',
    subsystem: { id: 'Motor Elektromagnetik', en: 'Electromagnetic Motor' },
    name: {
      id: 'Permanent Magnet & Yoke Assembly',
      en: 'Permanent Magnet & Yoke Assembly',
    },
    functionDesc: {
      id: 'Magnet ferit permanen dan rumah baja (yoke) yang menciptakan medan magnet statis kuat di celah udara tempat voice coil bergerak.',
      en: 'Permanent ferrite magnet and steel yoke assembly generating a concentrated static magnetic flux across the air gap.',
    },
    specs: {
      id: 'Kerapatan Fluks: 1.15 Tesla · Material: Strontium Ferrite + Soft Iron Yoke',
      en: 'Flux Density: 1.15 Tesla · Material: Strontium Ferrite + Soft Iron Yoke',
    },
    signalRole: {
      id: 'Menyediakan medan magnet tetap sebagai pasangan interaksi Gaya Lorentz dengan arus listrik pada voice coil.',
      en: 'Provides the stationary magnetic field required for Lorentz force interaction with the voice coil.',
    },
  },
  {
    id: 'spk_transformer',
    component: 'speaker',
    subsystem: { id: 'Penyesuai Tegangan', en: 'Voltage Matching' },
    name: {
      id: '25V/70V/100V Line Matching Transformer',
      en: '25V/70V/100V Line Matching Transformer',
    },
    functionDesc: {
      id: 'Trafo step-down khusus sistem PA yang menurunkan tegangan tinggi jalur transmisi (70V/100V) menjadi tegangan kerja rendah sesuai impedansi 8 Ω driver.',
      en: 'Multi-tap step-down audio transformer converting 70V/100V constant-voltage distribution down to 8 Ω driver levels.',
    },
    specs: {
      id: 'Primer: 25V / 70V / 100V Multi-Tap · Sekunder: 8 Ω · Inti Baja Silikon Berlaminasi',
      en: 'Primary: 25V / 70V / 100V Multi-Tap · Secondary: 8 Ω · Laminated Silicon Steel Core',
    },
    signalRole: {
      id: 'Memungkinkan kabel jarak jauh membawa sinyal bertegangan tinggi dengan rugi daya rendah lalu menurunkannya tepat di speaker.',
      en: 'Allows low-loss high-voltage transmission across long terminal runs before stepping down at each ceiling unit.',
    },
  },
  {
    id: 'spk_tap',
    component: 'speaker',
    subsystem: { id: 'Penyesuai Daya', en: 'Power Selection' },
    name: {
      id: 'Wattage Tap Selector Switch',
      en: 'Wattage Tap Selector Switch',
    },
    functionDesc: {
      id: 'Sakelar putar 3D untuk memilih daya konsumsi speaker (1/4W, 1/2W, 1W, atau 2W) sesuai tingkat kebisingan ruangan.',
      en: 'Rotary tap switch allowing technicians to set power draw (1/4W, 1/2W, 1W, or 2W) to match room acoustics.',
    },
    specs: {
      id: 'Pilihan Daya (100V): 0.25W (40kΩ) · 0.5W (20kΩ) · 1W (10kΩ) · 2W (5kΩ)',
      en: 'Tap Ratings (100V): 0.25W (40kΩ) · 0.5W (20kΩ) · 1W (10kΩ) · 2W (5kΩ)',
    },
    signalRole: {
      id: 'Mengatur rasio lilitan primer trafo yang secara langsung menentukan SPL dan radius jangkauan gelombang akustik.',
      en: 'Selects primary winding turns, directly controlling acoustic SPL and coverage radius.',
    },
  },
  {
    id: 'spk_terminal',
    component: 'speaker',
    subsystem: { id: 'Supervisi & Proteksi', en: 'Supervision & Protection' },
    name: {
      id: 'Terminal Block & DC Blocking Capacitor',
      en: 'Terminal Block & DC Blocking Capacitor',
    },
    functionDesc: {
      id: 'Terminal sambungan kabel jalur 70V/100V yang dilengkapi kapasitor pemblokir arus DC supervisi agar tidak mengganggu koil speaker.',
      en: 'Screw-clamp line terminal paired with a series DC Blocking Capacitor to isolate DC line supervision current from the transformer.',
    },
    specs: {
      id: 'Kapasitor: 2.2 µF / 250V Non-Polarized Film · Terminal: Keramik Tahan Api',
      en: 'Capacitor: 2.2 µF / 250V Non-Polarized Film · Terminal: Fire-Rated Ceramic Block',
    },
    signalRole: {
      id: 'Memblokir arus DC pemantauan kabel (supervisi) sambil meloloskan sinyal audio AC ke sakelar wattage tap.',
      en: 'Blocks DC line-supervision current while passing AC audio signals cleanly into the tap selector.',
    },
  },
  {
    id: 'spk_backcan',
    component: 'speaker',
    subsystem: { id: 'Proteksi Mekanis', en: 'Mechanical Enclosure' },
    name: {
      id: 'Mounting Baffle & Steel Backcan / Enclosure',
      en: 'Mounting Baffle & Steel Backcan / Enclosure',
    },
    functionDesc: {
      id: 'Rumah pelindung baja belakang dan mekanisme klem plafon untuk proteksi mekanis, keselamatan kebakaran (fire-rated), serta ruang akustik tertutup.',
      en: 'Heavy-gauge stamped steel fire-dome backcan and spring-clamp baffle for fire safety, acoustic isolation, and secure ceiling mounting.',
    },
    specs: {
      id: 'Material: Galvanized Steel Dome · Klem Plafon: Torsion Spring / Dog-Ear Clamps',
      en: 'Material: Galvanized Steel Dome · Mount: Torsion Spring / Dog-Ear Clamps',
    },
    signalRole: {
      id: 'Mencegah kebocoran gelombang suara belakang (rear wave cancellation) dan melindungi sambungan listrik dari api.',
      en: 'Prevents rear-wave acoustic cancellation and houses fire-protected line connections.',
    },
  },
  {
    id: 'sensor_sound_spk',
    component: 'speaker',
    subsystem: { id: 'Sensor Instrumentasi (Suara)', en: 'Instrumentation Sensor (Sound)' },
    name: {
      id: 'Sensor Suara: MEMS SPL Meter (INMP441 / IEC 61672)',
      en: 'Sound Sensor: MEMS SPL Meter (INMP441 / IEC 61672)',
    },
    functionDesc: {
      id: 'Sensor akustik yang ditempatkan di tepi baffle plafon speaker dan area ruang tunggu terminal untuk mengukur tekanan suara (dB SPL) aktual hasil pemilihan Wattage Tap (1/4W–2W).',
      en: 'Acoustic SPL probe mounted on the speaker ceiling baffle rim and terminal hall to verify actual dB SPL produced by the selected Wattage Tap (1/4W–2W).',
    },
    specs: {
      id: 'Jenis: MEMS Digital SPL Sensor (INMP441) · Letak Pengujian: Baffle Plafon Speaker (Zona B) & Ruang Tunggu Terminal (Zona C)',
      en: 'Type: MEMS Digital SPL Sensor (INMP441) · Placement: Speaker Ceiling Baffle (Zone B) & Terminal Waiting Hall (Zone C)',
    },
    signalRole: {
      id: 'Mengukur rasio Signal-to-Noise (SNR) ruangan secara langsung dan memvalidasi keterbacaan pengumuman terhadap kebisingan latar.',
      en: 'Measures real-time room Signal-to-Noise Ratio (SNR) and validates announcement intelligibility against ambient noise.',
    },
  },
  {
    id: 'sensor_temp_spk',
    component: 'speaker',
    subsystem: { id: 'Sensor Instrumentasi (Suhu)', en: 'Instrumentation Sensor (Temp)' },
    name: {
      id: 'Sensor Suhu: Termistor NTC 10kΩ Voice Coil',
      en: 'Temperature Sensor: Voice Coil 10kΩ NTC Thermistor',
    },
    functionDesc: {
      id: 'Sensor suhu termistor yang ditempelkan pada rumah magnet (yoke) & kumparan voice coil speaker untuk memantau pemanasan koil saat bekerja pada daya 2W atau siaran darurat terus-menerus.',
      en: 'NTC thermistor mounted on the permanent magnet yoke & voice coil assembly to monitor thermal dissipation at 2W tap or continuous emergency broadcasts.',
    },
    specs: {
      id: 'Jenis: NTC 10kΩ High-Temp Bead Thermistor · Letak Pengujian: Yoke Magnet & Voice Coil Speaker Plafon',
      en: 'Type: NTC 10kΩ High-Temp Bead Thermistor · Placement: Ceiling Speaker Magnet Yoke & Voice Coil',
    },
    signalRole: {
      id: 'Mencegah kerusakan isolasi kawat tembaga voice coil akibat disipasi panas berlebih pada durasi siaran darurat panjang.',
      en: 'Protects voice coil enamel insulation from thermal overload during extended emergency announcements.',
    },
  },

  // ================= MODULE 4: SOUND SENSOR (INMP441) + ESP32-WROOM-32 =================
  {
    id: 's_snd_esp32',
    component: 'sensor_sound',
    subsystem: { id: 'Mikrokontroler I2S', en: 'I2S Microcontroller' },
    name: {
      id: 'ESP32-WROOM-32 DevKit v1 (Dual-Core 240 MHz)',
      en: 'ESP32-WROOM-32 DevKit v1 (Dual-Core 240 MHz)',
    },
    functionDesc: {
      id: 'Mikrokontroler utama dengan modul RF Wi-Fi/BLE dan periferal I2S DMA hardware yang menerima aliran data audio digital 24-bit langsung dari sensor INMP441 untuk menghitung tingkat kebisingan dB(A) SPL.',
      en: 'Main microcontroller featuring hardware I2S DMA peripherals and Wi-Fi telemetry, ingesting 24-bit digital audio frames from the INMP441 to compute real-time dB(A) SPL.',
    },
    specs: {
      id: 'MCU: Xtensa Dual-Core 32-bit 240 MHz · Logika GPIO: 3.3V · Bus: I2S0 (GPIO 26 SCK, GPIO 22 WS, GPIO 21 SD)',
      en: 'MCU: Xtensa Dual-Core 32-bit 240 MHz · GPIO Logic: 3.3V · Bus: I2S0 (GPIO 26 SCK, GPIO 22 WS, GPIO 21 SD)',
    },
    signalRole: {
      id: 'Membangkitkan clock BCLK/LRCLK untuk INMP441 dan melakukan komputasi RMS logaritmik ke skala IEC 61672 Class 2.',
      en: 'Generates BCLK/LRCLK clocks for the INMP441 and performs logarithmic RMS-to-SPL computation per IEC 61672 Class 2.',
    },
  },
  {
    id: 's_snd_inmp441',
    component: 'sensor_sound',
    subsystem: { id: 'Modul Sensor Akustik', en: 'Acoustic Sensor Module' },
    name: {
      id: 'Breakout Board MEMS Digital INMP441',
      en: 'INMP441 MEMS Digital Breakout Board',
    },
    functionDesc: {
      id: 'Papan modul mikrofon omnidirectional MEMS berpresisi tinggi dengan output digital I2S langsung tanpa memerlukan rangkaian pre-amp atau ADC analog tambahan.',
      en: 'High-SNR omnidirectional MEMS microphone breakout outputting direct I2S digital audio without external analog pre-amps or ADCs.',
    },
    specs: {
      id: 'Sensitivitas: -26 dBFS · SNR: 61 dBA · Max Acoustic Input: 120 dB SPL · Catu: 1.8V–3.3V DC',
      en: 'Sensitivity: -26 dBFS · SNR: 61 dBA · Max Acoustic Input: 120 dB SPL · Supply: 1.8V–3.3V DC',
    },
    signalRole: {
      id: 'Mengukur tekanan akustik aktual pada lokasi uji (Baffle Speaker Zona B, Terminal Zona C, atau Meja Mic Zona A).',
      en: 'Captures live acoustic SPL at the selected test location (Zone B Speaker Baffle, Zone C Terminal, or Zone A Mic Desk).',
    },
  },
  {
    id: 's_snd_mems_core',
    component: 'sensor_sound',
    subsystem: { id: 'Transduser & Modulator', en: 'MEMS & Modulator Core' },
    name: {
      id: 'Cincin Port Akustik & Modulator Sigma-Delta 24-Bit',
      en: 'Acoustic Port Ring & 24-Bit Sigma-Delta ADC',
    },
    functionDesc: {
      id: 'Diafragma silikon mikroskopis (MEMS) berlapis pelindung logam emas yang langsung dikopel ke pengondisi sinyal dan modulator Sigma-Delta 24-bit di dalam satu paket IC.',
      en: 'Micro-machined silicon MEMS diaphragm beneath a gold acoustic ring coupled directly to an internal 24-bit Sigma-Delta modulator.',
    },
    specs: {
      id: 'Respon Frekuensi Datar: 60 Hz – 15 kHz · Resolusi: 24-bit Two’s Complement PCM',
      en: 'Flat Frequency Response: 60 Hz – 15 kHz · Resolution: 24-bit Two’s Complement PCM',
    },
    signalRole: {
      id: 'Mengubah getaran udara akustik menjadi bitstream I2S tahan derau EMI sebelum dikirim melalui pin SD.',
      en: 'Converts airborne acoustic waves into EMI-immune I2S serial bitstreams transmitted over the SD pin.',
    },
  },
  {
    id: 's_snd_wiring',
    component: 'sensor_sound',
    subsystem: { id: 'Antarmuka Kabel I2S', en: 'I2S Wiring Harness' },
    name: {
      id: 'Harness Bus I2S 3.3V (VDD, GND, SCK, WS, SD, L/R)',
      en: '3.3V I2S Bus Harness (VDD, GND, SCK, WS, SD, L/R)',
    },
    functionDesc: {
      id: 'Jalur koneksi 6-pin antara INMP441 dan ESP32 dengan tegangan referensi 3.3V ketat serta pin L/R ditarik ke GND untuk mode kanal kiri mono.',
      en: '6-wire digital interconnect linking INMP441 to ESP32 on a strict 3.3V rail with L/R tied to GND for Left Mono operation.',
    },
    specs: {
      id: 'SCK→GPIO26 (BCLK) · WS→GPIO22 (LRCLK) · SD→GPIO21 (DOUT) · VDD→3.3V · L/R→GND',
      en: 'SCK→GPIO26 (BCLK) · WS→GPIO22 (LRCLK) · SD→GPIO21 (DOUT) · VDD→3.3V · L/R→GND',
    },
    signalRole: {
      id: 'Sinkronisasi clock berkecepatan tinggi (~3.072 MHz BCLK) antara ESP32 master dan sensor MEMS slave.',
      en: 'Carries high-speed synchronous I2S clocks (~3.072 MHz BCLK) between ESP32 master and MEMS sensor slave.',
    },
  },

  // ================= MODULE 5: CURRENT SENSOR (ACS712-05B) + ARDUINO NANO =================
  {
    id: 's_cur_nano',
    component: 'sensor_current',
    subsystem: { id: 'Mikrokontroler ADC 5V', en: '5V ADC Microcontroller' },
    name: {
      id: 'Arduino Nano V3 (ATmega328P · ADC 10-Bit)',
      en: 'Arduino Nano V3 (ATmega328P · 10-Bit ADC)',
    },
    functionDesc: {
      id: 'Mikrokontroler 5V kompak dengan chip ATmega328P dan ADC 10-bit (0–1023) yang sangat cocok membaca keluaran rasio metrik 2.50V±185mV/A dari ACS712-05B tanpa pembagi tegangan tambahan.',
      en: 'Compact 5V ATmega328P microcontroller with native 10-bit ADC (0–1023), ideally matched to the ACS712-05B ratiometric 5V output without level shifting.',
    },
    specs: {
      id: 'MCU: ATmega328P 16 MHz · Referensi ADC: 5.00V (4.88 mV/step) · Input Analog: Pin A0',
      en: 'MCU: ATmega328P 16 MHz · ADC Reference: 5.00V (4.88 mV/step) · Analog Pin: A0',
    },
    signalRole: {
      id: 'Menghitung nilai arus RMS jalur 70V/100V atau arus bus UPS 24V DC dan mendeteksi lonjakan hubung singkat (<2 detik).',
      en: 'Samples VIOUT on A0 to compute 70V/100V speaker line current or 24V UPS bus draw and flag short-circuit overcurrent.',
    },
  },
  {
    id: 's_cur_acs712',
    component: 'sensor_current',
    subsystem: { id: 'Sensor Efek Hall', en: 'Hall-Effect Sensor' },
    name: {
      id: 'Modul ACS712-05B & Terminal Blok Beban IP+/IP-',
      en: 'ACS712-05B Carrier & IP+/IP- Load Terminal',
    },
    functionDesc: {
      id: 'Sensor arus linier berbasis efek Hall terisolasi galvanis (2.1 kVrms) yang mengukur medan magnet arus AC maupun DC antara terminal sekrup IP+ dan IP-.',
      en: 'Galvanically isolated (2.1 kVrms) Hall-effect current sensor IC measuring magnetic flux from AC or DC current flowing between IP+ and IP-.',
    },
    specs: {
      id: 'Rentang: ±5 A · Sensitivitas: 185 mV/A · Offset Nol Arus: VCC/2 (2.500 V) · Bandwidth: 80 kHz',
      en: 'Range: ±5 A · Sensitivity: 185 mV/A · Zero-Current Offset: VCC/2 (2.500 V) · Bandwidth: 80 kHz',
    },
    signalRole: {
      id: 'Mengisolasi rangkaian tegangan audio 100V/UPS dari pin mikrokontroler sambil menghasilkan tegangan analog VIOUT pada pin OUT.',
      en: 'Provides galvanic isolation from 100V audio / UPS rails while outputting proportional voltage on VIOUT.',
    },
  },
  {
    id: 's_cur_shunt',
    component: 'sensor_current',
    subsystem: { id: 'Referensi Shunt Presisi', en: 'Precision Shunt Reference' },
    name: {
      id: 'Resistor Shunt Presisi 0.1Ω 1% (2W Metal Film)',
      en: '0.1Ω 1% Precision Shunt Resistor (2W)',
    },
    functionDesc: {
      id: 'Resistor presisi berhambatan sangat rendah (0.1 Ohm) yang dipasang seri pada jalur beban sebagai pembanding drop tegangan mikro (100 mV/A) untuk verifikasi kalibrasi Hall-effect dan arus supervisi DC.',
      en: 'Ultra-low-resistance 0.1Ω precision sense resistor wired in series on the load loop to cross-check Hall measurements and low-mA DC supervision.',
    },
    specs: {
      id: 'Resistansi: 0.10 Ω ±1% · Disipasi: 2W · Faktor Konversi: 100 mV per 1 A (0.1 mV per 1 mA)',
      en: 'Resistance: 0.10 Ω ±1% · Rating: 2W · Conversion Factor: 100 mV per 1 A (0.1 mV per 1 mA)',
    },
    signalRole: {
      id: 'Memberikan pembacaan presisi pada arus supervisi DC orde miliampere (12.4 mA) di mana sensitivitas Hall murni lebih rentan noise.',
      en: 'Enables high-precision verification of milliamp-range DC supervision current (12.4 mA) alongside Hall-effect sensing.',
    },
  },
  {
    id: 's_cur_wiring',
    component: 'sensor_current',
    subsystem: { id: 'Jalur Sinyal & Beban', en: 'Signal & Load Harness' },
    name: {
      id: 'Kabel ADC (VCC 5V, GND, OUT→A0) & Loop Beban IP+/IP-',
      en: 'ADC Leads (5V, GND, OUT→A0) & Series Load Loop',
    },
    functionDesc: {
      id: 'Kabel 3-pin sisi kendali bertegangan rendah menuju Nano (VCC→5V, OUT→A0, GND→GND) serta kabel seri berpenampang tebal pada sisi terminal sekrup IP+ dan IP-.',
      en: '3-wire low-voltage control leads feeding the Nano ADC (5V, GND, OUT→A0) paired with heavy-gauge series load conductors on IP+/IP-.',
    },
    specs: {
      id: 'Sisi Kontrol: 5V / GND / A0 · Sisi Beban: Seri pada Output NCU 70V/100V, Terminal Speaker, atau Bus 24V UPS',
      en: 'Control Side: 5V / GND / A0 · Load Side: Series on NCU 70V/100V Out, Speaker Terminal, or 24V UPS Bus',
    },
    signalRole: {
      id: 'Menyalurkan arus uji melalui loop seri IP+/IP- dan mengirimkan tegangan hasil sensor secara analog ke pin A0 mikrokontroler.',
      en: 'Routes monitored PA load current through IP+/IP- while feeding analog VIOUT voltage to Nano pin A0.',
    },
  },

  // ================= MODULE 6: TEMP SENSOR (DS18B20 + NTC 10kΩ) + ARDUINO UNO R3 =================
  {
    id: 's_tmp_uno',
    component: 'sensor_temp',
    subsystem: { id: 'Mikrokontroler Dual-Sensor', en: 'Dual-Sensor Microcontroller' },
    name: {
      id: 'Arduino Uno R3 (ATmega328P · 1-Wire + ADC)',
      en: 'Arduino Uno R3 (ATmega328P · 1-Wire + ADC)',
    },
    functionDesc: {
      id: 'Papan mikrokontroler standar industri pendidikan berbasis ATmega328P yang membaca sensor digital DS18B20 melalui bus 1-Wire (Pin D2) sekaligus menghitung suhu termistor NTC 10kΩ melalui ADC Pin A1.',
      en: 'Classic ATmega328P controller simultaneously polling the 1-Wire DS18B20 digital sensor on Pin D2 and solving the NTC 10kΩ thermistor curve via ADC Pin A1.',
    },
    specs: {
      id: 'MCU: ATmega328P DIP-28 16 MHz · Digital I/O: D2 (1-Wire) · Analog Input: A1 (10-bit ADC 5V)',
      en: 'MCU: ATmega328P DIP-28 16 MHz · Digital I/O: D2 (1-Wire) · Analog Input: A1 (10-bit ADC 5V)',
    },
    signalRole: {
      id: 'Menggabungkan akurasi digital DS18B20 (±0.5°C) dan respons cepat analog NTC 10kΩ untuk proteksi termal NCU & Speaker.',
      en: 'Fuses DS18B20 digital precision (±0.5°C) with fast analog NTC 10kΩ response for NCU & speaker thermal protection.',
    },
  },
  {
    id: 's_tmp_ds18b20',
    component: 'sensor_temp',
    subsystem: { id: 'Probe Termal Digital 1-Wire', en: '1-Wire Digital Thermal Probe' },
    name: {
      id: 'Probe Stainless DS18B20 + Resistor Pull-Up 4.7kΩ',
      en: 'DS18B20 Stainless Probe + 4.7kΩ Pull-Up Resistor',
    },
    functionDesc: {
      id: 'Sensor suhu digital terkalibrasi pabrik berselubung baja tahan karat yang berkomunikasi lewat protokol 1-Wire dan wajib menggunakan resistor pull-up 4.7kΩ antara jalur Data (DQ) dan VCC 5V.',
      en: 'Factory-calibrated stainless-sheathed 1-Wire digital thermometer requiring an external 4.7kΩ pull-up resistor between Data (DQ) and 5V VCC.',
    },
    specs: {
      id: 'Rentang: -55°C hingga +125°C · Resolusi: 12-bit (0.0625°C/LSB) · Pull-Up Wajib: 4.7kΩ ke 5V',
      en: 'Range: -55°C to +125°C · Resolution: 12-bit (0.0625°C/LSB) · Mandatory Pull-Up: 4.7kΩ to 5V',
    },
    signalRole: {
      id: 'Mengirimkan register suhu biner 16-bit bebas interferensi kabel panjang dari sirip heatsink Amplifier NCU.',
      en: 'Transmits noise-immune 16-bit digital temperature words over 1-Wire from the NCU amplifier heatsink.',
    },
  },
  {
    id: 's_tmp_ntc',
    component: 'sensor_temp',
    subsystem: { id: 'Termistor Pembagi Tegangan', en: 'Voltage-Divider Thermistor' },
    name: {
      id: 'Termistor NTC 10kΩ (B=3950) & Resistor Referensi 10kΩ',
      en: '10kΩ NTC Thermistor (B=3950) & 10kΩ Divider',
    },
    functionDesc: {
      id: 'Resistor semikonduktor koefisien suhu negatif yang nilai hambatannya turun tajam saat suhu naik, dirangkai seri bersama resistor tetap 10kΩ menjadi pembagi tegangan menuju pin analog A1.',
      en: 'Negative-temperature-coefficient thermistor whose resistance drops exponentially with rising heat, paired with a fixed 10kΩ resistor into ADC pin A1.',
    },
    specs: {
      id: 'R25: 10.0 kΩ · Nilai Beta: 3950 K · R_ref Pembagi: 10.0 kΩ ke 5V · V_out @ 25°C = 2.500V',
      en: 'R25: 10.0 kΩ · Beta: 3950 K · Divider Ref: 10.0 kΩ to 5V · V_out @ 25°C = 2.500V',
    },
    signalRole: {
      id: 'Memantau titik sempit seperti celah Yoke Magnet / Voice Coil speaker dan PSU NCU dengan respons termal instan.',
      en: 'Monitors tight thermal hotspots such as the speaker magnet yoke / voice coil and NCU PSU with rapid response.',
    },
  },
  {
    id: 's_tmp_wiring',
    component: 'sensor_temp',
    subsystem: { id: 'Jalur 1-Wire & Pembagi Analog', en: '1-Wire & Analog Divider Harness' },
    name: {
      id: 'Kabel Bus 1-Wire (D2 + 4.7kΩ) & Sinyal Pembagi NTC (A1)',
      en: '1-Wire Bus (D2 + 4.7kΩ) & NTC Divider Lead (A1)',
    },
    functionDesc: {
      id: 'Jalur perkabelan gabungan antara bus digital open-drain Pin D2 (DS18B20) dan pembacaan titik tengah pembagi tegangan analog pada Pin A1 (NTC 10kΩ).',
      en: 'Dual-mode wiring combining the open-drain 1-Wire bus on Pin D2 (DS18B20) and the voltage-divider midpoint into Pin A1 (NTC 10kΩ).',
    },
    specs: {
      id: 'DS18B20: Merah→5V, Kuning→D2 (+4.7kΩ), Hitam→GND · NTC: Titik Tengah 10kΩ→A1',
      en: 'DS18B20: Red→5V, Yellow→D2 (+4.7kΩ), Black→GND · NTC: 10kΩ Midpoint→A1',
    },
    signalRole: {
      id: 'Menghubungkan kedua tipe sensor termal (digital & analog) secara simultan ke Arduino Uno untuk redundansi diagnostik.',
      en: 'Connects both digital and analog thermal probes concurrently to the Arduino Uno for cross-checked diagnostics.',
    },
  },
];

export function getAnatomyByComponent(comp: ComponentId): AnatomyPartInfo[] {
  return ANATOMY_PARTS.filter((p) => p.component === comp);
}

export function getAnatomyById(partId: string): AnatomyPartInfo | undefined {
  return ANATOMY_PARTS.find((p) => p.id === partId);
}

import * as THREE from 'three';
import { ProceduralTextures } from './textures';
import { ExplodablePart } from './models';
import { SensorStatus } from '../sim/types';

export interface SensorMcuRig {
  root: THREE.Group;
  explodables: ExplodablePart[];
  updateState: (params: {
    explode: number;
    status: SensorStatus;
    activityLevel: number; // 0 to 1
    timeSec: number;
  }) => void;
}

const _tmpCurveVec = new THREE.Vector3();

function registerClickable(
  obj: THREE.Object3D,
  partId: string,
  clickables: THREE.Object3D[],
) {
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
  clickables.push(obj);
}

function addLabWorkbenchMat(root: THREE.Group): THREE.Mesh {
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.06, 2.3),
    new THREE.MeshStandardMaterial({
      color: 0x16202c,
      roughness: 0.85,
      metalness: 0.08,
    }),
  );
  mat.position.set(0, 0.03, 0);
  mat.receiveShadow = true;
  root.add(mat);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(3.84, 0.02, 2.34),
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.4,
    }),
  );
  trim.position.set(0, 0.01, 0);
  root.add(trim);
  return mat;
}

function createPinRow(
  count: number,
  spacing: number,
  goldMat: THREE.Material,
  plasticMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(count * spacing, 0.055, 0.07),
    plasticMat,
  );
  group.add(base);
  for (let i = 0; i < count; i++) {
    const pin = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.14, 0.018),
      goldMat,
    );
    pin.position.set((i - (count - 1) / 2) * spacing, 0.02, 0);
    group.add(pin);
  }
  return group;
}

function createJumperWire(
  points: THREE.Vector3[],
  colorHex: number,
  radius = 0.015,
): { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3 } {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 24, radius, 8, false);
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.55,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return { mesh, curve };
}

// =====================================================================
// 1. SOUND SENSOR (INMP441 MEMS I2S) + ESP32-WROOM-32 DEVKIT
// =====================================================================
export function buildSoundSensorMcuModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): SensorMcuRig {
  const root = new THREE.Group();
  root.name = 'SoundSensorMcuBench';
  const explodables: ExplodablePart[] = [];

  addLabWorkbenchMat(root);

  const pcbDarkMat = new THREE.MeshStandardMaterial({
    color: 0x161f2b,
    roughness: 0.52,
    metalness: 0.2,
  });
  const pcbTealMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    map: textures.pcbTexture,
    roughness: 0.5,
    metalness: 0.15,
  });
  const shieldMetalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.92,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.003,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.25,
    metalness: 0.9,
  });
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.1,
  });

  // 1. ESP32-WROOM-32 DevKit v1 (Right side of bench)
  const espGroup = new THREE.Group();
  espGroup.position.set(0.85, 0.16, 0.05);

  const espBoard = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 1.65), pcbDarkMat);
  espBoard.castShadow = true;
  espGroup.add(espBoard);

  // ESP-WROOM-32 RF Shield Can
  const rfShield = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.68), shieldMetalMat);
  rfShield.position.set(0, 0.085, -0.34);
  rfShield.castShadow = true;
  espGroup.add(rfShield);

  // PCB Meander Antenna extension
  const antennaStrip = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.02, 0.2), pcbDarkMat);
  antennaStrip.position.set(0, 0.03, -0.76);
  const antennaTrace = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.025, 0.04), goldMat);
  antennaTrace.position.set(0, 0.036, -0.78);
  espGroup.add(antennaStrip, antennaTrace);

  // Micro-USB Port + CP2102 UART IC + AMS1117 3.3V Regulator + EN/BOOT buttons
  const usbPort = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.22), shieldMetalMat);
  usbPort.position.set(0, 0.075, 0.74);
  const cp2102 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.16), blackPlasticMat);
  cp2102.position.set(0, 0.045, 0.42);
  const reg3v3 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.14), blackPlasticMat);
  reg3v3.position.set(-0.24, 0.05, 0.48);
  const btnEn = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.11), shieldMetalMat);
  btnEn.position.set(-0.26, 0.045, 0.7);
  const btnBoot = btnEn.clone();
  btnBoot.position.set(0.26, 0.045, 0.7);

  // Dual Pin Headers (Left & Right 15-pin)
  const leftHeaders = createPinRow(14, 0.1, goldMat, blackPlasticMat);
  leftHeaders.rotation.y = Math.PI / 2;
  leftHeaders.position.set(-0.44, 0.02, 0.02);
  const rightHeaders = createPinRow(14, 0.1, goldMat, blackPlasticMat);
  rightHeaders.rotation.y = Math.PI / 2;
  rightHeaders.position.set(0.44, 0.02, 0.02);

  // Status Telemetry LEDs on ESP32
  const espPwrLedMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.0,
  });
  const espI2sLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
  });
  const espPwrLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), espPwrLedMat);
  espPwrLed.position.set(-0.22, 0.04, 0.25);
  const espI2sLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), espI2sLedMat);
  espI2sLed.position.set(0.22, 0.04, 0.25);

  espGroup.add(
    usbPort,
    cp2102,
    reg3v3,
    btnEn,
    btnBoot,
    leftHeaders,
    rightHeaders,
    espPwrLed,
    espI2sLed,
  );
  root.add(espGroup);
  registerClickable(espGroup, 's_snd_esp32', clickables);
  explodables.push({
    mesh: espGroup,
    partId: 's_snd_esp32',
    basePos: espGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.45, 0.2, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.1, 0),
  });

  // 2. INMP441 MEMS Digital Breakout Board (Left side of bench)
  const inmpGroup = new THREE.Group();
  inmpGroup.position.set(-0.95, 0.18, 0.05);

  const inmpPcb = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.045, 32), pcbTealMat);
  inmpPcb.castShadow = true;
  const inmpHeaders = createPinRow(6, 0.1, goldMat, blackPlasticMat);
  inmpHeaders.rotation.y = Math.PI / 2;
  inmpHeaders.position.set(0.32, 0.015, 0);
  inmpGroup.add(inmpPcb, inmpHeaders);
  root.add(inmpGroup);
  registerClickable(inmpGroup, 's_snd_inmp441', clickables);
  explodables.push({
    mesh: inmpGroup,
    partId: 's_snd_inmp441',
    basePos: inmpGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.45, 0.18, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.03, 0),
  });

  // 3. Explodable INMP441 Gold MEMS Acoustic Port & 24-bit Sigma-Delta Core
  const memsCoreGroup = new THREE.Group();
  memsCoreGroup.position.set(-1.02, 0.24, 0.05);
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 12, 28), goldMat);
  goldRing.rotation.x = Math.PI / 2;
  const portHole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), blackPlasticMat);
  const adcDie = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), shieldMetalMat);
  adcDie.position.y = -0.025;
  memsCoreGroup.add(goldRing, portHole, adcDie);
  root.add(memsCoreGroup);
  registerClickable(memsCoreGroup, 's_snd_mems_core', clickables);
  explodables.push({
    mesh: memsCoreGroup,
    partId: 's_snd_mems_core',
    basePos: memsCoreGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.45, 0.72, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.02, 0),
  });

  // 4. I2S Bus 6-Wire Jumper Harness (VDD, GND, SCK->26, WS->22, SD->21, L/R->GND)
  const wiringGroup = new THREE.Group();
  const wireConfigs = [
    { zInmp: -0.25, zEsp: -0.45, color: 0xef4444, yPeak: 0.42 }, // VDD -> 3.3V
    { zInmp: -0.15, zEsp: -0.35, color: 0x475569, yPeak: 0.36 }, // GND -> GND
    { zInmp: -0.05, zEsp: -0.15, color: 0x10b981, yPeak: 0.48 }, // SCK -> GPIO26
    { zInmp: 0.05, zEsp: 0.05, color: 0xf59e0b, yPeak: 0.52 },   // WS -> GPIO22
    { zInmp: 0.15, zEsp: 0.2, color: 0x38bdf8, yPeak: 0.56 },    // SD -> GPIO21 (Data)
    { zInmp: 0.25, zEsp: 0.35, color: 0x94a3b8, yPeak: 0.34 },   // L/R -> GND
  ];

  const dataCurves: THREE.CatmullRomCurve3[] = [];
  wireConfigs.forEach((wc, idx) => {
    const start = new THREE.Vector3(-0.62, 0.24, 0.05 + wc.zInmp);
    const mid1 = new THREE.Vector3(-0.25, wc.yPeak, 0.05 + (wc.zInmp + wc.zEsp) * 0.4);
    const mid2 = new THREE.Vector3(0.15, wc.yPeak, 0.05 + wc.zEsp * 0.85);
    const end = new THREE.Vector3(0.41, 0.22, 0.05 + wc.zEsp);
    const { mesh, curve } = createJumperWire([start, mid1, mid2, end], wc.color);
    wiringGroup.add(mesh);
    if (idx >= 2 && idx <= 4) dataCurves.push(curve);
  });

  // Animated I2S digital packet beads moving along SCK, WS, SD
  const i2sBeadMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
  });
  const i2sBeads: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), i2sBeadMat);
    wiringGroup.add(bead);
    i2sBeads.push(bead);
  }

  root.add(wiringGroup);
  registerClickable(wiringGroup, 's_snd_wiring', clickables);
  explodables.push({
    mesh: wiringGroup,
    partId: 's_snd_wiring',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0, 0.55, 0),
    anchorLocalPos: new THREE.Vector3(-0.1, 0.45, 0.05),
  });

  return {
    root,
    explodables,
    updateState: ({ status, activityLevel, timeSec }) => {
      const speed = 0.55 + activityLevel * 1.4;
      for (let i = 0; i < i2sBeads.length; i++) {
        const u = (timeSec * speed + i * 0.33) % 1;
        dataCurves[i % dataCurves.length].getPointAt(u, _tmpCurveVec);
        i2sBeads[i].position.copy(_tmpCurveVec);
      }
      const hex = status === 'warning' ? 0xf59e0b : status === 'critical' ? 0xf43f5e : 0x38bdf8;
      espI2sLedMat.color.setHex(hex);
      espI2sLedMat.emissive.setHex(hex);
      espI2sLedMat.emissiveIntensity = 0.4 + activityLevel * 1.6;
    },
  };
}

// =====================================================================
// 2. CURRENT SENSOR (ACS712-05B + 0.1Ω SHUNT) + ARDUINO NANO V3
// =====================================================================
export function buildCurrentSensorMcuModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): SensorMcuRig {
  const root = new THREE.Group();
  root.name = 'CurrentSensorMcuBench';
  const explodables: ExplodablePart[] = [];

  addLabWorkbenchMat(root);

  const nanoBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0f3b7a,
    map: textures.pcbTexture,
    roughness: 0.48,
    metalness: 0.18,
  });
  const sensorTealMat = new THREE.MeshStandardMaterial({
    color: 0x0e7490,
    roughness: 0.46,
    metalness: 0.2,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.22,
    metalness: 0.9,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.25,
    metalness: 0.9,
  });
  const blackIcMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.55,
    metalness: 0.15,
  });
  const screwGreenMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.5,
    metalness: 0.08,
  });

  // 1. Arduino Nano V3 (ATmega328P) on Right Side
  const nanoGroup = new THREE.Group();
  nanoGroup.position.set(0.92, 0.18, 0.05);

  const nanoPcb = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 1.55), nanoBlueMat);
  nanoPcb.castShadow = true;
  const nanoMcu = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.24), blackIcMat);
  nanoMcu.rotation.y = Math.PI / 4; // Classic 45-deg Nano TQFP-32 chip
  nanoMcu.position.set(0, 0.045, 0.02);
  const nanoUsb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.22), metalMat);
  nanoUsb.position.set(0, 0.07, 0.7);
  const nanoReset = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), metalMat);
  nanoReset.position.set(0, 0.05, -0.32);

  const nanoHeadersL = createPinRow(13, 0.1, goldMat, blackIcMat);
  nanoHeadersL.rotation.y = Math.PI / 2;
  nanoHeadersL.position.set(-0.27, 0.02, 0.02);
  const nanoHeadersR = createPinRow(13, 0.1, goldMat, blackIcMat);
  nanoHeadersR.rotation.y = Math.PI / 2;
  nanoHeadersR.position.set(0.27, 0.02, 0.02);

  const nanoAdcLedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.0,
  });
  const nanoAdcLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), nanoAdcLedMat);
  nanoAdcLed.position.set(0.14, 0.04, 0.42);

  nanoGroup.add(nanoPcb, nanoMcu, nanoUsb, nanoReset, nanoHeadersL, nanoHeadersR, nanoAdcLed);
  root.add(nanoGroup);
  registerClickable(nanoGroup, 's_cur_nano', clickables);
  explodables.push({
    mesh: nanoGroup,
    partId: 's_cur_nano',
    basePos: nanoGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.45, 0.22, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.06, 0),
  });

  // 2. ACS712-05B Hall-Effect Carrier & High-Current Terminal IP+/IP-
  const acsGroup = new THREE.Group();
  acsGroup.position.set(-0.78, 0.18, 0.05);

  const acsPcb = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.56), sensorTealMat);
  acsPcb.castShadow = true;
  const acsIc = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.16), blackIcMat);
  acsIc.position.set(0.02, 0.05, 0);
  const ipTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.42), screwGreenMat);
  ipTerminal.position.set(-0.3, 0.13, 0);
  // 2 brass screw heads
  for (const zOff of [-0.1, 0.1]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), metalMat);
    screw.position.set(-0.3, 0.24, zOff);
    acsGroup.add(screw);
  }
  const acsPinHeader = createPinRow(3, 0.1, goldMat, blackIcMat);
  acsPinHeader.rotation.y = Math.PI / 2;
  acsPinHeader.position.set(0.36, 0.02, 0);

  acsGroup.add(acsPcb, acsIc, ipTerminal, acsPinHeader);
  root.add(acsGroup);
  registerClickable(acsGroup, 's_cur_acs712', clickables);
  explodables.push({
    mesh: acsGroup,
    partId: 's_cur_acs712',
    basePos: acsGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.35, 0.2, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.1, 0),
  });

  // 3. 0.1Ω Precision Shunt Resistor on Load Side (Left of ACS712)
  const shuntGroup = new THREE.Group();
  shuntGroup.position.set(-1.38, 0.22, -0.35);
  const shuntBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 }),
  );
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.144, 0.144), bandMat);
  const leadL = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), metalMat);
  leadL.rotation.z = Math.PI / 2;
  leadL.position.x = -0.22;
  const leadR = leadL.clone();
  leadR.position.x = 0.22;
  shuntGroup.add(shuntBody, band, leadL, leadR);
  root.add(shuntGroup);
  registerClickable(shuntGroup, 's_cur_shunt', clickables);
  explodables.push({
    mesh: shuntGroup,
    partId: 's_cur_shunt',
    basePos: shuntGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.45, 0.58, -0.25),
    anchorLocalPos: new THREE.Vector3(0, 0.05, 0),
  });

  // 4. Wiring Harness (VCC 5V, GND, OUT->A0 + Series IP+/IP- Load Loop)
  const wiringGroup = new THREE.Group();
  const { mesh: vccWire } = createJumperWire(
    [
      new THREE.Vector3(-0.42, 0.23, -0.05),
      new THREE.Vector3(0.1, 0.46, -0.15),
      new THREE.Vector3(0.65, 0.24, -0.25),
    ],
    0xef4444,
  );
  const { mesh: gndWire } = createJumperWire(
    [
      new THREE.Vector3(-0.42, 0.23, 0.05),
      new THREE.Vector3(0.1, 0.36, 0.02),
      new THREE.Vector3(0.65, 0.24, -0.05),
    ],
    0x475569,
  );
  const { mesh: outWire, curve: adcCurve } = createJumperWire(
    [
      new THREE.Vector3(-0.42, 0.23, 0.15),
      new THREE.Vector3(0.15, 0.54, 0.22),
      new THREE.Vector3(0.65, 0.24, 0.25),
    ],
    0xf59e0b,
  );
  const { mesh: loadWire, curve: loadCurve } = createJumperWire(
    [
      new THREE.Vector3(-1.12, 0.24, -0.05),
      new THREE.Vector3(-1.38, 0.26, -0.22),
      new THREE.Vector3(-1.58, 0.24, -0.35),
      new THREE.Vector3(-1.45, 0.24, 0.45),
      new THREE.Vector3(-1.12, 0.24, 0.15),
    ],
    0xf43f5e,
    0.02,
  );

  const loadBeadMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.4,
  });
  const adcBeadMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.4,
  });
  const loadBead = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), loadBeadMat);
  const adcBead = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), adcBeadMat);

  wiringGroup.add(vccWire, gndWire, outWire, loadWire, loadBead, adcBead);
  root.add(wiringGroup);
  registerClickable(wiringGroup, 's_cur_wiring', clickables);
  explodables.push({
    mesh: wiringGroup,
    partId: 's_cur_wiring',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0, 0.55, 0),
    anchorLocalPos: new THREE.Vector3(-0.1, 0.48, 0.1),
  });

  return {
    root,
    explodables,
    updateState: ({ status, activityLevel, timeSec }) => {
      const speed = status === 'critical' ? 1.8 : 0.45 + activityLevel * 1.1;
      loadCurve.getPointAt((timeSec * speed) % 1, _tmpCurveVec);
      loadBead.position.copy(_tmpCurveVec);

      adcCurve.getPointAt((timeSec * (speed * 0.85) + 0.5) % 1, _tmpCurveVec);
      adcBead.position.copy(_tmpCurveVec);

      const hex = status === 'critical' ? 0xf43f5e : status === 'warning' ? 0xf59e0b : 0x10b981;
      nanoAdcLedMat.color.setHex(hex);
      nanoAdcLedMat.emissive.setHex(hex);
      loadBeadMat.emissiveIntensity = status === 'critical' ? 2.4 : 0.7 + activityLevel * 1.2;
    },
  };
}

// =====================================================================
// 3. TEMP SENSOR (DS18B20 + NTC 10kΩ THERMISTOR) + ARDUINO UNO R3
// =====================================================================
export function buildTempSensorMcuModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): SensorMcuRig {
  const root = new THREE.Group();
  root.name = 'TempSensorMcuBench';
  const explodables: ExplodablePart[] = [];

  addLabWorkbenchMat(root);

  const unoTealMat = new THREE.MeshStandardMaterial({
    color: 0x0e6274,
    map: textures.pcbTexture,
    roughness: 0.48,
    metalness: 0.16,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.2,
    metalness: 0.92,
  });
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.1,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.25,
    metalness: 0.9,
  });

  // 1. Arduino Uno R3 (ATmega328P DIP-28) on Right Side
  const unoGroup = new THREE.Group();
  unoGroup.position.set(0.88, 0.16, 0.05);

  const unoPcb = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 1.56), unoTealMat);
  unoPcb.castShadow = true;
  const dipChip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.82), blackPlasticMat);
  dipChip.position.set(0.2, 0.055, 0.08);
  const usbTypeB = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.36), metalMat);
  usbTypeB.position.set(-0.28, 0.13, 0.66);
  const dcBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.32), blackPlasticMat);
  dcBarrel.position.set(0.36, 0.12, 0.68);
  const xtal = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 12), metalMat);
  xtal.rotation.x = Math.PI / 2;
  xtal.position.set(-0.08, 0.05, 0.14);

  // Female Header Strips (Digital D0-D13 left, Power + Analog A0-A5 right)
  const femaleHeaderD = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.05), blackPlasticMat);
  femaleHeaderD.position.set(-0.5, 0.08, -0.1);
  const femaleHeaderA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.95), blackPlasticMat);
  femaleHeaderA.position.set(0.5, 0.08, -0.1);

  const unoLedMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.0,
  });
  const unoLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), unoLedMat);
  unoLed.position.set(-0.2, 0.045, -0.35);

  unoGroup.add(unoPcb, dipChip, usbTypeB, dcBarrel, xtal, femaleHeaderD, femaleHeaderA, unoLed);
  root.add(unoGroup);
  registerClickable(unoGroup, 's_tmp_uno', clickables);
  explodables.push({
    mesh: unoGroup,
    partId: 's_tmp_uno',
    basePos: unoGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.42, 0.2, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.1, 0),
  });

  // 2. DS18B20 Stainless Probe + 4.7kΩ Pull-up Adapter Board (Top-Left)
  const dsGroup = new THREE.Group();
  dsGroup.position.set(-0.98, 0.18, -0.45);

  const adapterPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.045, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
  );
  // 4.7kΩ Pull-up Resistor (Yellow-Violet-Red)
  const pullupBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9c28e, roughness: 0.45 }),
  );
  pullupBody.rotation.z = Math.PI / 2;
  pullupBody.position.set(0, 0.05, -0.06);
  const probeSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.65, 20),
    metalMat,
  );
  probeSleeve.rotation.z = Math.PI / 2;
  probeSleeve.position.set(-0.55, 0.05, 0);
  const dsHeaders = createPinRow(3, 0.1, goldMat, blackPlasticMat);
  dsHeaders.rotation.y = Math.PI / 2;
  dsHeaders.position.set(0.24, 0.02, 0);

  dsGroup.add(adapterPcb, pullupBody, probeSleeve, dsHeaders);
  root.add(dsGroup);
  registerClickable(dsGroup, 's_tmp_ds18b20', clickables);
  explodables.push({
    mesh: dsGroup,
    partId: 's_tmp_ds18b20',
    basePos: dsGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.42, 0.35, -0.2),
    anchorLocalPos: new THREE.Vector3(-0.15, 0.06, 0),
  });

  // 3. NTC 10kΩ Bead Thermistor & 10kΩ Voltage Divider Module (Bottom-Left)
  const ntcGroup = new THREE.Group();
  ntcGroup.position.set(-0.98, 0.18, 0.52);

  const ntcPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.045, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 }),
  );
  const ntcBeadMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });
  const ntcBead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), ntcBeadMat);
  ntcBead.position.set(-0.38, 0.08, 0);
  const refRes10k = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45 }),
  );
  refRes10k.rotation.z = Math.PI / 2;
  refRes10k.position.set(0.02, 0.05, 0.05);
  const ntcHeaders = createPinRow(3, 0.1, goldMat, blackPlasticMat);
  ntcHeaders.rotation.y = Math.PI / 2;
  ntcHeaders.position.set(0.24, 0.02, 0);

  ntcGroup.add(ntcPcb, ntcBead, refRes10k, ntcHeaders);
  root.add(ntcGroup);
  registerClickable(ntcGroup, 's_tmp_ntc', clickables);
  explodables.push({
    mesh: ntcGroup,
    partId: 's_tmp_ntc',
    basePos: ntcGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.42, 0.2, 0.28),
    anchorLocalPos: new THREE.Vector3(-0.1, 0.06, 0),
  });

  // 4. 1-Wire (D2) + Analog Divider (A1) Wiring Harness
  const wiringGroup = new THREE.Group();
  const { mesh: dsVcc } = createJumperWire(
    [
      new THREE.Vector3(-0.74, 0.23, -0.55),
      new THREE.Vector3(0.1, 0.42, -0.55),
      new THREE.Vector3(1.38, 0.28, -0.35),
    ],
    0xef4444,
  );
  const { mesh: dsDq, curve: oneWireCurve } = createJumperWire(
    [
      new THREE.Vector3(-0.74, 0.23, -0.45),
      new THREE.Vector3(-0.18, 0.56, -0.35),
      new THREE.Vector3(0.38, 0.28, -0.3),
    ],
    0xeab308,
  );
  const { mesh: dsGnd } = createJumperWire(
    [
      new THREE.Vector3(-0.74, 0.23, -0.35),
      new THREE.Vector3(0.15, 0.34, -0.18),
      new THREE.Vector3(1.38, 0.28, -0.15),
    ],
    0x475569,
  );
  const { mesh: ntcAdc, curve: ntcCurve } = createJumperWire(
    [
      new THREE.Vector3(-0.74, 0.23, 0.52),
      new THREE.Vector3(0.25, 0.54, 0.42),
      new THREE.Vector3(1.38, 0.28, 0.25),
    ],
    0x10b981,
  );

  const wireBeadMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.4,
  });
  const bead1Wire = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), wireBeadMat);
  const beadNtc = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), wireBeadMat);

  wiringGroup.add(dsVcc, dsDq, dsGnd, ntcAdc, bead1Wire, beadNtc);
  root.add(wiringGroup);
  registerClickable(wiringGroup, 's_tmp_wiring', clickables);
  explodables.push({
    mesh: wiringGroup,
    partId: 's_tmp_wiring',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0, 0.58, 0),
    anchorLocalPos: new THREE.Vector3(-0.05, 0.48, 0),
  });

  return {
    root,
    explodables,
    updateState: ({ status, activityLevel, timeSec }) => {
      const speed = status === 'critical' ? 1.5 : 0.45 + activityLevel * 0.8;
      oneWireCurve.getPointAt((timeSec * speed) % 1, _tmpCurveVec);
      bead1Wire.position.copy(_tmpCurveVec);

      ntcCurve.getPointAt((timeSec * speed + 0.45) % 1, _tmpCurveVec);
      beadNtc.position.copy(_tmpCurveVec);

      const hex = status === 'critical' ? 0xf43f5e : status === 'warning' ? 0xf59e0b : 0x10b981;
      ntcBeadMat.color.setHex(hex);
      ntcBeadMat.emissive.setHex(hex);
      unoLedMat.color.setHex(hex);
      unoLedMat.emissive.setHex(hex);
    },
  };
}

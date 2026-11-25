import * as THREE from 'three';
import { ProceduralTextures } from './textures';
import { WattageTap } from '../sim/types';

export interface ExplodablePart {
  mesh: THREE.Object3D;
  partId: string;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  anchorLocalPos: THREE.Vector3;
}

export interface GooseneckRig {
  root: THREE.Group;
  headGroup: THREE.Group;
  neckMesh: THREE.Mesh;
  conductorMesh: THREE.Mesh;
  windshieldMesh: THREE.Mesh;
  capsuleDiaphragm: THREE.Mesh;
  pttButton: THREE.Mesh;
  pttRingMat: THREE.MeshStandardMaterial;
  conductorMat: THREE.MeshStandardMaterial;
  windParticles: THREE.Points;
  explodables: ExplodablePart[];
  updatePose: (angleDeg: number, explode: number, pttActive: boolean, signalRms: number, windActive: boolean, windshieldOn: boolean, timeSec: number) => void;
}

export interface NcuRig {
  root: THREE.Group;
  topLid: THREE.Mesh;
  ledPowerMat: THREE.MeshStandardMaterial;
  ledSignalMat: THREE.MeshStandardMaterial;
  ledNetMat: THREE.MeshStandardMaterial;
  ledFaultMat: THREE.MeshStandardMaterial;
  ledAlarmMat: THREE.MeshStandardMaterial;
  fanBlades: THREE.Mesh;
  tempProbeMat: THREE.MeshStandardMaterial;
  currentSensorMat: THREE.MeshStandardMaterial;
  explodables: ExplodablePart[];
  updateState: (params: {
    explode: number;
    signalRms: number;
    faultLed: boolean;
    alarmLed: boolean;
    netLed: boolean;
    fanBlocked: boolean;
    tempStatus: 'nominal' | 'warning' | 'critical';
    currentStatus: 'nominal' | 'warning' | 'critical';
    dt: number;
  }) => void;
}

export interface SpeakerRig {
  root: THREE.Group;
  grilleGroup: THREE.Group;
  grilleMat: THREE.MeshStandardMaterial;
  coneGroup: THREE.Group;
  voiceCoilGroup: THREE.Group;
  tapDial: THREE.Mesh;
  waveRings: THREE.Mesh[];
  waveRingMats: THREE.MeshBasicMaterial[];
  dcCapBlockMat: THREE.MeshStandardMaterial;
  explodables: ExplodablePart[];
  updateState: (params: {
    explode: number;
    grilleTransparent: boolean;
    wattageTap: WattageTap;
    audioPassing: boolean;
    signalRms: number;
    timeSec: number;
  }) => void;
}

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

// =====================================================================
// 1. MODULE 1: GOOSENECK MICROPHONE (Composite Multi-Part 3D Model)
// =====================================================================
export function buildGooseneckMicModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): GooseneckRig {
  const root = new THREE.Group();
  root.name = 'GooseneckMicrophone';

  const explodables: ExplodablePart[] = [];

  const darkAnodizedMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    roughness: 0.42,
    metalness: 0.72,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.004,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8e4,
    roughness: 0.16,
    metalness: 0.94,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a44a,
    roughness: 0.25,
    metalness: 0.88,
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x222831,
    map: textures.foamTexture,
    roughness: 0.92,
    metalness: 0.02,
  });

  // 1. Weighted Base & Rear XLR Connector
  const baseGroup = new THREE.Group();
  const baseLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.74, 0.16, 36),
    darkAnodizedMat,
  );
  baseLower.position.y = 0.08;
  baseLower.castShadow = true;
  baseLower.receiveShadow = true;

  const baseTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.14, 1.05),
    darkAnodizedMat,
  );
  baseTop.position.set(0, 0.19, 0.02);
  baseTop.castShadow = true;

  const xlrHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.18, 20),
    chromeMat,
  );
  xlrHousing.rotation.x = Math.PI / 2;
  xlrHousing.position.set(0, 0.14, -0.58);

  // 3 XLR pins
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8),
      brassMat,
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.set(Math.cos(a) * 0.04, 0.14 + Math.sin(a) * 0.04, -0.66);
    baseGroup.add(pin);
  }
  baseGroup.add(baseLower, baseTop, xlrHousing);
  root.add(baseGroup);
  registerClickable(baseGroup, 'mic_base', clickables);
  explodables.push({
    mesh: baseGroup,
    partId: 'mic_base',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0, -0.35, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.15, 0),
  });

  // 2. PTT Button + LED Status Ring
  const pttGroup = new THREE.Group();
  pttGroup.position.set(0, 0.27, 0.34);
  const pttRingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x10b981,
    emissiveIntensity: 0.15,
    roughness: 0.3,
  });
  const pttRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.018, 12, 28),
    pttRingMat,
  );
  pttRing.rotation.x = Math.PI / 2;
  const pttButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.11, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 }),
  );
  pttButton.position.y = 0.015;
  pttGroup.add(pttRing, pttButton);
  root.add(pttGroup);
  registerClickable(pttGroup, 'mic_ptt', clickables);
  explodables.push({
    mesh: pttGroup,
    partId: 'mic_ptt',
    basePos: pttGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.25, 0.45),
    anchorLocalPos: new THREE.Vector3(0, 0.02, 0),
  });

  // 3. Articulated Gooseneck & Internal Conductor Cable
  const initialCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.26, -0.15),
    new THREE.Vector3(0, 1.0, -0.15),
    new THREE.Vector3(0, 1.75, 0.05),
    new THREE.Vector3(0, 2.25, 0.32),
  ]);

  const neckGeo = new THREE.TubeGeometry(initialCurve, 28, 0.055, 16, false);
  const neckMat = new THREE.MeshStandardMaterial({
    color: 0x293240,
    roughness: 0.38,
    metalness: 0.85,
    transparent: true,
    opacity: 0.96,
  });
  const neckMesh = new THREE.Mesh(neckGeo, neckMat);
  neckMesh.castShadow = true;
  root.add(neckMesh);
  registerClickable(neckMesh, 'mic_gooseneck', clickables);
  explodables.push({
    mesh: neckMesh,
    partId: 'mic_gooseneck',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(-0.35, 0.15, 0),
    anchorLocalPos: new THREE.Vector3(0, 1.25, -0.05),
  });

  const conductorMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.6,
  });
  const conductorGeo = new THREE.TubeGeometry(initialCurve, 28, 0.022, 10, false);
  const conductorMesh = new THREE.Mesh(conductorGeo, conductorMat);
  root.add(conductorMesh);
  registerClickable(conductorMesh, 'mic_cable', clickables);
  explodables.push({
    mesh: conductorMesh,
    partId: 'mic_cable',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0.45, 0.15, 0),
    anchorLocalPos: new THREE.Vector3(0, 1.35, 0),
  });

  // 4. Capsule Head Assembly + Diaphragm + Windshield + Sound Sensor Probe
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.25, 0.32);

  const capsuleGroup = new THREE.Group();
  const capsuleBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.068, 0.24, 24),
    chromeMat,
  );
  capsuleBody.rotation.x = Math.PI / 3;
  const capsuleDiaphragm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.066, 0.066, 0.03, 24),
    brassMat,
  );
  capsuleDiaphragm.rotation.x = Math.PI / 3;
  capsuleDiaphragm.position.set(0, 0.065, 0.11);
  capsuleGroup.add(capsuleBody, capsuleDiaphragm);
  headGroup.add(capsuleGroup);
  registerClickable(capsuleGroup, 'mic_capsule', clickables);
  explodables.push({
    mesh: capsuleGroup,
    partId: 'mic_capsule',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeOffset: new THREE.Vector3(0, 0.35, 0.2),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  const windshieldMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.135, 0.16, 12, 24),
    foamMat,
  );
  windshieldMesh.rotation.x = Math.PI / 3;
  windshieldMesh.position.set(0, 0.05, 0.09);
  headGroup.add(windshieldMesh);
  registerClickable(windshieldMesh, 'mic_windshield', clickables);
  explodables.push({
    mesh: windshieldMesh,
    partId: 'mic_windshield',
    basePos: new THREE.Vector3(0, 0.05, 0.09),
    explodeOffset: new THREE.Vector3(0, 0.55, 0.65),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 5. Sound Sensor Probe on Operator Desk (MEMS SPL INMP441)
  const micSoundSensor = new THREE.Group();
  micSoundSensor.position.set(0.42, 0.29, 0.28);
  const sensorChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.04, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 }),
  );
  const sensorPort = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 }),
  );
  sensorPort.position.y = 0.025;
  micSoundSensor.add(sensorChip, sensorPort);
  root.add(micSoundSensor);
  registerClickable(micSoundSensor, 'sensor_sound_mic', clickables);
  explodables.push({
    mesh: micSoundSensor,
    partId: 'sensor_sound_mic',
    basePos: micSoundSensor.position.clone(),
    explodeOffset: new THREE.Vector3(0.4, 0.25, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0.02, 0),
  });

  // Wind Airflow Particles
  const windCount = 60;
  const windPos = new Float32Array(windCount * 3);
  for (let i = 0; i < windCount; i++) {
    windPos[i * 3] = (Math.random() - 0.5) * 0.45;
    windPos[i * 3 + 1] = 2.0 + (Math.random() - 0.5) * 0.45;
    windPos[i * 3 + 2] = 0.8 + Math.random() * 0.9;
  }
  const windGeo = new THREE.BufferGeometry();
  windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
  const windParticles = new THREE.Points(
    windGeo,
    new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.04,
      transparent: true,
      opacity: 0.75,
    }),
  );
  windParticles.visible = false;
  root.add(windParticles);
  root.add(headGroup);

  let lastAngle = -999;

  return {
    root,
    headGroup,
    neckMesh,
    conductorMesh,
    windshieldMesh,
    capsuleDiaphragm,
    pttButton,
    pttRingMat,
    conductorMat,
    windParticles,
    explodables,
    updatePose: (angleDeg, explode, pttActive, signalRms, windActive, windshieldOn, timeSec) => {
      // Rebuild gooseneck curve only when angle changes meaningfully
      if (Math.abs(angleDeg - lastAngle) > 0.25) {
        lastAngle = angleDeg;
        const rad = (angleDeg * Math.PI) / 180;
        const tipZ = 0.28 + Math.sin(rad) * 0.72;
        const tipY = 2.15 - Math.abs(Math.sin(rad)) * 0.25;
        const midZ = -0.05 + Math.sin(rad) * 0.25;

        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.26, -0.15),
          new THREE.Vector3(0, 1.0, -0.15),
          new THREE.Vector3(0, 1.68, midZ),
          new THREE.Vector3(0, tipY, tipZ),
        ]);
        neckMesh.geometry.dispose();
        neckMesh.geometry = new THREE.TubeGeometry(curve, 26, 0.055, 16, false);
        conductorMesh.geometry.dispose();
        conductorMesh.geometry = new THREE.TubeGeometry(curve, 26, 0.022, 10, false);

        headGroup.position.set(0, tipY, tipZ);
        headGroup.rotation.x = rad * 0.65;
      }

      neckMat.opacity = explode > 0.15 ? 0.35 : 0.96;
      pttButton.position.y = pttActive ? 0.002 : 0.018;
      pttRingMat.emissive.setHex(pttActive ? 0x10b981 : 0xf43f5e);
      pttRingMat.emissiveIntensity = pttActive ? 1.4 : 0.2;

      conductorMat.emissiveIntensity = pttActive ? 0.4 + signalRms * 2.0 : 0.12;
      capsuleDiaphragm.position.z = 0.11 + Math.sin(timeSec * 42) * signalRms * 0.012;

      windshieldMesh.visible = windshieldOn;

      windParticles.visible = windActive;
      if (windActive) {
        const attr = windParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < windCount; i++) {
          let z = attr.getZ(i) - 0.035;
          if (z < (windshieldOn ? 0.42 : 0.18)) {
            z = 1.45;
          }
          attr.setZ(i, z);
        }
        attr.needsUpdate = true;
      }
    },
  };
}

// =====================================================================
// 2. MODULE 2: NETWORK CONTROL UNIT (NCU) / NETWORK MIXER (2U Rack)
// =====================================================================
export function buildNcuModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): NcuRig {
  const root = new THREE.Group();
  root.name = 'NetworkControlUnit';
  const explodables: ExplodablePart[] = [];

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1b232e,
    roughness: 0.38,
    metalness: 0.78,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.005,
  });

  const frontPlateMat = new THREE.MeshStandardMaterial({
    color: 0x252f3d,
    roughness: 0.32,
    metalness: 0.85,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.004,
  });

  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pcbTexture,
    roughness: 0.55,
    metalness: 0.15,
  });

  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.45,
    metalness: 0.3,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.25,
    metalness: 0.9,
  });

  // Lower Chassis Tray
  const chassisBase = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.12, 2.0),
    chassisMat,
  );
  chassisBase.position.set(0, 0.06, 0);
  chassisBase.castShadow = true;
  chassisBase.receiveShadow = true;
  root.add(chassisBase);

  // Side walls
  const sideGeo = new THREE.BoxGeometry(0.08, 0.78, 2.0);
  const leftWall = new THREE.Mesh(sideGeo, chassisMat);
  leftWall.position.set(-1.66, 0.45, 0);
  const rightWall = new THREE.Mesh(sideGeo, chassisMat);
  rightWall.position.set(1.66, 0.45, 0);
  root.add(leftWall, rightWall);

  // Top Cutaway Lid
  const topLid = new THREE.Mesh(
    new THREE.BoxGeometry(3.42, 0.06, 2.02),
    chassisMat,
  );
  topLid.position.set(0, 0.86, 0);
  topLid.castShadow = true;
  root.add(topLid);
  explodables.push({
    mesh: topLid,
    partId: 'ncu_chassis',
    basePos: topLid.position.clone(),
    explodeOffset: new THREE.Vector3(0, 1.35, 0),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Main PCB Motherboard
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.04, 1.78), pcbMat);
  mainPcb.position.set(0, 0.16, 0);
  root.add(mainPcb);

  // Front Panel Assembly (OLED + LEDs + Monitor Jack + Rack Ears)
  const frontGroup = new THREE.Group();
  frontGroup.position.set(0, 0.45, 1.02);
  const facePlate = new THREE.Mesh(
    new THREE.BoxGeometry(3.75, 0.84, 0.07),
    frontPlateMat,
  );
  facePlate.castShadow = true;
  frontGroup.add(facePlate);

  // OLED Screen
  const lcdMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 0.38),
    new THREE.MeshBasicMaterial({ map: textures.ncuLcdTexture }),
  );
  lcdMesh.position.set(-0.78, 0.04, 0.04);
  frontGroup.add(lcdMesh);

  // Status LEDs (Power, Signal, Network, Fault, Alarm)
  const ledGeo = new THREE.SphereGeometry(0.032, 12, 12);
  const ledPowerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 });
  const ledSignalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.2 });
  const ledNetMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 1.0 });
  const ledFaultMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.05 });
  const ledAlarmMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.05 });

  const ledMats = [ledPowerMat, ledSignalMat, ledNetMat, ledFaultMat, ledAlarmMat];
  ledMats.forEach((mat, i) => {
    const led = new THREE.Mesh(ledGeo, mat);
    led.position.set(0.08 + i * 0.16, 0.14, 0.04);
    frontGroup.add(led);
  });

  // Monitor Headphone Jack + Mixer Knobs
  const phoneJack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 16),
    goldMat,
  );
  phoneJack.rotation.x = Math.PI / 2;
  phoneJack.position.set(1.38, -0.14, 0.04);
  frontGroup.add(phoneJack);

  for (let k = 0; k < 4; k++) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.07, 18),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.8 }),
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.15 + k * 0.26, -0.14, 0.05);
    frontGroup.add(knob);
  }
  root.add(frontGroup);
  registerClickable(frontGroup, 'ncu_front', clickables);
  explodables.push({
    mesh: frontGroup,
    partId: 'ncu_front',
    basePos: frontGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0, 0.72),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Subsystem 1: Core Processing (CPU + Heatsink, DSP, Audio Matrix, Flash/SD)
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(-0.7, 0.24, 0.15);
  const cpuBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.45), chipMat);
  const heatsink = new THREE.Group();
  for (let f = -3; f <= 3; f++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.18, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.85 }),
    );
    fin.position.set(0, 0.12, f * 0.06);
    heatsink.add(fin);
  }
  cpuGroup.add(cpuBase, heatsink);
  root.add(cpuGroup);
  registerClickable(cpuGroup, 'ncu_cpu', clickables);
  explodables.push({
    mesh: cpuGroup,
    partId: 'ncu_cpu',
    basePos: cpuGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.35, 0.65, 0.2),
    anchorLocalPos: new THREE.Vector3(0, 0.1, 0),
  });

  const dspChip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), chipMat);
  dspChip.position.set(-0.08, 0.22, 0.25);
  const dspCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), goldMat);
  dspCap.position.set(0, 0.045, 0);
  dspChip.add(dspCap);
  root.add(dspChip);
  registerClickable(dspChip, 'ncu_dsp', clickables);
  explodables.push({
    mesh: dspChip,
    partId: 'ncu_dsp',
    basePos: dspChip.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.72, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0.04, 0),
  });

  const matrixChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.4 }),
  );
  matrixChip.position.set(0.55, 0.22, 0.25);
  root.add(matrixChip);
  registerClickable(matrixChip, 'ncu_matrix', clickables);
  explodables.push({
    mesh: matrixChip,
    partId: 'ncu_matrix',
    basePos: matrixChip.position.clone(),
    explodeOffset: new THREE.Vector3(0.25, 0.68, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0.04, 0),
  });

  const flashCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.06, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.2 }),
  );
  flashCard.position.set(-1.25, 0.22, 0.45);
  root.add(flashCard);
  registerClickable(flashCard, 'ncu_flash', clickables);
  explodables.push({
    mesh: flashCard,
    partId: 'ncu_flash',
    basePos: flashCard.position.clone(),
    explodeOffset: new THREE.Vector3(-0.55, 0.55, 0.3),
    anchorLocalPos: new THREE.Vector3(0, 0.03, 0),
  });

  // Subsystem 2: Pre-Amp +48V & ADC/DAC + Rear Analog I/O
  const preampModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.14, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4, metalness: 0.35 }),
  );
  preampModule.position.set(-1.15, 0.25, -0.35);
  root.add(preampModule);
  registerClickable(preampModule, 'ncu_preamp', clickables);
  explodables.push({
    mesh: preampModule,
    partId: 'ncu_preamp',
    basePos: preampModule.position.clone(),
    explodeOffset: new THREE.Vector3(-0.45, 0.65, -0.2),
    anchorLocalPos: new THREE.Vector3(0, 0.07, 0),
  });

  const rearIoGroup = new THREE.Group();
  rearIoGroup.position.set(-0.9, 0.42, -1.01);
  for (let i = 0; i < 3; i++) {
    const port = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 }),
    );
    port.rotation.x = Math.PI / 2;
    port.position.set(-0.32 + i * 0.28, 0, 0);
    rearIoGroup.add(port);
  }
  root.add(rearIoGroup);
  registerClickable(rearIoGroup, 'ncu_io_rear', clickables);
  explodables.push({
    mesh: rearIoGroup,
    partId: 'ncu_io_rear',
    basePos: rearIoGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.25, 0.2, -0.65),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Subsystem 3: Dual-Port NIC (RJ45) + Fiber SFP + PoE
  const nicGroup = new THREE.Group();
  nicGroup.position.set(0.05, 0.34, -0.68);
  const nicCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.18, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.4, metalness: 0.35 }),
  );
  const rj45a = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.18), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 }));
  rj45a.position.set(-0.22, 0.04, -0.28);
  const rj45b = rj45a.clone();
  rj45b.position.set(0.0, 0.04, -0.28);
  const sfpCage = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.24), goldMat);
  sfpCage.position.set(0.24, 0.04, -0.28);
  nicGroup.add(nicCard, rj45a, rj45b, sfpCage);
  root.add(nicGroup);
  registerClickable(nicGroup, 'ncu_nic', clickables);
  explodables.push({
    mesh: nicGroup,
    partId: 'ncu_nic',
    basePos: nicGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.55, -0.55),
    anchorLocalPos: new THREE.Vector3(0, 0.08, 0),
  });

  // Subsystem 4: Emergency FACP GPIO & Line Supervision Relays
  const facpGroup = new THREE.Group();
  facpGroup.position.set(0.75, 0.28, -0.45);
  const relayBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.22, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.42, metalness: 0.25 }),
  );
  const gpioTerminals = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.14, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 }),
  );
  gpioTerminals.position.set(0, 0.04, -0.32);
  facpGroup.add(relayBlock, gpioTerminals);
  root.add(facpGroup);
  registerClickable(facpGroup, 'ncu_facp', clickables);
  explodables.push({
    mesh: facpGroup,
    partId: 'ncu_facp',
    basePos: facpGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.3, 0.65, -0.35),
    anchorLocalPos: new THREE.Vector3(0, 0.08, 0),
  });

  // Subsystem 5: Dual Power Supply (220V AC + 24V DC UPS) + Cooling Fan
  const psuGroup = new THREE.Group();
  psuGroup.position.set(1.26, 0.36, 0.12);
  const psuBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.42, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.75 }),
  );
  const fanRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
  );
  fanRing.position.set(0, 0.22, 0.22);
  const fanBlades = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.02, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }),
  );
  fanBlades.position.set(0, 0.24, 0.22);
  psuGroup.add(psuBox, fanRing, fanBlades);
  root.add(psuGroup);
  registerClickable(psuGroup, 'ncu_power', clickables);
  explodables.push({
    mesh: psuGroup,
    partId: 'ncu_power',
    basePos: psuGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.65, 0.45, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.1, 0),
  });

  // Sensor 2: Hall-Effect Current Sensor (ACS712-05B) on 70V/100V Line Output
  const currentSensorGroup = new THREE.Group();
  currentSensorGroup.position.set(0.62, 0.32, -0.92);
  const currentSensorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.6,
  });
  const hallToroid = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.035, 12, 24),
    currentSensorMat,
  );
  const shuntChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.08, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }),
  );
  shuntChip.position.set(0, -0.09, 0);
  currentSensorGroup.add(hallToroid, shuntChip);
  root.add(currentSensorGroup);
  registerClickable(currentSensorGroup, 'sensor_current_ncu', clickables);
  explodables.push({
    mesh: currentSensorGroup,
    partId: 'sensor_current_ncu',
    basePos: currentSensorGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.35, 0.55, -0.55),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Sensor 3: Digital Temperature Probe (DS18B20) on Amplifier Heatsink
  const tempSensorGroup = new THREE.Group();
  tempSensorGroup.position.set(-0.42, 0.48, 0.18);
  const tempProbeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.4,
    roughness: 0.25,
    metalness: 0.7,
  });
  const probeCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16),
    tempProbeMat,
  );
  probeCylinder.rotation.z = Math.PI / 2;
  tempSensorGroup.add(probeCylinder);
  root.add(tempSensorGroup);
  registerClickable(tempSensorGroup, 'sensor_temp_ncu', clickables);
  explodables.push({
    mesh: tempSensorGroup,
    partId: 'sensor_temp_ncu',
    basePos: tempSensorGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.2, 0.9, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  return {
    root,
    topLid,
    ledPowerMat,
    ledSignalMat,
    ledNetMat,
    ledFaultMat,
    ledAlarmMat,
    fanBlades,
    tempProbeMat,
    currentSensorMat,
    explodables,
    updateState: ({
      explode,
      signalRms,
      faultLed,
      alarmLed,
      netLed,
      fanBlocked,
      tempStatus,
      currentStatus,
      dt,
    }) => {
      topLid.visible = explode < 0.92;
      (topLid.material as THREE.MeshStandardMaterial).transparent = explode > 0.05;
      (topLid.material as THREE.MeshStandardMaterial).opacity = Math.max(0.18, 1 - explode * 0.85);

      ledSignalMat.emissiveIntensity = 0.15 + signalRms * 2.2;
      ledNetMat.emissiveIntensity = netLed ? 1.1 : 0.05;
      ledFaultMat.emissiveIntensity = faultLed ? 1.8 : 0.05;
      ledAlarmMat.emissiveIntensity = alarmLed ? 2.2 : 0.05;

      if (!fanBlocked) {
        fanBlades.rotation.y += dt * 14.0;
      }

      const tempHex =
        tempStatus === 'critical'
          ? 0xf43f5e
          : tempStatus === 'warning'
            ? 0xf59e0b
            : 0x10b981;
      tempProbeMat.color.setHex(tempHex);
      tempProbeMat.emissive.setHex(tempHex);

      const curHex =
        currentStatus === 'critical'
          ? 0xf43f5e
          : currentStatus === 'warning'
            ? 0xf59e0b
            : 0x38bdf8;
      currentSensorMat.color.setHex(curHex);
      currentSensorMat.emissive.setHex(curHex);
    },
  };
}

// =====================================================================
// 3. MODULE 3: GENESIS PUBLIC ADDRESS CEILING SPEAKER (8+ Parts)
// =====================================================================
export function buildCeilingSpeakerModel(
  textures: ProceduralTextures,
  clickables: THREE.Object3D[],
): SpeakerRig {
  const root = new THREE.Group();
  root.name = 'GenesisCeilingSpeaker';
  const explodables: ExplodablePart[] = [];

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.45,
    metalness: 0.82,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.004,
  });

  const baffleMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.55,
    metalness: 0.1,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.24,
    metalness: 0.92,
  });

  const ferriteMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.4,
  });

  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x27303f,
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // 1. Steel Backcan / Enclosure & Mounting Baffle (Top-most layer)
  const backcanGroup = new THREE.Group();
  backcanGroup.position.set(0, 1.45, 0);
  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.85, 32),
    steelMat,
  );
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.95, 0.14, 32),
    steelMat,
  );
  topCap.position.y = 0.49;
  const baffleFlange = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.28, 36),
    baffleMat,
  );
  baffleFlange.rotation.x = Math.PI / 2;
  baffleFlange.position.y = -0.42;
  backcanGroup.add(dome, topCap, baffleFlange);
  root.add(backcanGroup);
  registerClickable(backcanGroup, 'spk_backcan', clickables);
  explodables.push({
    mesh: backcanGroup,
    partId: 'spk_backcan',
    basePos: backcanGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 1.35, 0),
    anchorLocalPos: new THREE.Vector3(0, 0.15, 0),
  });

  // 2. Terminal Block & DC Blocking Capacitor
  const terminalGroup = new THREE.Group();
  terminalGroup.position.set(0.68, 1.28, 0.18);
  const ceramicBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.16, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 }),
  );
  const dcCapBlockMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    roughness: 0.35,
  });
  const dcCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.24, 16),
    dcCapBlockMat,
  );
  dcCap.rotation.z = Math.PI / 2;
  dcCap.position.set(0, 0.14, 0);
  terminalGroup.add(ceramicBlock, dcCap);
  root.add(terminalGroup);
  registerClickable(terminalGroup, 'spk_terminal', clickables);
  explodables.push({
    mesh: terminalGroup,
    partId: 'spk_terminal',
    basePos: terminalGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.75, 0.95, 0.2),
    anchorLocalPos: new THREE.Vector3(0, 0.05, 0),
  });

  // 3. Wattage Tap Selector Switch (1/4W, 1/2W, 1W, 2W)
  const tapGroup = new THREE.Group();
  tapGroup.position.set(-0.68, 1.25, 0.25);
  const tapBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 }),
  );
  const tapDial = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 }),
  );
  tapDial.position.y = 0.06;
  tapGroup.add(tapBody, tapDial);
  root.add(tapGroup);
  registerClickable(tapGroup, 'spk_tap', clickables);
  explodables.push({
    mesh: tapGroup,
    partId: 'spk_tap',
    basePos: tapGroup.position.clone(),
    explodeOffset: new THREE.Vector3(-0.75, 0.85, 0.2),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 4. 25V/70V/100V Line Matching Transformer
  const transformerGroup = new THREE.Group();
  transformerGroup.position.set(0.28, 1.08, -0.35);
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.32, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.85 }),
  );
  const bobbin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.24, 20),
    copperMat,
  );
  transformerGroup.add(core, bobbin);
  root.add(transformerGroup);
  registerClickable(transformerGroup, 'spk_transformer', clickables);
  explodables.push({
    mesh: transformerGroup,
    partId: 'spk_transformer',
    basePos: transformerGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.45, 0.65, -0.45),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 5. Permanent Magnet & Yoke Assembly (+ Temperature Probe)
  const magnetGroup = new THREE.Group();
  magnetGroup.position.set(0, 0.92, 0);
  const magnetRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.22, 32),
    ferriteMat,
  );
  const backYoke = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.06, 32),
    steelMat,
  );
  backYoke.position.y = 0.13;
  const frontYoke = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.05, 32),
    steelMat,
  );
  frontYoke.position.y = -0.13;
  magnetGroup.add(magnetRing, backYoke, frontYoke);
  root.add(magnetGroup);
  registerClickable(magnetGroup, 'spk_magnet', clickables);
  explodables.push({
    mesh: magnetGroup,
    partId: 'spk_magnet',
    basePos: magnetGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.42, 0),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Speaker Temperature Sensor (NTC 10kOhm on Magnet Yoke / Voice Coil)
  const spkTempSensor = new THREE.Group();
  spkTempSensor.position.set(-0.48, 0.96, 0.14);
  const spkTempBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6 }),
  );
  spkTempSensor.add(spkTempBead);
  root.add(spkTempSensor);
  registerClickable(spkTempSensor, 'sensor_temp_spk', clickables);
  explodables.push({
    mesh: spkTempSensor,
    partId: 'sensor_temp_spk',
    basePos: spkTempSensor.position.clone(),
    explodeOffset: new THREE.Vector3(-0.55, 0.48, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 6. Voice Coil & Spider Suspension
  const voiceCoilGroup = new THREE.Group();
  voiceCoilGroup.position.set(0, 0.68, 0);
  const coilFormer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.26, 28, 1, true),
    copperMat,
  );
  const spiderDisc = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.42, 28),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75, side: THREE.DoubleSide }),
  );
  spiderDisc.rotation.x = Math.PI / 2;
  spiderDisc.position.y = -0.06;
  voiceCoilGroup.add(coilFormer, spiderDisc);
  root.add(voiceCoilGroup);
  registerClickable(voiceCoilGroup, 'spk_voicecoil', clickables);
  explodables.push({
    mesh: voiceCoilGroup,
    partId: 'spk_voicecoil',
    basePos: voiceCoilGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.05, 0),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 7. Full-Range Speaker Cone (LatheGeometry ribbed profile)
  const coneGroup = new THREE.Group();
  coneGroup.position.set(0, 0.46, 0);
  const coneProfile = [
    new THREE.Vector2(0.16, 0.16),
    new THREE.Vector2(0.45, 0.04),
    new THREE.Vector2(0.78, -0.14),
    new THREE.Vector2(0.88, -0.16),
  ];
  const coneMesh = new THREE.Mesh(new THREE.LatheGeometry(coneProfile, 36), coneMat);
  const dustCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65 }),
  );
  dustCap.rotation.x = Math.PI;
  dustCap.position.y = 0.16;
  coneGroup.add(coneMesh, dustCap);
  root.add(coneGroup);
  registerClickable(coneGroup, 'spk_cone', clickables);
  explodables.push({
    mesh: coneGroup,
    partId: 'spk_cone',
    basePos: coneGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.52, 0),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // 8. Low-Profile Perforated Ceiling Grille + Sound Sensor Probe on Baffle Rim
  const grilleGroup = new THREE.Group();
  grilleGroup.position.set(0, 0.22, 0);
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.grilleTexture,
    alphaMap: textures.grilleAlpha,
    transparent: true,
    opacity: 0.98,
    roughness: 0.42,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });
  const grilleDisc = new THREE.Mesh(new THREE.CircleGeometry(1.18, 48), grilleMat);
  grilleDisc.rotation.x = Math.PI / 2;
  const grilleRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.05, 12, 48),
    baffleMat,
  );
  grilleRim.rotation.x = Math.PI / 2;
  grilleGroup.add(grilleDisc, grilleRim);
  root.add(grilleGroup);
  registerClickable(grilleGroup, 'spk_grille', clickables);
  explodables.push({
    mesh: grilleGroup,
    partId: 'spk_grille',
    basePos: grilleGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, -1.05, 0),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Sound Sensor (MEMS SPL INMP441) mounted at ceiling baffle rim
  const spkSoundSensor = new THREE.Group();
  spkSoundSensor.position.set(1.06, 0.24, 0.42);
  const spkSndBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.06, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }),
  );
  const spkSndLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.7 }),
  );
  spkSndLens.position.y = -0.03;
  spkSoundSensor.add(spkSndBody, spkSndLens);
  root.add(spkSoundSensor);
  registerClickable(spkSoundSensor, 'sensor_sound_spk', clickables);
  explodables.push({
    mesh: spkSoundSensor,
    partId: 'sensor_sound_spk',
    basePos: spkSoundSensor.position.clone(),
    explodeOffset: new THREE.Vector3(0.45, -0.95, 0.25),
    anchorLocalPos: new THREE.Vector3(0, 0, 0),
  });

  // Expanding Acoustic Wavefront Rings below speaker
  const waveRings: THREE.Mesh[] = [];
  const waveRingMats: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.68, 40), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05 - i * 0.25;
    root.add(ring);
    waveRings.push(ring);
    waveRingMats.push(mat);
  }

  return {
    root,
    grilleGroup,
    grilleMat,
    coneGroup,
    voiceCoilGroup,
    tapDial,
    waveRings,
    waveRingMats,
    dcCapBlockMat,
    explodables,
    updateState: ({
      explode,
      grilleTransparent,
      wattageTap,
      audioPassing,
      signalRms,
      timeSec,
    }) => {
      grilleMat.opacity = grilleTransparent ? 0.22 : 0.98;

      const tapAngles: Record<WattageTap, number> = {
        0.25: -0.9,
        0.5: -0.3,
        1: 0.3,
        2: 0.9,
      };
      tapDial.rotation.y = tapAngles[wattageTap];

      // Voice coil + cone Lorentz excursion
      const excursion = audioPassing
        ? Math.sin(timeSec * 44) * signalRms * (0.02 + wattageTap * 0.025)
        : 0;
      const coilBaseY = 0.68 + explode * -0.05;
      const coneBaseY = 0.46 + explode * -0.52;
      voiceCoilGroup.position.y = coilBaseY + excursion;
      coneGroup.position.y = coneBaseY + excursion;

      // Wavefront rings proportional to wattage tap
      const tapScale = 0.65 + wattageTap * 0.45;
      for (let i = 0; i < waveRings.length; i++) {
        if (!audioPassing) {
          waveRingMats[i].opacity = 0;
          continue;
        }
        const phase = (timeSec * 1.15 + i * 0.33) % 1;
        const scale = (0.45 + phase * 1.45) * tapScale;
        waveRings[i].scale.setScalar(scale);
        waveRings[i].position.y = 0.1 - phase * (0.75 * tapScale) - explode * 0.85;
        waveRingMats[i].opacity = (1 - phase) * (0.45 + signalRms * 0.35);
      }
    },
  };
}

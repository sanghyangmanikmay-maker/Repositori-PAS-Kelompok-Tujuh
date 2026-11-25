import * as THREE from 'three';
import { SystemTelemetry, ViewMode } from '../sim/types';

export interface SignalRoute {
  id: string;
  curve: THREE.CatmullRomCurve3;
  color: number;
  type: 'acoustic' | 'analog' | 'ip' | 'dc' | 'line100v';
}

export interface TopologyStageRig {
  root: THREE.Group;
  micAnchor: THREE.Group;
  ncuAnchor: THREE.Group;
  speakerZoneBAnchor: THREE.Group;
  speakerZoneCAnchor: THREE.Group;
  facpBox: THREE.Mesh;
  facpBeaconMat: THREE.MeshStandardMaterial;
  faultSpark: THREE.Mesh;
  zoneFloorGlows: Record<'A' | 'B' | 'C', THREE.MeshBasicMaterial>;
  updateParticles: (params: {
    viewMode: ViewMode;
    activeComponent: 'mic' | 'ncu' | 'speaker';
    principleStage: number;
    telemetry: SystemTelemetry;
    pttActive: boolean;
    timeSec: number;
    lineFault: 'normal' | 'open' | 'short';
    ethCut: boolean;
  }) => void;
}

const _dummy = new THREE.Object3D();
const _pt = new THREE.Vector3();
const _color = new THREE.Color();

export function buildTopologyAndSignalSystem(
  clickables: THREE.Object3D[],
): TopologyStageRig {
  const root = new THREE.Group();
  root.name = 'AirportTopologyStage';

  // 3 Airport Architectural Zones (Grounded on y = 0)
  const zoneSpecs: Array<{
    id: 'A' | 'B' | 'C';
    x: number;
    z: number;
    w: number;
    d: number;
    accent: number;
  }> = [
    { id: 'A', x: -4.2, z: 0.4, w: 4.8, d: 5.2, accent: 0x38bdf8 },
    { id: 'B', x: 1.6, z: -1.4, w: 4.2, d: 3.4, accent: 0x10b981 },
    { id: 'C', x: 1.6, z: 2.3, w: 4.2, d: 3.4, accent: 0x8b5cf6 },
  ];

  const zoneFloorGlows = {} as Record<'A' | 'B' | 'C', THREE.MeshBasicMaterial>;
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x151e29,
    roughness: 0.72,
    metalness: 0.18,
  });
  const wallFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.65,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.14,
    roughness: 0.15,
    metalness: 0.1,
    depthWrite: false,
  });

  zoneSpecs.forEach((z) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(z.w, 0.12, z.d), slabMat);
    slab.position.set(z.x, 0.06, z.z);
    slab.receiveShadow = true;
    root.add(slab);

    const glowMat = new THREE.MeshBasicMaterial({
      color: z.accent,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(z.w - 0.18, z.d - 0.18),
      glowMat,
    );
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.set(z.x, 0.125, z.z);
    root.add(glowPlane);
    zoneFloorGlows[z.id] = glowMat;

    // Subtle structural corner posts & low glass partitions
    const postGeo = new THREE.BoxGeometry(0.08, 2.5, 0.08);
    [
      [-z.w / 2 + 0.08, -z.d / 2 + 0.08],
      [z.w / 2 - 0.08, -z.d / 2 + 0.08],
      [-z.w / 2 + 0.08, z.d / 2 - 0.08],
      [z.w / 2 - 0.08, z.d / 2 - 0.08],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, wallFrameMat);
      post.position.set(z.x + px, 1.32, z.z + pz);
      root.add(post);
    });

    const backGlass = new THREE.Mesh(
      new THREE.BoxGeometry(z.w - 0.2, 2.35, 0.03),
      glassMat,
    );
    backGlass.position.set(z.x, 1.3, z.z - z.d / 2 + 0.08);
    root.add(backGlass);
  });

  // Operator Desk in Zone A
  const deskGroup = new THREE.Group();
  deskGroup.position.set(-4.3, 0.12, 0.8);
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.1, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.55, metalness: 0.2 }),
  );
  deskTop.position.y = 0.85;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  const legGeo = new THREE.BoxGeometry(0.1, 0.85, 1.25);
  const legL = new THREE.Mesh(legGeo, wallFrameMat);
  legL.position.set(-1.5, 0.425, 0);
  const legR = new THREE.Mesh(legGeo, wallFrameMat);
  legR.position.set(1.5, 0.425, 0);
  deskGroup.add(deskTop, legL, legR);
  root.add(deskGroup);

  // Anchors for Hero Models inside Topology Mode
  const micAnchor = new THREE.Group();
  micAnchor.position.set(-5.25, 1.02, 0.95);
  micAnchor.scale.setScalar(0.45);
  root.add(micAnchor);

  const ncuAnchor = new THREE.Group();
  ncuAnchor.position.set(-3.45, 1.02, 0.65);
  ncuAnchor.scale.setScalar(0.45);
  root.add(ncuAnchor);

  // FACP Fire Alarm Panel mounted on Zone A back wall
  const facpMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.38,
    metalness: 0.35,
  });
  const facpBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.18), facpMat);
  facpBox.position.set(-5.8, 1.55, -1.9);
  facpBox.userData.partId = 'ncu_facp';
  clickables.push(facpBox);

  const facpBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.15,
  });
  const facpBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    facpBeaconMat,
  );
  facpBeacon.position.set(0, 0.5, 0);
  facpBox.add(facpBeacon);
  root.add(facpBox);

  // Zone B & C Ceiling Speaker Mount Anchors
  const speakerZoneBAnchor = new THREE.Group();
  speakerZoneBAnchor.position.set(1.6, 2.25, -1.4);
  speakerZoneBAnchor.scale.setScalar(0.55);
  root.add(speakerZoneBAnchor);

  const speakerZoneCAnchor = new THREE.Group();
  speakerZoneCAnchor.position.set(1.6, 2.25, 2.3);
  speakerZoneCAnchor.scale.setScalar(0.55);
  root.add(speakerZoneCAnchor);

  // Secondary speaker visual proxy for Zone C in topology mode (matches Genesis Ceiling Speaker silhouette)
  const zoneCBackcan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.6, 0.48, 24),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.8 }),
  );
  zoneCBackcan.position.y = 0.25;
  const zoneCGrille = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.06, 28),
    new THREE.MeshStandardMaterial({ color: 0xdce2ea, roughness: 0.45, metalness: 0.3 }),
  );
  zoneCGrille.position.y = 0.0;
  zoneCBackcan.userData.partId = 'spk_backcan';
  zoneCGrille.userData.partId = 'spk_grille';
  clickables.push(zoneCBackcan, zoneCGrille);
  speakerZoneCAnchor.add(zoneCBackcan, zoneCGrille);

  // Signal Conduits (Visual cables between Mic -> NCU -> Zone B & C + FACP -> NCU)
  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.7,
    transparent: true,
    opacity: 0.65,
  });

  const routeMicToNcu = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.25, 1.06, 0.65),
    new THREE.Vector3(-4.5, 1.05, 0.25),
    new THREE.Vector3(-3.8, 1.15, 0.25),
  ]);
  const routeFacpToNcu = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.8, 1.55, -1.8),
    new THREE.Vector3(-4.8, 1.35, -0.8),
    new THREE.Vector3(-3.45, 1.18, 0.25),
  ]);
  const routeNcuToZoneB = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.7, 1.18, 0.2),
    new THREE.Vector3(-1.4, 2.45, -0.5),
    new THREE.Vector3(0.2, 2.6, -1.4),
    new THREE.Vector3(1.6, 2.55, -1.4),
  ]);
  const routeNcuToZoneC = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.7, 1.18, 0.5),
    new THREE.Vector3(-1.2, 2.45, 1.4),
    new THREE.Vector3(0.3, 2.6, 2.3),
    new THREE.Vector3(1.6, 2.55, 2.3),
  ]);

  [routeMicToNcu, routeFacpToNcu, routeNcuToZoneB, routeNcuToZoneC].forEach((curve) => {
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.032, 8, false),
      conduitMat,
    );
    root.add(tube);
  });

  // Fault spark / break indicator along Zone B line
  const faultSpark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
  );
  faultSpark.position.set(-0.3, 2.55, -1.05);
  faultSpark.visible = false;
  root.add(faultSpark);

  // Instanced Signal Flow Particles (120 particles pooled, zero GC)
  const particleCount = 120;
  const particleGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  particles.frustumCulled = false;
  root.add(particles);

  // Initialize particle colors so instanceColor attribute is allocated
  for (let i = 0; i < particleCount; i++) {
    _dummy.position.set(0, -100, 0);
    _dummy.scale.setScalar(0.001);
    _dummy.updateMatrix();
    particles.setMatrixAt(i, _dummy.matrix);
    particles.setColorAt(i, _color.setHex(0x38bdf8));
  }
  particles.instanceMatrix.needsUpdate = true;
  if (particles.instanceColor) particles.instanceColor.needsUpdate = true;

  // Principle Mode 5-Stage internal flow paths (in local Speaker inspect coordinates)
  const curveStage1ToCap = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.4, 1.4, 0.18),
    new THREE.Vector3(0.75, 1.38, 0.18),
  ]);
  const curveCapToTap = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.6, 1.28, 0.18),
    new THREE.Vector3(-0.05, 1.28, 0.22),
    new THREE.Vector3(-0.68, 1.26, 0.25),
  ]);
  const curveTapToTrafo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 1.22, 0.2),
    new THREE.Vector3(-0.15, 1.15, -0.1),
    new THREE.Vector3(0.28, 1.1, -0.35),
  ]);
  const curveTrafoToCoil = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.28, 1.0, -0.35),
    new THREE.Vector3(0.1, 0.82, -0.15),
    new THREE.Vector3(0, 0.68, 0),
  ]);

  return {
    root,
    micAnchor,
    ncuAnchor,
    speakerZoneBAnchor,
    speakerZoneCAnchor,
    facpBox,
    facpBeaconMat,
    faultSpark,
    zoneFloorGlows,
    updateParticles: ({
      viewMode,
      activeComponent,
      principleStage,
      telemetry,
      pttActive,
      timeSec,
      lineFault,
    }) => {
      // Update zone glow intensities
      (['A', 'B', 'C'] as const).forEach((zid) => {
        const zt = telemetry.zones[zid];
        const glow = zoneFloorGlows[zid];
        if (zt.activeBroadcast === 'emergency') {
          glow.color.setHex(0xf43f5e);
          glow.opacity = 0.22 + 0.08 * Math.sin(timeSec * 8);
        } else if (zt.activeBroadcast === 'paging') {
          glow.color.setHex(0x10b981);
          glow.opacity = 0.18;
        } else if (zt.activeBroadcast === 'bgm') {
          glow.color.setHex(0x38bdf8);
          glow.opacity = 0.13;
        } else {
          glow.color.setHex(0x475569);
          glow.opacity = 0.05;
        }
      });

      facpBeaconMat.emissiveIntensity = telemetry.alarmLedOn
        ? 1.5 + Math.sin(timeSec * 12) * 0.8
        : 0.12;

      faultSpark.visible = lineFault !== 'normal';
      if (faultSpark.visible) {
        faultSpark.rotation.y = timeSec * 4;
        faultSpark.scale.setScalar(0.85 + 0.3 * Math.sin(timeSec * 14));
      }

      // Position particles depending on viewMode
      if (viewMode === 'topology' || viewMode === 'faultlab') {
        particles.visible = true;
        for (let i = 0; i < particleCount; i++) {
          const slot = i % 5;
          const phase = ((timeSec * 0.45 + i * 0.07) % 1 + 1) % 1;
          let active = false;
          let hex = 0x38bdf8;

          if (slot === 0) {
            // Mic -> NCU Analog signal (Emerald)
            active = pttActive;
            hex = 0x10b981;
            routeMicToNcu.getPointAt(phase, _pt);
          } else if (slot === 1) {
            // FACP -> NCU GPIO Emergency trigger (Rose)
            active = telemetry.alarmLedOn;
            hex = 0xf43f5e;
            routeFacpToNcu.getPointAt(phase, _pt);
          } else if (slot === 2) {
            // NCU -> Zone B (70V/100V Line Audio Rose, or IP Violet)
            active = telemetry.zones.B.receivingAudio;
            hex = i % 2 === 0 ? 0xf43f5e : 0x8b5cf6;
            const t = lineFault !== 'normal' ? phase * 0.48 : phase;
            routeNcuToZoneB.getPointAt(t, _pt);
          } else if (slot === 3) {
            // NCU -> Zone C (70V/100V Line Audio Rose)
            active = telemetry.zones.C.receivingAudio;
            hex = 0xf43f5e;
            const t = lineFault !== 'normal' ? phase * 0.48 : phase;
            routeNcuToZoneC.getPointAt(t, _pt);
          } else {
            // DC Supervision Current (Amber) continuously pulsing along line
            active = lineFault !== 'open';
            hex = 0xf59e0b;
            const t = lineFault === 'short' ? phase * 0.5 : phase;
            routeNcuToZoneB.getPointAt(t, _pt);
          }

          if (active) {
            _dummy.position.copy(_pt);
            _dummy.scale.setScalar(1.0);
          } else {
            _dummy.position.set(0, -100, 0);
            _dummy.scale.setScalar(0.001);
          }
          _dummy.updateMatrix();
          particles.setMatrixAt(i, _dummy.matrix);
          particles.setColorAt(i, _color.setHex(hex));
        }
      } else if (viewMode === 'principle' || (viewMode === 'inspect' && activeComponent === 'speaker')) {
        // Show 5-stage internal signal flow directly inside Speaker model!
        particles.visible = true;
        for (let i = 0; i < particleCount; i++) {
          const phase = ((timeSec * 0.55 + i * 0.08) % 1 + 1) % 1;
          const groupIdx = i % 5;
          let active = true;
          let hex = 0xf43f5e;

          if (groupIdx === 0) {
            // DC Supervision Amber (stops right at DC Blocking Capacitor!)
            hex = 0xf59e0b;
            active = lineFault !== 'open';
            curveStage1ToCap.getPointAt(phase * 0.92, _pt);
          } else if (groupIdx === 1) {
            // 70V/100V AC Audio into Cap
            hex = 0xf43f5e;
            active = telemetry.audioPassingToDriver || viewMode === 'principle';
            curveStage1ToCap.getPointAt(phase, _pt);
          } else if (groupIdx === 2) {
            // AC Audio Cap -> Tap Selector
            hex = 0xf43f5e;
            active = (telemetry.audioPassingToDriver || viewMode === 'principle') && principleStage >= 2;
            curveCapToTap.getPointAt(phase, _pt);
          } else if (groupIdx === 3) {
            // Tap -> Line Matching Transformer
            hex = 0x8b5cf6;
            active = (telemetry.audioPassingToDriver || viewMode === 'principle') && principleStage >= 3;
            curveTapToTrafo.getPointAt(phase, _pt);
          } else {
            // Stepped-down Analog Current -> Voice Coil
            hex = 0x10b981;
            active = (telemetry.audioPassingToDriver || viewMode === 'principle') && principleStage >= 4;
            curveTrafoToCoil.getPointAt(phase, _pt);
          }

          if (active) {
            _dummy.position.copy(_pt);
            _dummy.scale.setScalar(0.85);
          } else {
            _dummy.position.set(0, -100, 0);
            _dummy.scale.setScalar(0.001);
          }
          _dummy.updateMatrix();
          particles.setMatrixAt(i, _dummy.matrix);
          particles.setColorAt(i, _color.setHex(hex));
        }
      } else {
        particles.visible = false;
      }

      particles.instanceMatrix.needsUpdate = true;
      if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
    },
  };
}

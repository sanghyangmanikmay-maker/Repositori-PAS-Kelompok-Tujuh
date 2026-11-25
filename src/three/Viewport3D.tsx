import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraPreset,
  ComponentId,
  SimulationState,
  SystemTelemetry,
  ViewMode,
} from '../sim/types';
import { createProceduralTextures, drawNcuLcd } from './textures';
import {
  buildCeilingSpeakerModel,
  buildGooseneckMicModel,
  buildNcuModel,
  ExplodablePart,
} from './models';
import {
  buildCurrentSensorMcuModel,
  buildSoundSensorMcuModel,
  buildTempSensorMcuModel,
} from './sensorModels';
import { buildTopologyAndSignalSystem } from './topology';
import { getAnatomyById } from '../data/anatomy';
import { PasDspAudioEngine } from '../audio/dspAudio';

interface Viewport3DProps {
  simState: SimulationState;
  telemetry: SystemTelemetry;
  audioEngine: PasDspAudioEngine;
  onSelectPart: (partId: string, component?: ComponentId) => void;
  onSignalSample?: (samples: Float32Array, rms: number) => void;
}

interface ProjectedPin {
  partId: string;
  label: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  selected: boolean;
}

const _projVec = new THREE.Vector3();
const _anchorVec = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function getCameraCoordinates(
  viewMode: ViewMode,
  activeComponent: ComponentId,
  preset: CameraPreset,
): { pos: [number, number, number]; look: [number, number, number] } {
  if (viewMode === 'topology' || viewMode === 'faultlab') {
    if (preset === 'front') return { pos: [-4.2, 2.8, 5.4], look: [-3.4, 1.0, 0.4] };
    if (preset === 'rear') return { pos: [-4.2, 3.2, -5.4], look: [-3.4, 1.0, 0.2] };
    if (preset === 'ceiling') return { pos: [3.2, 4.6, 5.2], look: [1.5, 1.8, 0.5] };
    if (preset === 'internal') return { pos: [-2.6, 2.4, 2.8], look: [-3.4, 1.1, 0.6] };
    return { pos: [-0.2, 6.4, 10.6], look: [-1.2, 1.0, 0.5] };
  }

  // Single-component inspection or Principle mode
  const comp: ComponentId = viewMode === 'principle' ? 'speaker' : activeComponent;
  if (comp === 'mic') {
    if (preset === 'rear') return { pos: [0.3, 1.5, -3.9], look: [0, 1.2, 0] };
    if (preset === 'internal') return { pos: [2.7, 1.7, 2.1], look: [0, 1.25, 0.1] };
    if (preset === 'front') return { pos: [0, 1.5, 3.9], look: [0, 1.2, 0.1] };
    return { pos: [3.2, 2.0, 3.8], look: [0, 1.25, 0.1] };
  }
  if (comp === 'ncu') {
    if (preset === 'front') return { pos: [0, 0.9, 4.1], look: [0, 0.45, 0] };
    if (preset === 'rear') return { pos: [0, 1.1, -4.1], look: [0, 0.45, 0] };
    if (preset === 'internal') return { pos: [0.4, 3.2, 2.2], look: [0, 0.35, 0] };
    return { pos: [2.9, 2.3, 3.8], look: [0, 0.45, 0] };
  }
  if (comp === 'sensor_sound' || comp === 'sensor_current' || comp === 'sensor_temp') {
    if (preset === 'front') return { pos: [0, 1.4, 3.7], look: [0, 0.25, 0] };
    if (preset === 'rear') return { pos: [0, 1.5, -3.7], look: [0, 0.25, 0] };
    if (preset === 'internal') return { pos: [0.0, 3.6, 1.4], look: [0, 0.2, 0] };
    if (preset === 'ceiling') return { pos: [2.8, 2.8, 2.2], look: [0, 0.2, 0] };
    return { pos: [2.4, 2.5, 3.2], look: [0, 0.25, 0] };
  }
  // Speaker
  if (preset === 'ceiling') return { pos: [3.4, -1.3, 3.4], look: [0, 0.5, 0] };
  if (preset === 'rear') return { pos: [-3.0, 2.4, -3.2], look: [0, 0.95, 0] };
  if (preset === 'internal') return { pos: [3.3, 1.5, 3.1], look: [0, 0.9, 0] };
  return { pos: [3.7, 1.9, 4.0], look: [0, 0.95, 0] };
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  simState,
  telemetry,
  audioEngine,
  onSelectPart,
  onSignalSample,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(simState);
  const telemetryRef = useRef(telemetry);
  const onSelectPartRef = useRef(onSelectPart);
  const onSignalSampleRef = useRef(onSignalSample);

  stateRef.current = simState;
  telemetryRef.current = telemetry;
  onSelectPartRef.current = onSelectPart;
  onSignalSampleRef.current = onSignalSample;

  const [pins, setPins] = useState<ProjectedPin[]>([]);
  const [zoneTags, setZoneTags] = useState<
    Array<{ id: 'A' | 'B' | 'C'; label: string; x: number; y: number }>
  >([]);
  const [webglError, setWebglError] = useState(false);

  // Trigger camera transition whenever viewMode, activeComponent, or cameraPreset changes
  const camTransitionRef = useRef<{ active: boolean; pos: [number, number, number]; look: [number, number, number] }>({
    active: true,
    pos: [-0.2, 6.4, 10.6],
    look: [-1.2, 1.0, 0.5],
  });

  useEffect(() => {
    const coords = getCameraCoordinates(
      simState.viewMode,
      simState.activeComponent,
      simState.cameraPreset,
    );
    camTransitionRef.current = { active: true, pos: coords.pos, look: coords.look };
  }, [simState.viewMode, simState.activeComponent, simState.cameraPreset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Software WebGL detection (SwiftShader / llvmpipe / headless Chromium)
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1118);
    scene.fog = new THREE.FogExp2(0x0b1118, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      44,
      (container.clientWidth || 800) / (container.clientHeight || 600),
      0.1,
      80,
    );
    camera.position.set(-0.2, 6.4, 10.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.6;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(-1.2, 1.0, 0.5);

    // Cancel scripted camera transition immediately when user interacts
    const onControlStart = () => {
      camTransitionRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // 3-Point Studio Lighting Rig (warm key, cool hemisphere fill, crisp rim)
    const hemiLight = new THREE.HemisphereLight(0xcbe4ff, 0x16202e, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.85);
    keyLight.position.set(6, 10, 7);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    rimLight.position.set(-7, 5, -6);
    scene.add(rimLight);

    // Procedural Textures
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = createProceduralTextures(maxAniso);

    // Studio Ground Plane & Radial Contact Shadow Disc
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 46),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.floorGrid,
        roughness: 0.85,
        metalness: 0.1,
      }),
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const contactShadowDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 4.8),
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      }),
    );
    contactShadowDisc.rotation.x = -Math.PI / 2;
    contactShadowDisc.position.y = 0.0;
    scene.add(contactShadowDisc);

    // Build Models & Topology
    const clickables: THREE.Object3D[] = [];
    const micRig = buildGooseneckMicModel(textures, clickables);
    const ncuRig = buildNcuModel(textures, clickables);
    const speakerRig = buildCeilingSpeakerModel(textures, clickables);
    const soundSensorRig = buildSoundSensorMcuModel(textures, clickables);
    const currentSensorRig = buildCurrentSensorMcuModel(textures, clickables);
    const tempSensorRig = buildTempSensorMcuModel(textures, clickables);
    const topologyRig = buildTopologyAndSignalSystem(clickables);

    const inspectStage = new THREE.Group();
    scene.add(inspectStage);
    scene.add(topologyRig.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on pointer click (ignore drag orbits)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, true);
      for (const hit of hits) {
        if (!hit.object.visible) continue;
        // Walk up hierarchy to find partId
        let cur: THREE.Object3D | null = hit.object;
        while (cur && !cur.userData.partId) {
          cur = cur.parent;
        }
        if (cur && cur.userData.partId) {
          const partId = String(cur.userData.partId);
          const partMeta = getAnatomyById(partId);
          onSelectPartRef.current(partId, partMeta?.component);
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation & Paced Loop State
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let dampedExplode = 0;
    let dampedGooseneck = 10;
    let lastLcdKey = '';
    let lastUiSync = 0;
    let lastPlacementKey = '';

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function applyExplode(list: ExplodablePart[], factor: number) {
      for (const item of list) {
        item.mesh.position.set(
          item.basePos.x + item.explodeOffset.x * factor,
          item.basePos.y + item.explodeOffset.y * factor,
          item.basePos.z + item.explodeOffset.z * factor,
        );
      }
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const rawDt = Math.min(0.25, Math.max(0.001, (now - lastTime) / 1000));
      const dt = Math.min(0.05, rawDt);
      const uiDt = isSoftwareGl ? rawDt : dt;
      lastTime = now;
      const timeSec = now / 1000;

      const s = stateRef.current;
      const tel = telemetryRef.current;

      // Sync NCU OLED CanvasTexture only when text/alarm changes
      const lcdKey = `${tel.lcdLine1}|${tel.lcdLine2}|${tel.alarmLedOn}|${tel.faultLedOn}`;
      if (lcdKey !== lastLcdKey) {
        lastLcdKey = lcdKey;
        drawNcuLcd(
          textures.ncuLcdCanvas,
          textures.ncuLcdTexture,
          tel.lcdLine1,
          tel.lcdLine2,
          tel.alarmLedOn,
          tel.faultLedOn,
        );
      }

      // Placement routing between Topology Mode vs Single-Component Inspect/Principle Mode
      const isTopology = s.viewMode === 'topology' || s.viewMode === 'faultlab';
      const targetComp: ComponentId =
        s.viewMode === 'principle' ? 'speaker' : s.activeComponent;
      const placementKey = `${isTopology ? 'topo' : targetComp}`;

      if (placementKey !== lastPlacementKey) {
        lastPlacementKey = placementKey;
        topologyRig.root.visible = isTopology;
        inspectStage.visible = !isTopology;
        contactShadowDisc.visible = !isTopology;

        if (isTopology) {
          topologyRig.micAnchor.add(micRig.root);
          topologyRig.ncuAnchor.add(ncuRig.root);
          topologyRig.speakerZoneBAnchor.add(speakerRig.root);
          micRig.root.visible = true;
          ncuRig.root.visible = true;
          speakerRig.root.visible = true;
          soundSensorRig.root.visible = false;
          currentSensorRig.root.visible = false;
          tempSensorRig.root.visible = false;
        } else {
          inspectStage.add(
            micRig.root,
            ncuRig.root,
            speakerRig.root,
            soundSensorRig.root,
            currentSensorRig.root,
            tempSensorRig.root,
          );
          micRig.root.visible = targetComp === 'mic';
          ncuRig.root.visible = targetComp === 'ncu';
          speakerRig.root.visible = targetComp === 'speaker';
          soundSensorRig.root.visible = targetComp === 'sensor_sound';
          currentSensorRig.root.visible = targetComp === 'sensor_current';
          tempSensorRig.root.visible = targetComp === 'sensor_temp';
        }
      }

      // Smooth damped Exploded View & Gooseneck articulation
      const targetExplode = isTopology
        ? 0
        : s.viewMode === 'principle'
          ? 0.52
          : s.cameraPreset === 'internal' && s.explodeFactor < 0.4
            ? 0.65
            : s.explodeFactor;

      dampedExplode = THREE.MathUtils.damp(dampedExplode, targetExplode, 10, uiDt);
      dampedGooseneck = THREE.MathUtils.damp(
        dampedGooseneck,
        s.mic.gooseneckAngleDeg,
        10,
        uiDt,
      );

      applyExplode(micRig.explodables, targetComp === 'mic' && !isTopology ? dampedExplode : 0);
      applyExplode(ncuRig.explodables, targetComp === 'ncu' && !isTopology ? dampedExplode : 0);
      applyExplode(
        speakerRig.explodables,
        targetComp === 'speaker' && !isTopology ? dampedExplode : 0,
      );
      applyExplode(
        soundSensorRig.explodables,
        targetComp === 'sensor_sound' && !isTopology ? dampedExplode : 0,
      );
      applyExplode(
        currentSensorRig.explodables,
        targetComp === 'sensor_current' && !isTopology ? dampedExplode : 0,
      );
      applyExplode(
        tempSensorRig.explodables,
        targetComp === 'sensor_temp' && !isTopology ? dampedExplode : 0,
      );

      // Sample audio waveform & update animations
      const audioSample = audioEngine.sampleSignal(
        timeSec,
        tel.priorityState,
        s.speaker.wattageTap,
      );

      const pttEngaged = s.mic.pttActive || s.mic.pttLatched;
      micRig.updatePose(
        dampedGooseneck,
        targetComp === 'mic' && !isTopology ? dampedExplode : 0,
        pttEngaged,
        pttEngaged ? audioSample.rms : 0,
        s.mic.windTestActive,
        s.mic.windshieldInstalled,
        timeSec,
      );

      ncuRig.updateState({
        explode: targetComp === 'ncu' && !isTopology ? dampedExplode : 0,
        signalRms: tel.signalLedOn ? Math.max(0.25, audioSample.rms) : 0,
        faultLed: tel.faultLedOn,
        alarmLed: tel.alarmLedOn,
        netLed: tel.networkLedOn,
        fanBlocked: s.faults.coolingFanBlocked,
        tempStatus: tel.tempSensor.status,
        currentStatus: tel.currentSensor.status,
        dt,
      });

      speakerRig.updateState({
        explode: targetComp === 'speaker' && !isTopology ? dampedExplode : 0,
        grilleTransparent:
          s.speaker.grilleTransparent ||
          s.viewMode === 'principle' ||
          s.cameraPreset === 'internal',
        wattageTap: s.speaker.wattageTap,
        audioPassing: tel.audioPassingToDriver,
        signalRms: audioSample.rms,
        timeSec,
      });

      soundSensorRig.updateState({
        explode: targetComp === 'sensor_sound' && !isTopology ? dampedExplode : 0,
        status: tel.soundSensor.status,
        activityLevel: Math.min(1, Math.max(0.1, (tel.soundSensor.measuredSplDb - 40) / 60)),
        timeSec,
      });

      currentSensorRig.updateState({
        explode: targetComp === 'sensor_current' && !isTopology ? dampedExplode : 0,
        status: tel.currentSensor.status,
        activityLevel: Math.min(1, Math.max(0.15, tel.currentSensor.acLoadCurrentMa / 60)),
        timeSec,
      });

      tempSensorRig.updateState({
        explode: targetComp === 'sensor_temp' && !isTopology ? dampedExplode : 0,
        status: tel.tempSensor.status,
        activityLevel: Math.min(1, Math.max(0.15, (tel.tempSensor.measuredTempC - 20) / 65)),
        timeSec,
      });

      topologyRig.updateParticles({
        viewMode: s.viewMode,
        activeComponent:
          targetComp === 'mic' || targetComp === 'ncu' || targetComp === 'speaker'
            ? targetComp
            : 'ncu',
        principleStage: s.principleStage,
        telemetry: tel,
        pttActive: pttEngaged,
        timeSec,
        lineFault: s.faults.speakerLineFault,
        ethCut: s.faults.primaryEthernetCut,
      });

      // Smooth Camera Preset Transition
      if (camTransitionRef.current.active) {
        _targetCamPos.set(...camTransitionRef.current.pos);
        _targetLookAt.set(...camTransitionRef.current.look);
        const lerpAlpha = 1 - Math.exp(-8.5 * uiDt);
        camera.position.lerp(_targetCamPos, lerpAlpha);
        controls.target.lerp(_targetLookAt, lerpAlpha);
        if (
          camera.position.distanceTo(_targetCamPos) < 0.03 &&
          controls.target.distanceTo(_targetLookAt) < 0.03
        ) {
          camTransitionRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Throttled HUD callback (~12 Hz) for oscilloscope & projected 3D callout labels
      if (now - lastUiSync > 80) {
        lastUiSync = now;
        onSignalSampleRef.current?.(audioSample.samples, audioSample.rms);

        if (isTopology) {
          setPins((prev) => (prev.length > 0 ? [] : prev));
          const el = containerRef.current;
          const w = el?.clientWidth || 800;
          const h = el?.clientHeight || 600;
          const zoneAnchors: Array<{ id: 'A' | 'B' | 'C'; pos: [number, number, number]; label: string }> = [
            {
              id: 'A',
              pos: [-4.2, 0.25, 3.05],
              label: s.language === 'id' ? 'Zona A · Ruang Kontrol ATC' : 'Zone A · ATC Control',
            },
            {
              id: 'B',
              pos: [1.6, 0.25, -3.15],
              label: s.language === 'id' ? 'Zona B · Ruang Informasi' : 'Zone B · Info Room',
            },
            {
              id: 'C',
              pos: [1.6, 0.25, 4.05],
              label: s.language === 'id' ? 'Zona C · Terminal Hall' : 'Zone C · Terminal Hall',
            },
          ];
          const nextTags: Array<{ id: 'A' | 'B' | 'C'; label: string; x: number; y: number }> = [];
          zoneAnchors.forEach((za) => {
            _projVec.set(...za.pos).project(camera);
            if (_projVec.z > 1) return;
            const x = ((_projVec.x + 1) / 2) * w;
            const y = ((-_projVec.y + 1) / 2) * h;
            if (x > 40 && x < w - 40 && y > 60 && y < h - 30) {
              nextTags.push({ id: za.id, label: za.label, x, y });
            }
          });
          setZoneTags(nextTags);
        } else if (dampedExplode > 0.18) {
          setZoneTags((prev) => (prev.length > 0 ? [] : prev));
          const activeList =
            targetComp === 'mic'
              ? micRig.explodables
              : targetComp === 'ncu'
                ? ncuRig.explodables
                : targetComp === 'speaker'
                  ? speakerRig.explodables
                  : targetComp === 'sensor_sound'
                    ? soundSensorRig.explodables
                    : targetComp === 'sensor_current'
                      ? currentSensorRig.explodables
                      : tempSensorRig.explodables;
          const el = containerRef.current;
          const w = el?.clientWidth || 800;
          const h = el?.clientHeight || 600;
          const nextPins: ProjectedPin[] = [];

          activeList.forEach((item) => {
            const meta = getAnatomyById(item.partId);
            if (!meta) return;
            item.mesh.getWorldPosition(_anchorVec);
            _projVec.copy(_anchorVec).project(camera);
            if (_projVec.z > 1) return;
            const ax = ((_projVec.x + 1) / 2) * w;
            const ay = ((-_projVec.y + 1) / 2) * h;
            if (ax < 30 || ax > w - 30 || ay < 65 || ay > h - 90) return;

            const isRightSide = ax >= w * 0.48;
            const labelX = isRightSide
              ? Math.min(w - 220, ax + 55)
              : Math.max(16, ax - 210);
            const shortName = meta.name[s.language].split('(')[0].trim();

            nextPins.push({
              partId: item.partId,
              label: shortName.length > 28 ? `${shortName.slice(0, 26)}…` : shortName,
              x: labelX,
              y: Math.max(82, Math.min(h - 135, ay - 10)),
              anchorX: ax,
              anchorY: ay,
              selected: s.selectedPartId === item.partId,
            });
          });

          // Vertical de-overlap pass per column (left vs right)
          const resolveColumn = (col: ProjectedPin[]) => {
            col.sort((a, b) => a.y - b.y);
            const minGap = 26;
            for (let i = 1; i < col.length; i++) {
              if (col[i].y - col[i - 1].y < minGap) {
                col[i].y = col[i - 1].y + minGap;
              }
            }
          };
          const leftPins = nextPins.filter((p) => p.x < w * 0.48);
          const rightPins = nextPins.filter((p) => p.x >= w * 0.48);
          resolveColumn(leftPins);
          resolveColumn(rightPins);
          setPins([...leftPins, ...rightPins]);
        } else {
          setZoneTags((prev) => (prev.length > 0 ? [] : prev));
          setPins((prev) => (prev.length > 0 ? [] : prev));
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      textures.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [audioEngine]);

  return (
    <div className="relative w-full h-full bg-[#0B1118] overflow-hidden select-none">
      {/* Isolated WebGL mount container */}
      <div
        ref={containerRef}
        data-testid="three-canvas-container"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Exploded View Guide Lines & Callout Labels (DOM overlay, zero blocking) */}
      {pins.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
          aria-hidden="true"
        >
          {pins.map((pin) => (
            <g key={pin.partId}>
              <line
                x1={pin.anchorX}
                y1={pin.anchorY}
                x2={pin.x}
                y2={pin.y}
                stroke={pin.selected ? '#38BDF8' : 'rgba(148, 163, 184, 0.55)'}
                strokeWidth={pin.selected ? 1.5 : 1}
              />
              <circle
                cx={pin.anchorX}
                cy={pin.anchorY}
                r={3}
                fill={pin.selected ? '#38BDF8' : '#CBD5E1'}
              />
            </g>
          ))}
        </svg>
      )}

      {pins.map((pin) => (
        <button
          key={pin.partId}
          type="button"
          onClick={() => onSelectPart(pin.partId)}
          style={{
            transform: `translate(${pin.x}px, ${pin.y - 11}px)`,
          }}
          className={`absolute top-0 left-0 z-10 px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap ${
            pin.selected
              ? 'bg-sky-500/95 text-slate-950 border-sky-300'
              : 'bg-[#111924]/92 text-slate-200 border-slate-700 hover:border-sky-400'
          }`}
        >
          {pin.label}
        </button>
      ))}

      {/* Subtle Zone Labels in Topology Mode */}
      {zoneTags.map((zt) => (
        <div
          key={zt.id}
          style={{
            transform: `translate(${zt.x - 65}px, ${zt.y - 12}px)`,
          }}
          className="pointer-events-none absolute top-0 left-0 z-10 px-2 py-0.5 text-[10px] font-mono-tabular font-semibold tracking-tight rounded bg-[#0E151F]/88 border border-slate-700/80 text-slate-200 whitespace-nowrap"
        >
          {zt.label}
        </div>
      ))}

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1118] text-slate-200 p-6">
          <div className="max-w-md border border-slate-700 bg-[#111924] rounded-lg p-5">
            <h2 className="text-base font-semibold text-slate-100">
              3D WebGL Viewport Unavailable
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Please enable hardware acceleration or use a WebGL2-compatible browser to view the interactive 3D Digital Twin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

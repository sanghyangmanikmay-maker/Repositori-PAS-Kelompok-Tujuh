import * as THREE from 'three';

export interface ProceduralTextures {
  brushedMetalBump: THREE.CanvasTexture;
  foamTexture: THREE.CanvasTexture;
  grilleTexture: THREE.CanvasTexture;
  grilleAlpha: THREE.CanvasTexture;
  pcbTexture: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  floorGrid: THREE.CanvasTexture;
  ncuLcdCanvas: HTMLCanvasElement;
  ncuLcdTexture: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  // 1. Brushed Anodized Aluminum Bump Map (linear space)
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mctx = metalCanvas.getContext('2d')!;
  mctx.fillStyle = '#808080';
  mctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const shade = 112 + Math.floor(Math.random() * 32);
    mctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    mctx.fillRect(0, y, 256, 1);
  }
  const brushedMetalBump = new THREE.CanvasTexture(metalCanvas);
  brushedMetalBump.wrapS = THREE.RepeatWrapping;
  brushedMetalBump.wrapT = THREE.RepeatWrapping;
  brushedMetalBump.anisotropy = maxAnisotropy;

  // 2. Porous Acoustic Foam Texture (SRGB)
  const foamCanvas = document.createElement('canvas');
  foamCanvas.width = 256;
  foamCanvas.height = 256;
  const fctx = foamCanvas.getContext('2d')!;
  fctx.fillStyle = '#1d2229';
  fctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 0.8 + Math.random() * 1.4;
    fctx.fillStyle = i % 2 === 0 ? '#0d1015' : '#2d3542';
    fctx.beginPath();
    fctx.arc(x, y, r, 0, Math.PI * 2);
    fctx.fill();
  }
  const foamTexture = new THREE.CanvasTexture(foamCanvas);
  foamTexture.colorSpace = THREE.SRGBColorSpace;
  foamTexture.wrapS = THREE.RepeatWrapping;
  foamTexture.wrapT = THREE.RepeatWrapping;
  foamTexture.anisotropy = maxAnisotropy;

  // 3. Micro-Perforated Speaker Grille Albedo & Alpha
  const grilleCanvas = document.createElement('canvas');
  grilleCanvas.width = 512;
  grilleCanvas.height = 512;
  const gctx = grilleCanvas.getContext('2d')!;
  gctx.fillStyle = '#dce2ea';
  gctx.fillRect(0, 0, 512, 512);

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = 512;
  alphaCanvas.height = 512;
  const actx = alphaCanvas.getContext('2d')!;
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, 512, 512);

  const step = 18;
  for (let y = 16; y < 496; y += step) {
    const rowOffset = (Math.floor(y / step) % 2) * (step / 2);
    for (let x = 16 + rowOffset; x < 496; x += step) {
      const dx = x - 256;
      const dy = y - 256;
      if (dx * dx + dy * dy < 220 * 220) {
        gctx.fillStyle = '#1f2937';
        gctx.beginPath();
        gctx.arc(x, y, 4.8, 0, Math.PI * 2);
        gctx.fill();

        actx.fillStyle = '#000000';
        actx.beginPath();
        actx.arc(x, y, 4.6, 0, Math.PI * 2);
        actx.fill();
      }
    }
  }
  const grilleTexture = new THREE.CanvasTexture(grilleCanvas);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.anisotropy = maxAnisotropy;

  const grilleAlpha = new THREE.CanvasTexture(alphaCanvas);
  grilleAlpha.anisotropy = maxAnisotropy;

  // 4. Internal PCB Silkscreen & Copper Traces (SRGB)
  const pcbCanvas = document.createElement('canvas');
  pcbCanvas.width = 512;
  pcbCanvas.height = 512;
  const pctx = pcbCanvas.getContext('2d')!;
  pctx.fillStyle = '#0a4a3a';
  pctx.fillRect(0, 0, 512, 512);
  pctx.strokeStyle = '#187c60';
  pctx.lineWidth = 2;
  for (let i = 16; i < 512; i += 24) {
    pctx.beginPath();
    pctx.moveTo(0, i);
    pctx.lineTo(180, i);
    pctx.lineTo(220, i + 16);
    pctx.lineTo(512, i + 16);
    pctx.stroke();
  }
  pctx.fillStyle = '#d4af37';
  for (let x = 32; x < 480; x += 48) {
    for (let y = 32; y < 480; y += 64) {
      pctx.beginPath();
      pctx.arc(x, y, 3, 0, Math.PI * 2);
      pctx.fill();
    }
  }
  const pcbTexture = new THREE.CanvasTexture(pcbCanvas);
  pcbTexture.colorSpace = THREE.SRGBColorSpace;
  pcbTexture.anisotropy = maxAnisotropy;

  // 5. Soft Radial Contact Shadow Disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(128, 128, 12, 128, 128, 126);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 256);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  // 6. Architectural Engineering Floor Grid (SRGB)
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = 512;
  gridCanvas.height = 512;
  const grctx = gridCanvas.getContext('2d')!;
  grctx.fillStyle = '#0e1621';
  grctx.fillRect(0, 0, 512, 512);
  grctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  grctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    grctx.beginPath();
    grctx.moveTo(i, 0);
    grctx.lineTo(i, 512);
    grctx.stroke();
    grctx.beginPath();
    grctx.moveTo(0, i);
    grctx.lineTo(512, i);
    grctx.stroke();
  }
  grctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
  grctx.lineWidth = 2;
  grctx.strokeRect(0, 0, 512, 512);
  const floorGrid = new THREE.CanvasTexture(gridCanvas);
  floorGrid.colorSpace = THREE.SRGBColorSpace;
  floorGrid.wrapS = THREE.RepeatWrapping;
  floorGrid.wrapT = THREE.RepeatWrapping;
  floorGrid.repeat.set(10, 10);
  floorGrid.anisotropy = maxAnisotropy;

  // 7. Dynamic NCU Front Panel OLED Texture
  const ncuLcdCanvas = document.createElement('canvas');
  ncuLcdCanvas.width = 512;
  ncuLcdCanvas.height = 160;
  const ncuLcdTexture = new THREE.CanvasTexture(ncuLcdCanvas);
  ncuLcdTexture.colorSpace = THREE.SRGBColorSpace;
  ncuLcdTexture.anisotropy = maxAnisotropy;

  return {
    brushedMetalBump,
    foamTexture,
    grilleTexture,
    grilleAlpha,
    pcbTexture,
    contactShadow,
    floorGrid,
    ncuLcdCanvas,
    ncuLcdTexture,
    dispose: () => {
      brushedMetalBump.dispose();
      foamTexture.dispose();
      grilleTexture.dispose();
      grilleAlpha.dispose();
      pcbTexture.dispose();
      contactShadow.dispose();
      floorGrid.dispose();
      ncuLcdTexture.dispose();
    },
  };
}

export function drawNcuLcd(
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture,
  line1: string,
  line2: string,
  isAlarm: boolean,
  isFault: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = isAlarm ? '#2b090d' : isFault ? '#261807' : '#051c2c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isAlarm ? '#f43f5e' : isFault ? '#f59e0b' : '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = isAlarm ? '#fda4af' : isFault ? '#fcd34d' : '#7dd3fc';
  ctx.font = 'bold 34px "IBM Plex Mono", monospace';
  ctx.fillText(line1, 24, 62);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 24px "IBM Plex Mono", monospace';
  ctx.fillText(line2, 24, 118);

  texture.needsUpdate = true;
}

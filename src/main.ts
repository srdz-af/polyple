
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MAX_N, AXIS_PALETTE, VIEW_MODES, type ViewMode } from './constants';
import { RotND, type Plane } from './RotND';
import { pcaTopK } from './PCA';
import { NDProjector, canonicalP } from './geometry/NDProjector';
import { buildPrimitive, type PrimitiveKind } from './geometry/primitives';
import { parseGeometryJson, serializeGeometryJson } from './io/geometryJson';
import { HypercubeRenderer, type SurfaceMaterial } from './rendering/HypercubeRenderer';

type ProjMode = 'Canonical' | 'PCA';
type PrimitiveMode = PrimitiveKind;

const app = document.getElementById('app')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
const tooltipEl = document.getElementById('tooltip') as HTMLDivElement | null;
const ctxMenu = document.getElementById('context-menu') as HTMLDivElement | null;
const viewToggle = document.getElementById('view-toggle') as HTMLDivElement | null;
const axisGizmoEl = document.getElementById('axis-gizmo') as HTMLDivElement | null;
const wAxisGizmoEl = document.getElementById('w-axis-gizmo') as HTMLDivElement | null;
const wAxisGizmoLineEl = document.getElementById('w-axis-gizmo-line') as SVGLineElement | null;
const wAxisGizmoNegEl = document.getElementById('w-axis-gizmo-neg') as HTMLButtonElement | null;
const wAxisGizmoPosEl = document.getElementById('w-axis-gizmo-pos') as HTMLButtonElement | null;
const wAxisGizmoLabelEl = document.getElementById('w-axis-gizmo-label') as HTMLSpanElement | null;
const autoRotateToggle = document.getElementById('auto-rotate-toggle') as HTMLButtonElement | null;
const helpToggleButton = document.getElementById('help-toggle') as HTMLButtonElement | null;
const helpOverlay = document.getElementById('help-overlay') as HTMLDivElement | null;
const helpCloseButton = document.getElementById('help-close') as HTMLButtonElement | null;
const mobileOnboardingOpenButton = document.getElementById('mobile-onboarding-open') as HTMLButtonElement | null;
const mobileOnboardingOverlay = document.getElementById('mobile-onboarding-overlay') as HTMLDivElement | null;
const mobileOnboardingTrack = document.getElementById('mobile-onboarding-track') as HTMLDivElement | null;
const mobileOnboardingCloseButton = document.getElementById('mobile-onboarding-close') as HTMLButtonElement | null;
const mobileOnboardingSkipButton = document.getElementById('mobile-onboarding-skip') as HTMLButtonElement | null;
const mobileOnboardingPrevButton = document.getElementById('mobile-onboarding-prev') as HTMLButtonElement | null;
const mobileOnboardingNextButton = document.getElementById('mobile-onboarding-next') as HTMLButtonElement | null;
const mobileOnboardingFinishButton = document.getElementById('mobile-onboarding-finish') as HTMLButtonElement | null;
const mobileOnboardingProgressButtons = Array.from(document.querySelectorAll('#mobile-onboarding-progress button[data-step]')) as HTMLButtonElement[];
const mobileOnboardingSteps = Array.from(document.querySelectorAll('#mobile-onboarding-track .mobile-onboarding-step')) as HTMLElement[];
const importJsonButton = document.getElementById('import-json-button') as HTMLButtonElement | null;
const exportJsonButton = document.getElementById('export-json-button') as HTMLButtonElement | null;
const editModeToggle = document.getElementById('edit-mode-toggle') as HTMLButtonElement | null;
const transformMoveButton = document.getElementById('transform-move-button') as HTMLButtonElement | null;
const transformRotateButton = document.getElementById('transform-rotate-button') as HTMLButtonElement | null;
const transformScaleButton = document.getElementById('transform-scale-button') as HTMLButtonElement | null;
const dimensionControl = document.getElementById('dimension-control') as HTMLDivElement | null;
const dimensionValue = document.getElementById('dimension-value') as HTMLOutputElement | null;
const dimensionDownButton = document.getElementById('dimension-down') as HTMLButtonElement | null;
const dimensionUpButton = document.getElementById('dimension-up') as HTMLButtonElement | null;
const texturePanel = document.getElementById('texture-panel') as HTMLDivElement | null;
const texturePreviewCanvas = document.getElementById('texture-preview') as HTMLCanvasElement | null;
const textureBaseColorInput = document.getElementById('texture-base-color') as HTMLInputElement | null;
const textureBaseColorValue = document.getElementById('texture-base-color-value') as HTMLOutputElement | null;
const textureMetallicInput = document.getElementById('texture-metallic') as HTMLInputElement | null;
const textureMetallicValue = document.getElementById('texture-metallic-value') as HTMLOutputElement | null;
const textureRoughnessInput = document.getElementById('texture-roughness') as HTMLInputElement | null;
const textureRoughnessValue = document.getElementById('texture-roughness-value') as HTMLOutputElement | null;
const textureAlphaInput = document.getElementById('texture-alpha') as HTMLInputElement | null;
const textureAlphaValue = document.getElementById('texture-alpha-value') as HTMLOutputElement | null;
const getPaneToggleButton = () => document.getElementById('pane-toggle') as HTMLButtonElement | null;
const MOBILE_ONBOARDING_SEEN_KEY = 'blend.mobileOnboardingSeen.v1';
const MOBILE_ONBOARDING_BREAKPOINT = 920;
let helpLastFocusedEl: HTMLElement | null = null;
let mobileOnboardingLastFocusedEl: HTMLElement | null = null;
let mobileOnboardingStep = 0;

const isHelpOverlayOpen = () => helpOverlay?.classList.contains('open') ?? false;
const isMobileOnboardingOpen = () => mobileOnboardingOverlay?.classList.contains('open') ?? false;
const isModalUIOpen = () => isHelpOverlayOpen() || isMobileOnboardingOpen();

function setHelpOverlayOpen(open: boolean) {
  if (!helpOverlay) return;
  if (open && isMobileOnboardingOpen()) {
    setMobileOnboardingOpen(false);
  }
  helpOverlay.classList.toggle('open', open);
  helpOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) {
    helpLastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    helpCloseButton?.focus();
    return;
  }
  if (helpLastFocusedEl && document.contains(helpLastFocusedEl)) {
    helpLastFocusedEl.focus();
  }
}

function isMobileOnboardingViewport() {
  return window.innerWidth <= MOBILE_ONBOARDING_BREAKPOINT || window.matchMedia('(pointer: coarse)').matches;
}

function hasSeenMobileOnboarding() {
  try {
    return window.localStorage.getItem(MOBILE_ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markMobileOnboardingSeen() {
  try {
    window.localStorage.setItem(MOBILE_ONBOARDING_SEEN_KEY, '1');
  } catch {
    // Storage may be unavailable in private sessions.
  }
}

function setMobileOnboardingStep(step: number) {
  if (!mobileOnboardingTrack || mobileOnboardingSteps.length === 0) return;
  const maxStep = mobileOnboardingSteps.length - 1;
  mobileOnboardingStep = Math.max(0, Math.min(maxStep, step));
  mobileOnboardingTrack.style.transform = `translateX(${-mobileOnboardingStep * 100}%)`;

  mobileOnboardingSteps.forEach((stepEl, idx) => {
    stepEl.setAttribute('aria-hidden', idx === mobileOnboardingStep ? 'false' : 'true');
  });

  mobileOnboardingProgressButtons.forEach((button, idx) => {
    const active = idx === mobileOnboardingStep;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'step' : 'false');
  });

  const isLastStep = mobileOnboardingStep >= maxStep;
  if (mobileOnboardingPrevButton) mobileOnboardingPrevButton.disabled = mobileOnboardingStep === 0;
  if (mobileOnboardingNextButton) mobileOnboardingNextButton.style.display = isLastStep ? 'none' : 'inline-block';
  if (mobileOnboardingFinishButton) mobileOnboardingFinishButton.classList.toggle('visible', isLastStep);
}

function setMobileOnboardingOpen(open: boolean) {
  if (!mobileOnboardingOverlay) return;
  if (open && isHelpOverlayOpen()) {
    setHelpOverlayOpen(false);
  }
  mobileOnboardingOverlay.classList.toggle('open', open);
  mobileOnboardingOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) {
    mobileOnboardingLastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMobileOnboardingStep(mobileOnboardingStep);
    mobileOnboardingCloseButton?.focus();
    return;
  }
  if (mobileOnboardingLastFocusedEl && document.contains(mobileOnboardingLastFocusedEl)) {
    mobileOnboardingLastFocusedEl.focus();
  }
}

function closeMobileOnboarding(markSeen = true) {
  if (!isMobileOnboardingOpen()) return;
  if (markSeen) markMobileOnboardingSeen();
  setMobileOnboardingOpen(false);
}

function openMobileOnboarding(step = 0) {
  setMobileOnboardingStep(step);
  setMobileOnboardingOpen(true);
}

function maybeOpenMobileOnboarding() {
  if (!mobileOnboardingOverlay || mobileOnboardingSteps.length === 0) return;
  if (!isMobileOnboardingViewport()) return;
  if (hasSeenMobileOnboarding()) return;
  openMobileOnboarding(0);
}

// --- Three.js setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.useLegacyLights = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const baseBackground = new THREE.Color(0x10141a);
const editBackground = new THREE.Color(0x141414);
scene.background = baseBackground.clone();
renderer.setClearColor(scene.background);
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
scene.environment = environmentMap;

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const worldUp = new THREE.Vector3(0, 1, 0);

type AxisGizmoPart = {
  slot: 0 | 1 | 2;
  vector: THREE.Vector3;
  button: HTMLButtonElement;
  line: SVGLineElement;
};
const axisGizmoParts: AxisGizmoPart[] = [];
const GIZMO_VIEWBOX_SIZE = 86;
const axisGizmoCenter = GIZMO_VIEWBOX_SIZE * 0.5;
const axisGizmoRadius = 28;
const wGizmoCenter = GIZMO_VIEWBOX_SIZE * 0.5;
const wGizmoRadius = 28;
let wGizmoAngle = -Math.PI / 4;
const axisGizmoDrag = {
  active: false,
  moved: false,
  pointerId: -1,
  lastX: 0,
  lastY: 0,
  snapVector: null as THREE.Vector3 | null,
};
const wAxisGizmoDrag = {
  active: false,
  moved: false,
  pointerId: -1,
  lastAngle: 0,
  planeAxis: -1,
  depthAxis: -1,
};
const sceneBackgroundHsl = { h: 0, s: 0, l: 0 };
const sceneBackgroundColor = new THREE.Color();
const backgroundBlueHue = 0.61;

function normalizeSignedAngleDelta(value: number) {
  let delta = value;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function applySceneBackground(useEditMode: boolean) {
  const source = useEditMode ? editBackground : baseBackground;
  source.getHSL(sceneBackgroundHsl);
  const saturationFloor = useEditMode ? 0.02 : 0.03;
  const saturationScale = useEditMode ? 0.22 : 0.26;
  const saturation = Math.max(sceneBackgroundHsl.s * saturationScale, saturationFloor);
  sceneBackgroundColor.setHSL(backgroundBlueHue, saturation, sceneBackgroundHsl.l);
  scene.background = sceneBackgroundColor;
  renderer.setClearColor(sceneBackgroundColor);
}

function pointerAngleInWGizmo(ev: PointerEvent) {
  if (!wAxisGizmoEl) return null;
  const rect = wAxisGizmoEl.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const dx = ev.clientX - cx;
  const dy = ev.clientY - cy;
  if ((dx * dx) + (dy * dy) < 16) return null;
  return Math.atan2(dy, dx);
}

function currentWGizmoRotationPlane() {
  const nVis = visibleDims();
  if (nVis < 4) return null;
  const wDim = axesOrder[(axesOffset + 3) % nVis];
  if (wDim == null) return null;
  const planeAxis = wRotationPlaneAxis(-1, wDim);
  if (planeAxis < 0 || planeAxis === wDim) return null;
  return { planeAxis, wDim };
}

function beginWGizmoDrag(ev: PointerEvent) {
  if (!wAxisGizmoEl || wAxisGizmoEl.classList.contains('disabled')) return;
  const angle = pointerAngleInWGizmo(ev);
  const plane = currentWGizmoRotationPlane();
  if (angle == null || !plane) return;

  wAxisGizmoDrag.active = true;
  wAxisGizmoDrag.moved = false;
  wAxisGizmoDrag.pointerId = ev.pointerId;
  wAxisGizmoDrag.lastAngle = angle;
  wAxisGizmoDrag.planeAxis = plane.planeAxis;
  wAxisGizmoDrag.depthAxis = plane.wDim;
  try {
    wAxisGizmoEl.setPointerCapture(ev.pointerId);
  } catch {
    // Some browsers are strict about capture when pointerdown starts on a child.
  }
  wAxisGizmoEl.classList.add('dragging');
}

function endWGizmoDrag(ev: PointerEvent) {
  if (!wAxisGizmoEl) return;
  if (ev.pointerId !== wAxisGizmoDrag.pointerId) return;
  wAxisGizmoDrag.active = false;
  wAxisGizmoDrag.moved = false;
  wAxisGizmoDrag.pointerId = -1;
  wAxisGizmoDrag.lastAngle = 0;
  wAxisGizmoDrag.planeAxis = -1;
  wAxisGizmoDrag.depthAxis = -1;
  if (wAxisGizmoEl.hasPointerCapture(ev.pointerId)) {
    wAxisGizmoEl.releasePointerCapture(ev.pointerId);
  }
  wAxisGizmoEl.classList.remove('dragging');
}

function snapCameraToAxis(axis: THREE.Vector3) {
  const target = controls.target.clone();
  const distance = Math.max(camera.position.distanceTo(target), 0.8);
  const direction = axis.clone().normalize();

  camera.up.copy(worldUp);
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  controls.update();
  updateAxisGizmo();
}

function initAxisGizmo() {
  if (!axisGizmoEl) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  axisGizmoEl.appendChild(svg);

  const axesConfig: { slot: 0 | 1 | 2; vector: THREE.Vector3 }[] = [
    { slot: 0, vector: new THREE.Vector3(1, 0, 0) },
    { slot: 1, vector: new THREE.Vector3(0, 1, 0) },
    { slot: 2, vector: new THREE.Vector3(0, 0, 1) },
  ];

  for (const axis of axesConfig) {
    for (const sign of [1, -1]) {
      const vector = axis.vector.clone().multiplyScalar(sign);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svg.appendChild(line);

      const button = document.createElement('button');
      button.type = 'button';
      button.classList.toggle('negative', sign < 0);
      button.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        beginAxisGizmoDrag(ev, vector);
      });
      button.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (!axisGizmoDrag.moved) snapCameraToAxis(vector);
      });
      axisGizmoEl.appendChild(button);
      axisGizmoParts.push({ slot: axis.slot, vector, button, line });
    }
  }

  axisGizmoEl.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    beginAxisGizmoDrag(ev);
  });

  axisGizmoEl.addEventListener('pointermove', ev => {
    if (!axisGizmoDrag.active || ev.pointerId !== axisGizmoDrag.pointerId) return;
    ev.preventDefault();

    const dx = ev.clientX - axisGizmoDrag.lastX;
    const dy = ev.clientY - axisGizmoDrag.lastY;
    axisGizmoDrag.lastX = ev.clientX;
    axisGizmoDrag.lastY = ev.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) axisGizmoDrag.moved = true;

    orbitCameraFromGizmo(dx, dy);
  });

  axisGizmoEl.addEventListener('pointerup', ev => {
    if (ev.pointerId !== axisGizmoDrag.pointerId) return;
    if (!axisGizmoDrag.moved && axisGizmoDrag.snapVector) {
      snapCameraToAxis(axisGizmoDrag.snapVector);
    }
    axisGizmoDrag.active = false;
    axisGizmoDrag.pointerId = -1;
    axisGizmoDrag.snapVector = null;
    if (axisGizmoEl.hasPointerCapture(ev.pointerId)) {
      axisGizmoEl.releasePointerCapture(ev.pointerId);
    }
    axisGizmoEl.classList.remove('dragging');
  });

  axisGizmoEl.addEventListener('pointercancel', ev => {
    if (ev.pointerId !== axisGizmoDrag.pointerId) return;
    axisGizmoDrag.active = false;
    axisGizmoDrag.pointerId = -1;
    axisGizmoDrag.snapVector = null;
    if (axisGizmoEl.hasPointerCapture(ev.pointerId)) {
      axisGizmoEl.releasePointerCapture(ev.pointerId);
    }
    axisGizmoEl.classList.remove('dragging');
  });

  const onWGizmoPointerDown = (ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    beginWGizmoDrag(ev);
  };
  wAxisGizmoEl?.addEventListener('pointerdown', onWGizmoPointerDown);
  wAxisGizmoNegEl?.addEventListener('pointerdown', onWGizmoPointerDown);
  wAxisGizmoPosEl?.addEventListener('pointerdown', onWGizmoPointerDown);
  wAxisGizmoEl?.addEventListener('pointermove', ev => {
    if (!wAxisGizmoDrag.active || ev.pointerId !== wAxisGizmoDrag.pointerId) return;
    ev.preventDefault();
    const angle = pointerAngleInWGizmo(ev);
    if (angle == null) return;
    const delta = normalizeSignedAngleDelta(angle - wAxisGizmoDrag.lastAngle);
    wAxisGizmoDrag.lastAngle = angle;
    if (Math.abs(delta) < 1e-4) return;
    wAxisGizmoDrag.moved = true;
    if (wAxisGizmoDrag.planeAxis >= 0 && wAxisGizmoDrag.depthAxis >= 0 && wAxisGizmoDrag.planeAxis !== wAxisGizmoDrag.depthAxis) {
      rot.applyGivensLeft(wAxisGizmoDrag.planeAxis, wAxisGizmoDrag.depthAxis, delta);
      projectionDirty = true;
      wGizmoAngle = normalizeSignedAngleDelta(wGizmoAngle + delta);
      applySceneBackground(PARAMS.editMode);
    }
  });
  wAxisGizmoEl?.addEventListener('pointerup', endWGizmoDrag);
  wAxisGizmoEl?.addEventListener('pointercancel', endWGizmoDrag);

  updateAxisGizmo();
}

function beginAxisGizmoDrag(ev: PointerEvent, snapVector?: THREE.Vector3) {
  if (!axisGizmoEl) return;

  axisGizmoDrag.active = true;
  axisGizmoDrag.moved = false;
  axisGizmoDrag.pointerId = ev.pointerId;
  axisGizmoDrag.lastX = ev.clientX;
  axisGizmoDrag.lastY = ev.clientY;
  axisGizmoDrag.snapVector = snapVector?.clone() ?? null;
  try {
    axisGizmoEl.setPointerCapture(ev.pointerId);
  } catch {
    // Some browsers are strict about capture when pointerdown starts on a child.
  }
  axisGizmoEl.classList.add('dragging');
}

function orbitCameraFromGizmo(dx: number, dy: number) {
  camera.up.copy(worldUp);
  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  const rotateSpeed = 0.008;
  const minPolar = 0.01;
  const maxPolar = Math.PI - 0.01;

  spherical.theta -= dx * rotateSpeed;
  spherical.phi = Math.max(minPolar, Math.min(maxPolar, spherical.phi - dy * rotateSpeed));
  offset.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
  controls.update();
  updateAxisGizmo();
}

function updateAxisGizmo() {
  if (!axisGizmoParts.length) return;

  const axisButtonScale = axisGizmoEl
    ? (axisGizmoEl.clientWidth || GIZMO_VIEWBOX_SIZE) / GIZMO_VIEWBOX_SIZE
    : 1;
  const inverseCamera = camera.quaternion.clone().invert();
  const activeDims = [PARAMS.axesX, PARAMS.axesY, PARAMS.axesZ];
  for (const part of axisGizmoParts) {
    const dim = activeDims[part.slot] ?? part.slot;
    const label = axisLabel(dim);
    const color = AXIS_PALETTE[dim % AXIS_PALETTE.length];
    const isPositive = part.vector.getComponent(part.slot) > 0;
    const signedLabel = `${isPositive ? '+' : '-'}${label}`;
    part.button.textContent = isPositive ? label : '';
    part.button.title = `View ${signedLabel}`;
    part.button.setAttribute('aria-label', part.button.title);
    part.button.style.setProperty('--axis-color', color);
    part.line.style.stroke = color;

    const viewVector = part.vector.clone().applyQuaternion(inverseCamera);
    const x = axisGizmoCenter + viewVector.x * axisGizmoRadius;
    const y = axisGizmoCenter - viewVector.y * axisGizmoRadius;
    const isBack = viewVector.z > 0;

    part.button.style.left = `${x * axisButtonScale}px`;
    part.button.style.top = `${y * axisButtonScale}px`;
    part.button.style.zIndex = `${Math.round((1 - viewVector.z) * 100)}`;
    part.button.classList.toggle('back', isBack);

    part.line.setAttribute('x1', `${axisGizmoCenter}`);
    part.line.setAttribute('y1', `${axisGizmoCenter}`);
    part.line.setAttribute('x2', `${x}`);
    part.line.setAttribute('y2', `${y}`);
    part.line.style.opacity = isBack ? '0.2' : '0.64';
  }

  updateWGizmo();
}

function updateWGizmo() {
  if (!wAxisGizmoEl || !wAxisGizmoLineEl || !wAxisGizmoLabelEl || !wAxisGizmoNegEl || !wAxisGizmoPosEl) return;

  const wButtonScale = (wAxisGizmoEl.clientWidth || GIZMO_VIEWBOX_SIZE) / GIZMO_VIEWBOX_SIZE;
  const plane = currentWGizmoRotationPlane();
  const hasW = !!plane;
  const wColor = AXIS_PALETTE[(plane?.wDim ?? 3) % AXIS_PALETTE.length];
  wAxisGizmoEl.style.setProperty('--w-axis-color', wColor);
  wAxisGizmoEl.classList.toggle('disabled', !hasW);
  wAxisGizmoEl.title = hasW
    ? `Rotate global ${axisLabel(plane.wDim)} axis (${axisLabel(plane.planeAxis)}-${axisLabel(plane.wDim)} plane)`
    : 'W axis available in 4D+';
  wAxisGizmoEl.setAttribute('aria-label', wAxisGizmoEl.title);
  wAxisGizmoPosEl.disabled = !hasW;
  wAxisGizmoNegEl.disabled = !hasW;

  if (!plane) {
    const startX = wGizmoCenter - wGizmoRadius * 0.7;
    const startY = wGizmoCenter + wGizmoRadius * 0.7;
    const endX = wGizmoCenter + wGizmoRadius * 0.7;
    const endY = wGizmoCenter - wGizmoRadius * 0.7;
    wAxisGizmoLabelEl.textContent = 'W';
    wAxisGizmoLineEl.setAttribute('x1', `${startX}`);
    wAxisGizmoLineEl.setAttribute('y1', `${startY}`);
    wAxisGizmoLineEl.setAttribute('x2', `${endX}`);
    wAxisGizmoLineEl.setAttribute('y2', `${endY}`);
    wAxisGizmoLineEl.style.opacity = '0.35';
    wAxisGizmoNegEl.style.left = `${startX * wButtonScale}px`;
    wAxisGizmoNegEl.style.top = `${startY * wButtonScale}px`;
    wAxisGizmoPosEl.style.left = `${endX * wButtonScale}px`;
    wAxisGizmoPosEl.style.top = `${endY * wButtonScale}px`;
    wAxisGizmoPosEl.textContent = 'W';
    wAxisGizmoPosEl.classList.add('back');
    wAxisGizmoNegEl.classList.add('back');
    return;
  }

  const wLabel = axisLabel(plane.wDim);
  wAxisGizmoLabelEl.textContent = wLabel;
  wAxisGizmoPosEl.textContent = wLabel;
  wAxisGizmoPosEl.title = `Rotate ${axisLabel(plane.planeAxis)}-${wLabel}`;
  wAxisGizmoPosEl.setAttribute('aria-label', wAxisGizmoPosEl.title);
  wAxisGizmoNegEl.title = `Rotate ${axisLabel(plane.planeAxis)}-${wLabel}`;
  wAxisGizmoNegEl.setAttribute('aria-label', wAxisGizmoNegEl.title);

  const dx = Math.cos(wGizmoAngle);
  const dy = Math.sin(wGizmoAngle);

  const startX = wGizmoCenter - dx * wGizmoRadius;
  const startY = wGizmoCenter - dy * wGizmoRadius;
  const endX = wGizmoCenter + dx * wGizmoRadius;
  const endY = wGizmoCenter + dy * wGizmoRadius;

  wAxisGizmoLineEl.setAttribute('x1', `${startX}`);
  wAxisGizmoLineEl.setAttribute('y1', `${startY}`);
  wAxisGizmoLineEl.setAttribute('x2', `${endX}`);
  wAxisGizmoLineEl.setAttribute('y2', `${endY}`);
  wAxisGizmoLineEl.style.opacity = '0.9';

  wAxisGizmoNegEl.style.left = `${startX * wButtonScale}px`;
  wAxisGizmoNegEl.style.top = `${startY * wButtonScale}px`;
  wAxisGizmoPosEl.style.left = `${endX * wButtonScale}px`;
  wAxisGizmoPosEl.style.top = `${endY * wButtonScale}px`;
  wAxisGizmoPosEl.classList.remove('back');
  wAxisGizmoNegEl.classList.remove('back');
  wAxisGizmoPosEl.style.zIndex = '2';
  wAxisGizmoNegEl.style.zIndex = '1';
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const clickPlane = new THREE.Plane();
const clickPoint = new THREE.Vector3();

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(2, 3, 4);
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
const hemi = new THREE.HemisphereLight(0x88aaff, 0x090b12, 0.6);
scene.add(ambient, hemi, light);
const axes = new THREE.AxesHelper(1000);
axes.position.set(0, -0.6, 0);
scene.add(axes);
const gridGroup = new THREE.Group();
gridGroup.position.y = -0.6;
const gridRadius = 30;
const gridStep = 1;
const gridOpacity = 0.4;
const gridFadeStart = 0.62;
const gridFadeBuckets = 36;
const gridBuckets = Array.from({ length: gridFadeBuckets }, () => [] as number[]);
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const gridFadeAt = (x: number, z: number) => {
  const radial = Math.hypot(x, z) / gridRadius;
  return 1 - smoothstep(gridFadeStart, 1, radial);
};
const addGridSegment = (x1: number, z1: number, x2: number, z2: number) => {
  const fade = gridFadeAt((x1 + x2) * 0.5, (z1 + z2) * 0.5);
  if (fade <= 0.01) return;
  const bucket = Math.min(gridFadeBuckets - 1, Math.max(0, Math.floor(fade * gridFadeBuckets)));
  gridBuckets[bucket].push(x1, 0, z1, x2, 0, z2);
};
const addClippedGridLine = (fixed: number, alongX: boolean) => {
  const limit = Math.sqrt(Math.max(0, gridRadius * gridRadius - fixed * fixed));
  const stops = [-limit];
  const first = Math.ceil(-limit / gridStep) * gridStep;

  for (let v = first; v < limit; v += gridStep) {
    if (v > -limit) stops.push(v);
  }

  stops.push(limit);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (alongX) {
      addGridSegment(a, fixed, b, fixed);
    } else {
      addGridSegment(fixed, a, fixed, b);
    }
  }
};

for (let i = -gridRadius; i <= gridRadius; i += gridStep) {
  addClippedGridLine(i, true);
  addClippedGridLine(i, false);
}

for (let i = 0; i < gridBuckets.length; i++) {
  const positions = gridBuckets[i];
  if (!positions.length) continue;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x3a414f,
    opacity: gridOpacity * ((i + 0.5) / gridFadeBuckets),
    transparent: true,
    depthWrite: false,
  });
  gridGroup.add(new THREE.LineSegments(geometry, material));
}
scene.add(gridGroup);
const vertexGeo = new THREE.SphereGeometry(0.012, 8, 8);

// --- N-D state ---
let N = MAX_N;
let X = new Float32Array();
let E = new Uint32Array();
let M = 0;
let rot = new RotND(N);
let projector = new NDProjector(N, rot.matrix, canonicalP(N));
let Y = new Float32Array();
let dataSource: 'primitive' | 'custom' = 'primitive';
const edgesFallback = new Uint32Array([0, 0]);
const tmpVec = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();
const tmpN = new Float32Array(32);
const tmpCenter = new THREE.Vector3();
const dragRotated = new Float32Array(MAX_N);
const dragRotatedNext = new Float32Array(MAX_N);
const dragZero = new THREE.Vector3();
const dragQuat = new THREE.Quaternion();
const dragEuler = new THREE.Euler();
const dragRS = new THREE.Matrix4();
const dragRSInv = new THREE.Matrix4();
const dragWorldCurrent = new THREE.Vector3();
const dragYCurrent = new THREE.Vector3();
const dragTranslation = new THREE.Vector3();
const dragTargetY = new THREE.Vector3();
const dragTmpVec = new THREE.Vector3();
const dragWorldTarget = new THREE.Vector3();
let pcaCache: Float32Array | null = null;
let projectionDirty = true;
let setViewMode: (mode: ViewMode) => void;
const objList = document.getElementById('object-list') as HTMLDivElement | null;
const axisLegend = document.getElementById('axis-legend') as HTMLDivElement | null;
const axisList = document.getElementById('axis-list') as HTMLDivElement | null;
const statusBar = document.getElementById('status-bar') as HTMLDivElement | null;
const PANE_COLLAPSE_BREAKPOINT = 920;
const isMobilePaneViewport = () => window.innerWidth <= PANE_COLLAPSE_BREAKPOINT;
let lastPointer = { x: window.innerWidth - 180, y: window.innerHeight - 80 };
let paneCollapsed = isMobilePaneViewport();
let paneViewportWasMobile = isMobilePaneViewport();
type AxisMap = number[];
type SurfaceState = SurfaceMaterial;
const DEFAULT_SURFACE: SurfaceState = {
  color: 0xbfc7d5,
  metalness: 0.2,
  roughness: 0.05,
  alpha: 1,
};
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const normalizeSurface = (surface: SurfaceState | undefined): SurfaceState => ({
  color: Math.max(0, Math.min(0xffffff, (surface?.color ?? DEFAULT_SURFACE.color) >>> 0)),
  metalness: clamp01(surface?.metalness ?? DEFAULT_SURFACE.metalness),
  roughness: clamp01(surface?.roughness ?? DEFAULT_SURFACE.roughness),
  alpha: clamp01(surface?.alpha ?? DEFAULT_SURFACE.alpha),
});
const cloneSurface = (surface: SurfaceState): SurfaceState => ({ ...surface });
let syncingTextureUI = false;
let texturePreviewRenderer: THREE.WebGLRenderer | null = null;
let texturePreviewScene: THREE.Scene | null = null;
let texturePreviewCamera: THREE.PerspectiveCamera | null = null;
let texturePreviewCube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> | null = null;
type SceneSnapshot = {
  N: number;
  X: Float32Array;
  E: Uint32Array;
  M: number;
  source: 'primitive' | 'custom';
  label: string;
  paramsN: number;
  primitive: PrimitiveMode;
  axes: { x: number; y: number; z: number };
  axesOrder: number[];
  axesOffset: number;
  baseAxisMap: AxisMap;
  baseTransform: { pos: THREE.Vector3; rot: THREE.Vector3; scale: THREE.Vector3 };
  baseOrigN: number;
  baseVisible: boolean;
  baseSurface?: SurfaceState;
  selectedInstance: number;
  instances: InstanceSnapshot[];
};
type TransformState = { pos: THREE.Vector3; rot: THREE.Vector3; scale: THREE.Vector3; };
type InstanceSnapshot = {
  X: Float32Array;
  E: Uint32Array;
  M: number;
  offset: THREE.Vector3;
  label: string;
  kind: PrimitiveKind;
  transform: TransformState;
  originalN: number;
  axisMap: AxisMap;
  visible: boolean;
  surface?: SurfaceState;
};
const undoStack: SceneSnapshot[] = [];
const redoStack: SceneSnapshot[] = [];
const MAX_HISTORY = 20;
let baseLabel = 'Hypercube';
const BASE_SELECTION = -1;
const NO_SELECTION = -2;
let selectedInstance: number = BASE_SELECTION; // -1 base, >=0 extra, -2 none
let selectedVertex: number = -1;
let selectionOutline: THREE.LineSegments | null = null;
let vertexMarker: THREE.Mesh | null = null;
let vertexCloud: THREE.InstancedMesh | null = null;
let axisGuide: THREE.Line | null = null;
let wGuide: THREE.Line | null = null;
let deletePending = false;
const baseTransform = { pos: new THREE.Vector3(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
let baseOriginalN = 0;
let baseAxisMap: AxisMap = Array.from({ length: MAX_N }, (_, i) => i);
let baseVisible = true;
let baseSurface: SurfaceState = cloneSurface(DEFAULT_SURFACE);
type TransformMode = 'none' | 'move' | 'rotate' | 'scale';
type ProjectionAxes = { x: number; y: number; z: number };
const transformOp = {
  mode: 'none' as TransformMode,
  instIdx: -1,
  targetVertex: -1,
  startPos: new THREE.Vector3(),
  startRot: new THREE.Vector3(),
  startScale: 1,
  startMouse: new THREE.Vector2(),
  vertexStart: new THREE.Vector3(),
  axis: new THREE.Vector3(),
  plane: new THREE.Plane(),
  planeHitStart: new THREE.Vector3(),
  lastHit: new THREE.Vector3(),
  vertexDataStart: null as Float32Array | null,
  lockAxis: -1 as -1 | 0 | 1 | 2, // 0=x,1=y,2=z in current projected axes
  objectDataStart: null as Float32Array | null,
  wPlane: false,
  moveOffset: new THREE.Vector3(),
};
const toolbarTransformDrag = {
  active: false,
  started: false,
  pointerId: -1,
  mode: 'none' as TransformMode,
  startX: 0,
  startY: 0,
  sourceButton: null as HTMLButtonElement | null,
};
const axisDrag = { active: false, lastX: 0, accum: 0, prevZoom: controls.enableZoom, prevPan: controls.enablePan };
let axesOrder: number[] = Array.from({ length: N }, (_, i) => i);
let axesOffset = 0;

const visibleDims = () => Math.max(3, Math.min(PARAMS.N, MAX_N));

function canonicalAxisMap(localN: number): AxisMap {
  const count = Math.max(0, Math.min(localN, MAX_N));
  return Array.from({ length: count }, (_, dim) => dim);
}

function currentAxisMap(localN: number): AxisMap {
  const source = axesOrder.slice(0, visibleDims());
  const activeAxes = source.length ? source : canonicalAxisMap(MAX_N);
  const count = Math.max(0, Math.min(localN, MAX_N));
  return Array.from({ length: count }, (_, dim) => activeAxes[(axesOffset + dim) % activeAxes.length] ?? dim);
}

function normalizeAxisMap(axisMap: AxisMap | undefined, localN: number): AxisMap {
  const fallback = canonicalAxisMap(localN);
  const used = new Set<number>();

  return fallback.map((fallbackDim, dim) => {
    const mapped = axisMap?.[dim];
    const valid = typeof mapped === 'number'
      && Number.isInteger(mapped)
      && mapped >= 0
      && mapped < MAX_N
      && !used.has(mapped);
    const out = valid ? mapped : fallbackDim;
    used.add(out);
    return out;
  });
}

function embedToMax(localVerts: Float32Array, localN: number, axisMap: AxisMap) {
  const V = localVerts.length / localN;
  const out = new Float32Array(MAX_N * V);
  for (let d = 0; d < localN; d++) {
    const dim = axisMap[d] ?? d;
    for (let v = 0; v < V; v++) {
      out[dim * V + v] = localVerts[d * V + v];
    }
  }
  return out;
}

function perspectiveDepthDim(localN: number, axisMap: AxisMap) {
  return localN >= 4 ? axisMap[localN - 1] ?? -1 : -1;
}

function wRotationPlaneAxis(lockAxis: -1 | 0 | 1 | 2, depthDim: number) {
  const axes = [PARAMS.axesX, PARAMS.axesY, PARAMS.axesZ].map(dim => Math.max(0, Math.min(N - 1, dim % N)));
  const preferred = axes[lockAxis >= 0 ? lockAxis : 0];
  if (preferred !== depthDim) return preferred;
  return axes.find(dim => dim !== depthDim) ?? -1;
}

function setProjectionAxes({ x, y, z }: ProjectionAxes) {
  const nVis = visibleDims();
  const list = axesOrder.slice(0, nVis);
  const clamp = (v: number) => {
    const idx = list.indexOf(v);
    return idx >= 0 ? v : list[0] ?? 0;
  };
  PARAMS.axesX = clamp(x);
  PARAMS.axesY = clamp(y);
  PARAMS.axesZ = clamp(z);
  const idx = list.indexOf(PARAMS.axesX);
  if (idx >= 0) axesOffset = idx;
  projectionDirty = true;
  transformOp.lockAxis = -1;
  clearAxisGuide();
  updateAxisLegend();
  renderAxisList();
  projectAndRenderAll();
}

function cloneTransformState(transform: TransformState): TransformState {
  return {
    pos: transform.pos.clone(),
    rot: transform.rot.clone(),
    scale: transform.scale.clone(),
  };
}

function captureSnapshot(): SceneSnapshot {
  return {
    N,
    X: new Float32Array(X),
    E: new Uint32Array(E),
    M,
    source: dataSource,
    label: baseLabel,
    paramsN: PARAMS.N,
    primitive: PARAMS.primitive,
    axes: { x: PARAMS.axesX, y: PARAMS.axesY, z: PARAMS.axesZ },
    axesOrder: [...axesOrder],
    axesOffset,
    baseAxisMap: [...baseAxisMap],
    baseTransform: cloneTransformState(baseTransform),
    baseOrigN: baseOriginalN,
    baseVisible,
    baseSurface: cloneSurface(baseSurface),
    selectedInstance,
    instances: extraInstances.map(inst => ({
      X: new Float32Array(inst.X),
      E: new Uint32Array(inst.E),
      M: inst.M,
      offset: inst.offset.clone(),
      label: inst.label,
      kind: inst.kind,
      transform: cloneTransformState(inst.transform),
      originalN: inst.originalN,
      axisMap: [...inst.axisMap],
      visible: inst.visible,
      surface: cloneSurface(inst.surface),
    })),
  };
}

function pushUndoSnapshot() {
  undoStack.push(captureSnapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
}

function applySnapshot(snap: SceneSnapshot) {
  PARAMS.N = snap.paramsN;
  PARAMS.primitive = snap.primitive;
  rebuildState(snap.N, snap.X, snap.E, snap.source, snap.baseOrigN, snap.baseAxisMap);
  baseLabel = snap.label;
  PARAMS.axesX = snap.axes.x; PARAMS.axesY = snap.axes.y; PARAMS.axesZ = snap.axes.z;
  axesOrder = [...snap.axesOrder];
  axesOffset = snap.axesOffset;
  baseTransform.pos.copy(snap.baseTransform.pos);
  baseTransform.rot.copy(snap.baseTransform.rot);
  baseTransform.scale.copy(snap.baseTransform.scale);
  baseVisible = snap.baseVisible;
  baseSurface = normalizeSurface(snap.baseSurface);
  rendererND.setSurface(baseSurface);
  extraInstances.push(...snap.instances.map(restoreInstanceSnapshot));
  selectedInstance = snap.selectedInstance >= 0 && snap.selectedInstance < extraInstances.length
    ? snap.selectedInstance
    : (M > 0 ? BASE_SELECTION : NO_SELECTION);
  projectionDirty = true;
  projectAndRenderAll();
  applySliceFilter();
  updateDimensionControl();
  updateObjectList();
  selectObject(selectedInstance);
}
function cycleAxes(step: number) {
  const n = visibleDims();
  if (n < 3) return;
  axesOffset = (((axesOffset + step) % n) + n) % n;
  if (PARAMS.projection !== 'Canonical') {
    PARAMS.projection = 'Canonical';
    projectionDirty = true;
  }
  setProjectionAxes({
    x: axesOrder[axesOffset % n],
    y: axesOrder[(axesOffset + 1) % n],
    z: axesOrder[(axesOffset + 2) % n],
  });
}

function endAxisShiftDrag() {
  if (!axisDrag.active) return;
  axisDrag.active = false;
  axisDrag.accum = 0;
  controls.enableZoom = axisDrag.prevZoom;
  controls.enablePan = axisDrag.prevPan;
}

function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function isPlainTextEditTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    const type = (target.type || 'text').toLowerCase();
    return type === 'text'
      || type === 'search'
      || type === 'url'
      || type === 'tel'
      || type === 'email'
      || type === 'password'
      || type === 'number';
  }
  return false;
}

function getObjectVisible(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 && baseVisible;
  return extraInstances[idx]?.visible ?? false;
}

function setObjectVisible(idx: number, visible: boolean, recordUndo = true) {
  if (recordUndo && getObjectVisible(idx) !== visible) pushUndoSnapshot();

  if (idx === -1) {
    baseVisible = visible;
  } else if (extraInstances[idx]) {
    extraInstances[idx].visible = visible;
  }

  applyObjectVisibility();
  if (!visible && idx === selectedInstance) {
    if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
    if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
    if (vertexMarker) { scene.remove(vertexMarker); vertexMarker = null; }
  }
  selectObject(selectedInstance);
}

function applyObjectVisibility() {
  rendererND.group.visible = M > 0 && baseVisible;
  extraInstances.forEach(inst => {
    inst.renderer.group.visible = inst.visible;
  });
}

function renameObject(idx: number, value: string) {
  const label = value.trim();
  if (!label) {
    updateObjectList();
    return;
  }

  const current = idx === -1 ? baseLabel : extraInstances[idx]?.label;
  if (!current || current === label) {
    updateObjectList();
    return;
  }

  pushUndoSnapshot();
  if (idx === -1) {
    baseLabel = label;
  } else {
    extraInstances[idx].label = label;
  }
  updateObjectList();
}

function eyeIcon(visible: boolean) {
  const slash = visible ? '' : '<path d="M4 20L20 4"/>';
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/>
      <circle cx="12" cy="12" r="2.6"/>
      ${slash}
    </svg>
  `;
}

function updateObjectList() {
  if (!objList) return;

  const rows = [
    ...(M > 0 ? [{ idx: -1, label: baseLabel, dimension: baseOriginalN || PARAMS.N, visible: baseVisible }] : []),
    ...extraInstances.map((inst, idx) => ({
      idx,
      label: inst.label,
      dimension: inst.originalN,
      visible: inst.visible,
    })),
  ];

  objList.textContent = '';
  const title = document.createElement('h4');
  title.textContent = 'Objects';
  objList.appendChild(title);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th></th><th aria-label="Object name"></th><th>Dim</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = `object-row${row.idx === selectedInstance ? ' active' : ''}${row.visible ? '' : ' hidden'}`;
    tr.addEventListener('click', () => selectObject(row.idx));

    const visibilityCell = document.createElement('td');
    const visibilityButton = document.createElement('button');
    visibilityButton.className = 'object-eye';
    visibilityButton.type = 'button';
    visibilityButton.title = row.visible ? 'Hide object' : 'Show object';
    visibilityButton.setAttribute('aria-label', row.visible ? `Hide ${row.label}` : `Show ${row.label}`);
    visibilityButton.innerHTML = eyeIcon(row.visible);
    visibilityButton.addEventListener('click', ev => {
      ev.stopPropagation();
      setObjectVisible(row.idx, !row.visible);
    });
    visibilityCell.appendChild(visibilityButton);

    const nameCell = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.className = 'object-name';
    nameInput.value = row.label;
    nameInput.title = 'Rename object';
    nameInput.addEventListener('click', ev => ev.stopPropagation());
    nameInput.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') {
        ev.preventDefault();
        nameInput.blur();
      } else if (ev.key === 'Escape') {
        nameInput.value = row.label;
        nameInput.blur();
      }
    });
    nameInput.addEventListener('blur', () => renameObject(row.idx, nameInput.value));
    nameCell.appendChild(nameInput);

    const dimensionCell = document.createElement('td');
    dimensionCell.textContent = `${row.dimension}`;

    tr.append(visibilityCell, nameCell, dimensionCell);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  objList.appendChild(table);
  updateAxisLegend();
}

function toColorHex(color: number) {
  return `#${Math.max(0, Math.min(0xffffff, color >>> 0)).toString(16).padStart(6, '0')}`;
}

function getSurfaceTarget(idx: number): { surface: SurfaceState; renderer: HypercubeRenderer; } | null {
  if (idx === BASE_SELECTION) return M > 0 ? { surface: baseSurface, renderer: rendererND } : null;
  const inst = extraInstances[idx];
  return inst ? { surface: inst.surface, renderer: inst.renderer } : null;
}

function setTextureInputsEnabled(enabled: boolean) {
  if (textureBaseColorInput) textureBaseColorInput.disabled = !enabled;
  if (textureMetallicInput) textureMetallicInput.disabled = !enabled;
  if (textureRoughnessInput) textureRoughnessInput.disabled = !enabled;
  if (textureAlphaInput) textureAlphaInput.disabled = !enabled;
}

function syncTextureControls(surface: SurfaceState) {
  if (!textureBaseColorInput || !textureMetallicInput || !textureRoughnessInput || !textureAlphaInput) return;
  syncingTextureUI = true;
  textureBaseColorInput.value = toColorHex(surface.color);
  textureMetallicInput.value = `${surface.metalness}`;
  textureRoughnessInput.value = `${surface.roughness}`;
  textureAlphaInput.value = `${surface.alpha}`;
  if (textureBaseColorValue) textureBaseColorValue.textContent = textureBaseColorInput.value;
  if (textureMetallicValue) textureMetallicValue.textContent = surface.metalness.toFixed(3);
  if (textureRoughnessValue) textureRoughnessValue.textContent = surface.roughness.toFixed(3);
  if (textureAlphaValue) textureAlphaValue.textContent = surface.alpha.toFixed(3);
  syncingTextureUI = false;
}

function ensureTexturePreview() {
  if (!texturePreviewCanvas || texturePreviewRenderer) return;

  const rendererRef = new THREE.WebGLRenderer({
    canvas: texturePreviewCanvas,
    antialias: true,
    alpha: true,
  });
  rendererRef.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendererRef.outputColorSpace = THREE.SRGBColorSpace;
  rendererRef.toneMapping = renderer.toneMapping;
  rendererRef.toneMappingExposure = renderer.toneMappingExposure;
  rendererRef.useLegacyLights = renderer.useLegacyLights;
  rendererRef.setClearColor(0x000000, 0);

  const sceneRef = new THREE.Scene();
  sceneRef.environment = scene.environment;

  const cameraRef = new THREE.PerspectiveCamera(36, 1, 0.1, 10);
  cameraRef.position.set(1.8, 1.35, 1.9);
  cameraRef.lookAt(0, 0, 0);

  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: DEFAULT_SURFACE.color,
    metalness: DEFAULT_SURFACE.metalness,
    roughness: DEFAULT_SURFACE.roughness,
    transparent: false,
    opacity: DEFAULT_SURFACE.alpha,
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
  });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial);
  cube.rotation.set(0.45, 0.68, 0);
  sceneRef.add(cube);

  const previewLight = new THREE.DirectionalLight(0xffffff, light.intensity);
  previewLight.position.copy(light.position);
  const previewAmbient = new THREE.AmbientLight(0xffffff, ambient.intensity);
  const previewHemi = new THREE.HemisphereLight(hemi.color.getHex(), hemi.groundColor.getHex(), hemi.intensity);
  sceneRef.add(previewAmbient, previewHemi, previewLight);

  texturePreviewRenderer = rendererRef;
  texturePreviewScene = sceneRef;
  texturePreviewCamera = cameraRef;
  texturePreviewCube = cube;
}

function renderTexturePreview(surface: SurfaceState | null) {
  ensureTexturePreview();
  if (!texturePreviewRenderer || !texturePreviewScene || !texturePreviewCamera || !texturePreviewCube || !texturePreviewCanvas) return;

  const width = Math.max(1, texturePreviewCanvas.clientWidth);
  const height = Math.max(1, texturePreviewCanvas.clientHeight);
  texturePreviewRenderer.setSize(width, height, false);
  texturePreviewCamera.aspect = width / height;
  texturePreviewCamera.updateProjectionMatrix();

  if (!surface) {
    texturePreviewRenderer.clear();
    return;
  }

  const material = texturePreviewCube.material;
  material.color.setHex(surface.color);
  material.metalness = surface.metalness;
  material.roughness = surface.roughness;
  material.transparent = surface.alpha < 0.999;
  material.opacity = surface.alpha;
  material.depthWrite = !material.transparent;
  material.needsUpdate = true;

  texturePreviewRenderer.render(texturePreviewScene, texturePreviewCamera);
}

function updateTexturePanel() {
  if (!texturePanel) return;

  const target = getSurfaceTarget(selectedInstance);
  const editable = !!target && PARAMS.renderMode !== 'faceted';
  texturePanel.classList.toggle('empty', !target);
  texturePanel.classList.toggle('disabled', !editable);
  setTextureInputsEnabled(editable);

  if (target) {
    syncTextureControls(target.surface);
    renderTexturePreview(target.surface);
  } else {
    renderTexturePreview(null);
  }
}

function applyTextureFromInputs(recordUndo: boolean) {
  if (PARAMS.renderMode === 'faceted') return;
  if (syncingTextureUI) return;
  const target = getSurfaceTarget(selectedInstance);
  if (!target) return;
  if (!textureBaseColorInput || !textureMetallicInput || !textureRoughnessInput || !textureAlphaInput) return;

  const surface = normalizeSurface({
    color: Number.parseInt(textureBaseColorInput.value.replace('#', ''), 16),
    metalness: Number.parseFloat(textureMetallicInput.value),
    roughness: Number.parseFloat(textureRoughnessInput.value),
    alpha: Number.parseFloat(textureAlphaInput.value),
  });

  const prev = target.surface;
  const changed = prev.color !== surface.color
    || Math.abs(prev.metalness - surface.metalness) > 1e-6
    || Math.abs(prev.roughness - surface.roughness) > 1e-6
    || Math.abs(prev.alpha - surface.alpha) > 1e-6;
  if (!changed) return;

  if (recordUndo) pushUndoSnapshot();
  if (selectedInstance === BASE_SELECTION) {
    baseSurface = surface;
    rendererND.setSurface(baseSurface);
    rendererND.refreshSurface();
  } else {
    const inst = extraInstances[selectedInstance];
    if (!inst) return;
    inst.surface = surface;
    inst.renderer.setSurface(inst.surface);
    inst.renderer.refreshSurface();
  }

  syncTextureControls(surface);
  renderTexturePreview(surface);
}

function bindTextureControls() {
  if (!texturePanel) return;

  textureBaseColorInput?.addEventListener('input', () => {
    if (textureBaseColorValue && textureBaseColorInput) textureBaseColorValue.textContent = textureBaseColorInput.value;
    applyTextureFromInputs(false);
  });
  textureMetallicInput?.addEventListener('input', () => {
    if (textureMetallicValue && textureMetallicInput) textureMetallicValue.textContent = Number.parseFloat(textureMetallicInput.value).toFixed(3);
    applyTextureFromInputs(false);
  });
  textureRoughnessInput?.addEventListener('input', () => {
    if (textureRoughnessValue && textureRoughnessInput) textureRoughnessValue.textContent = Number.parseFloat(textureRoughnessInput.value).toFixed(3);
    applyTextureFromInputs(false);
  });
  textureAlphaInput?.addEventListener('input', () => {
    if (textureAlphaValue && textureAlphaInput) textureAlphaValue.textContent = Number.parseFloat(textureAlphaInput.value).toFixed(3);
    applyTextureFromInputs(false);
  });

  textureBaseColorInput?.addEventListener('change', () => applyTextureFromInputs(true));
  textureMetallicInput?.addEventListener('change', () => applyTextureFromInputs(true));
  textureRoughnessInput?.addEventListener('change', () => applyTextureFromInputs(true));
  textureAlphaInput?.addEventListener('change', () => applyTextureFromInputs(true));
}

function updateAxesHelperColors() {
  const colorAttr = axes.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!colorAttr) return;
  const cX = new THREE.Color(AXIS_PALETTE[PARAMS.axesX % AXIS_PALETTE.length]);
  const cY = new THREE.Color(AXIS_PALETTE[PARAMS.axesY % AXIS_PALETTE.length]);
  const cZ = new THREE.Color(AXIS_PALETTE[PARAMS.axesZ % AXIS_PALETTE.length]);
  // AxesHelper stores colors in pairs [origin, tip] for X,Y,Z
  colorAttr.setXYZ(0, cX.r, cX.g, cX.b);
  colorAttr.setXYZ(1, cX.r, cX.g, cX.b);
  colorAttr.setXYZ(2, cY.r, cY.g, cY.b);
  colorAttr.setXYZ(3, cY.r, cY.g, cY.b);
  colorAttr.setXYZ(4, cZ.r, cZ.g, cZ.b);
  colorAttr.setXYZ(5, cZ.r, cZ.g, cZ.b);
  colorAttr.needsUpdate = true;
}

function axisLabel(dim: number) {
  return ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S'][dim] ?? `D${dim}`;
}

function updateAxisLegend() {
  updateAxesHelperColors();
  if (!axisLegend) return;
  const nVis = visibleDims();
  const badges = Array.from({ length: nVis }).map((_, i) => {
    const color = AXIS_PALETTE[i % AXIS_PALETTE.length];
    return `<span class="badge" style="background:${color};">${axisLabel(i)}</span>`;
  }).join('');
  axisLegend.innerHTML = `<h4 style="margin:0 0 6px 0; font-size:12px; color:#e6ecf5;">Axes</h4><div>${badges}</div>`;
}
function renderAxisList() {
  if (!axisList) return;
  const nVis = visibleDims();
  if (nVis < 1) { axisList.innerHTML = ''; return; }
  const list = axesOrder.slice(0, nVis);
  const activeDims = new Set([
    list[(axesOffset + 0) % nVis],
    list[(axesOffset + 1) % nVis],
    list[(axesOffset + 2) % nVis],
  ]);
  const items = list.map((dim, idx) => {
    const color = AXIS_PALETTE[dim % AXIS_PALETTE.length];
    const active = activeDims.has(dim);
    return `<li data-idx="${idx}" data-dim="${dim}" class="${active ? 'active' : ''}" style="--axis-color:${color};border-top:3px solid ${color};">${axisLabel(dim)}</li>`;
  }).join('');
  axisList.innerHTML = `
    <div class="axis-list-head">
      <h4>Axis order</h4>
      <div class="axis-list-actions">
        <button id="axis-cycle-button" type="button" aria-label="Shift projected axes" title="Shift projected axes">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.2-5.5"></path>
            <path d="M4 4v5h5"></path>
          </svg>
        </button>
        <button id="pane-toggle" type="button" aria-label="Hide panel details" aria-expanded="true" aria-controls="pane" title="Hide panel details">
          <svg class="hide-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7"></path>
          </svg>
          <svg class="show-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
    <ul>${items}</ul>
  `;
  const axisCycleButton = axisList.querySelector('#axis-cycle-button') as HTMLButtonElement | null;
  axisCycleButton?.addEventListener('click', () => cycleAxes(1));
  const paneToggleButton = axisList.querySelector('#pane-toggle') as HTMLButtonElement | null;
  paneToggleButton?.addEventListener('click', () => setPaneCollapsed(!paneCollapsed));
  setPaneCollapsed(paneCollapsed);

  const axisUl = axisList.querySelector('ul') as HTMLUListElement | null;
  if (!axisUl) return;

  type AxisDragState = {
    pointerId: number;
    startX: number;
    startY: number;
    grabOffsetX: number;
    grabOffsetY: number;
    active: boolean;
    source: HTMLLIElement | null;
    placeholder: HTMLLIElement | null;
    ghost: HTMLLIElement | null;
  };

  const dragState: AxisDragState = {
    pointerId: -1,
    startX: 0,
    startY: 0,
    grabOffsetX: 0,
    grabOffsetY: 0,
    active: false,
    source: null,
    placeholder: null,
    ghost: null,
  };

  const clearDragPreview = () => {
    if (dragState.ghost?.parentElement) dragState.ghost.parentElement.removeChild(dragState.ghost);
    if (dragState.placeholder?.parentElement) dragState.placeholder.parentElement.removeChild(dragState.placeholder);
    if (dragState.source) {
      dragState.source.style.display = '';
      dragState.source.classList.remove('axis-drag-source');
    }
    axisUl.classList.remove('dragging');
    document.body.classList.remove('axis-list-dragging');
    dragState.placeholder = null;
    dragState.ghost = null;
  };

  const commitAxisDrag = () => {
    if (!dragState.active || !dragState.source || !dragState.placeholder) return;
    const draggedDim = Number(dragState.source.dataset.dim ?? -1);
    if (draggedDim < 0) return;

    const orderedDims: number[] = [];
    for (const child of Array.from(axisUl.children)) {
      if (child === dragState.source) continue;
      if (child === dragState.placeholder) {
        orderedDims.push(draggedDim);
        continue;
      }
      const dim = Number((child as HTMLElement).dataset.dim ?? -1);
      if (dim >= 0) orderedDims.push(dim);
    }

    const nVis = visibleDims();
    if (orderedDims.length !== nVis) return;
    axesOrder = [...orderedDims, ...axesOrder.slice(nVis)];
    const newOffset = axesOrder.slice(0, nVis).indexOf(PARAMS.axesX);
    axesOffset = newOffset >= 0 ? newOffset : 0;
    setProjectionAxes({
      x: axesOrder[axesOffset % nVis],
      y: axesOrder[(axesOffset + 1) % nVis],
      z: axesOrder[(axesOffset + 2) % nVis],
    });
  };

  const updateDropPlaceholder = (clientX: number, clientY: number) => {
    if (!dragState.placeholder || !dragState.source) return;
    const candidates = Array.from(axisUl.querySelectorAll('li')).filter(li => li !== dragState.placeholder && li !== dragState.source);
    let beforeEl: HTMLLIElement | null = null;
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const midX = rect.left + (rect.width * 0.5);
      const midY = rect.top + (rect.height * 0.5);
      const rowTolerance = rect.height * 0.45;
      const beforeByRow = clientY < (midY - rowTolerance);
      const beforeByColumn = Math.abs(clientY - midY) <= rowTolerance && clientX < midX;
      if (beforeByRow || beforeByColumn) {
        beforeEl = candidate;
        break;
      }
    }

    if (beforeEl) axisUl.insertBefore(dragState.placeholder, beforeEl);
    else axisUl.appendChild(dragState.placeholder);
  };

  const updateGhostPosition = (clientX: number, clientY: number) => {
    if (!dragState.ghost) return;
    dragState.ghost.style.left = `${clientX - dragState.grabOffsetX}px`;
    dragState.ghost.style.top = `${clientY - dragState.grabOffsetY}px`;
  };

  const beginAxisDrag = (ev: PointerEvent) => {
    if (!dragState.source) return;
    const sourceRect = dragState.source.getBoundingClientRect();
    dragState.active = true;
    dragState.grabOffsetX = ev.clientX - sourceRect.left;
    dragState.grabOffsetY = ev.clientY - sourceRect.top;

    dragState.placeholder = document.createElement('li');
    dragState.placeholder.className = 'axis-drop-placeholder';
    dragState.placeholder.style.width = `${sourceRect.width}px`;
    dragState.placeholder.style.height = `${sourceRect.height}px`;
    axisUl.insertBefore(dragState.placeholder, dragState.source.nextSibling);

    dragState.source.classList.add('axis-drag-source');
    dragState.source.style.display = 'none';

    dragState.ghost = dragState.source.cloneNode(true) as HTMLLIElement;
    dragState.ghost.classList.add('axis-drag-ghost');
    dragState.ghost.style.width = `${sourceRect.width}px`;
    dragState.ghost.style.height = `${sourceRect.height}px`;
    document.body.appendChild(dragState.ghost);

    axisUl.classList.add('dragging');
    document.body.classList.add('axis-list-dragging');
    updateGhostPosition(ev.clientX, ev.clientY);
    updateDropPlaceholder(ev.clientX, ev.clientY);
  };

  const onPointerMove = (ev: PointerEvent) => {
    if (ev.pointerId !== dragState.pointerId || !dragState.source) return;
    ev.preventDefault();
    if (!dragState.active) {
      const dx = ev.clientX - dragState.startX;
      const dy = ev.clientY - dragState.startY;
      if ((dx * dx) + (dy * dy) < 16) return;
      beginAxisDrag(ev);
    } else {
      updateGhostPosition(ev.clientX, ev.clientY);
      updateDropPlaceholder(ev.clientX, ev.clientY);
    }
  };

  const endAxisDrag = (commit: boolean) => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    if (commit) commitAxisDrag();
    clearDragPreview();
    dragState.pointerId = -1;
    dragState.startX = 0;
    dragState.startY = 0;
    dragState.grabOffsetX = 0;
    dragState.grabOffsetY = 0;
    dragState.active = false;
    dragState.source = null;
  };

  const onPointerUp = (ev: PointerEvent) => {
    if (ev.pointerId !== dragState.pointerId) return;
    endAxisDrag(true);
  };

  const onPointerCancel = (ev: PointerEvent) => {
    if (ev.pointerId !== dragState.pointerId) return;
    endAxisDrag(false);
  };

  axisUl.querySelectorAll('li').forEach(li => {
    li.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || dragState.pointerId !== -1) return;
      ev.preventDefault();
      dragState.pointerId = ev.pointerId;
      dragState.startX = ev.clientX;
      dragState.startY = ev.clientY;
      dragState.source = li as HTMLLIElement;
      dragState.active = false;
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    });
  });
}

function selectObject(idx: number) {
  let normalizedIdx = idx;
  if (normalizedIdx === BASE_SELECTION && M <= 0) normalizedIdx = NO_SELECTION;
  if (normalizedIdx >= 0 && !extraInstances[normalizedIdx]) normalizedIdx = NO_SELECTION;
  if (normalizedIdx < NO_SELECTION) normalizedIdx = NO_SELECTION;

  selectedInstance = normalizedIdx;
  selectedVertex = -1;
  deletePending = false;
  updateObjectList();
  if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
  const buildOutline = (geom: THREE.BufferGeometry) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xffa64d, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
    const outline = new THREE.LineSegments(geom, mat);
    outline.renderOrder = 10;
    return outline;
  };
  if (normalizedIdx === BASE_SELECTION) {
    if (M > 0) selectionOutline = buildOutline(rendererND.line.geometry);
  } else if (normalizedIdx >= 0) {
    const inst = extraInstances[normalizedIdx];
    selectionOutline = buildOutline(inst.renderer.line.geometry);
  }
  if (selectionOutline && !PARAMS.editMode && getObjectVisible(normalizedIdx)) {
    scene.add(selectionOutline);
  }
  applySceneBackground(PARAMS.editMode);
  if (vertexMarker) { scene.remove(vertexMarker); vertexMarker = null; }
  if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
  if (PARAMS.editMode && getObjectVisible(normalizedIdx)) updateVertexCloud(normalizedIdx);
  updateTexturePanel();
  updateTransformActionButtons();
}

function updateSelectionOutline() {
  if (!selectionOutline) return;
  if (PARAMS.editMode || !getObjectVisible(selectedInstance)) {
    scene.remove(selectionOutline); selectionOutline = null;
    return;
  }
  if (!scene.children.includes(selectionOutline)) scene.add(selectionOutline);
}

function clearAxisGuide() {
  if (axisGuide) { scene.remove(axisGuide); axisGuide.geometry.dispose(); axisGuide = null; }
  if (wGuide) { scene.remove(wGuide); wGuide.geometry.dispose(); wGuide = null; }
}

function computeCenterFromPositions(positions: Float32Array, count: number) {
  if (!count) return new THREE.Vector3();
  let sumX = 0, sumY = 0, sumZ = 0;
  for (let i = 0; i < count; i++) {
    const pIdx = i * 3;
    sumX += positions[pIdx];
    sumY += positions[pIdx + 1];
    sumZ += positions[pIdx + 2];
  }
  return new THREE.Vector3(sumX / count, sumY / count, sumZ / count);
}

function setDraggedVertexFromWorldPosition(instIdx: number, vertexIdx: number, worldPos: THREE.Vector3): boolean {
  const inst = instIdx === -1 ? null : extraInstances[instIdx];
  const src = inst ? inst.X : X;
  const mcount = inst ? inst.M : M;
  const yArr = inst ? inst.Y : Y;
  const transform = inst ? inst.transform : baseTransform;
  const originalN = inst ? inst.originalN : (baseOriginalN || visibleDims());
  const axisMap = inst ? inst.axisMap : baseAxisMap;

  if (vertexIdx < 0 || vertexIdx >= mcount) return false;

  const posArr = inst ? inst.renderer.positions : rendererND.positions;
  const pIdx = vertexIdx * 3;

  dragEuler.set(transform.rot.x, transform.rot.y, transform.rot.z);
  dragQuat.setFromEuler(dragEuler);
  dragRS.compose(dragZero, dragQuat, transform.scale);
  dragRSInv.copy(dragRS).invert();

  dragWorldCurrent.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
  dragYCurrent.set(yArr[vertexIdx], yArr[mcount + vertexIdx], yArr[2 * mcount + vertexIdx]);
  dragTmpVec.copy(dragYCurrent).applyMatrix4(dragRS);
  dragTranslation.copy(dragWorldCurrent).sub(dragTmpVec);

  dragTargetY.copy(worldPos).sub(dragTranslation).applyMatrix4(dragRSInv);

  const R = rot.matrix;
  for (let d = 0; d < N; d++) {
    let acc = 0;
    for (let a = 0; a < N; a++) acc += R[d * N + a] * src[a * mcount + vertexIdx];
    dragRotated[d] = acc;
    dragRotatedNext[d] = acc;
  }

  const axes = [PARAMS.axesX % N, PARAMS.axesY % N, PARAMS.axesZ % N].map(v => Math.max(0, Math.min(N - 1, v)));
  const depthDim = perspectiveDepthDim(originalN, axisMap);
  const k = 0.6;

  let w = depthDim >= 0 ? dragRotated[depthDim] ?? 0 : 0;
  const depthSlot = depthDim >= 0 ? axes.indexOf(depthDim) : -1;
  if (depthSlot >= 0) {
    const depthProjected = depthSlot === 0 ? dragTargetY.x : depthSlot === 1 ? dragTargetY.y : dragTargetY.z;
    const denom = 1 + k * depthProjected;
    if (Math.abs(denom) > 1e-6) w = depthProjected / denom;
  }

  const scale = depthDim >= 0 ? 1 / Math.max(0.05, (1 - k * w)) : 1;

  for (let c = 0; c < 3; c++) {
    const dim = axes[c];
    const projected = c === 0 ? dragTargetY.x : c === 1 ? dragTargetY.y : dragTargetY.z;
    if (depthDim >= 0 && dim === depthDim) {
      dragRotatedNext[dim] = w;
    } else {
      dragRotatedNext[dim] = projected / scale;
    }
  }

  for (let a = 0; a < N; a++) {
    let acc = 0;
    for (let d = 0; d < N; d++) acc += R[d * N + a] * dragRotatedNext[d];
    src[a * mcount + vertexIdx] = acc;
  }

  if (instIdx === -1) projectionDirty = true;
  return true;
}

function updateAxisGuide() {
  clearAxisGuide();
  if (transformOp.mode === 'none') return;
  const hasAxis = transformOp.lockAxis !== -1;
  const axisIdx = hasAxis ? transformOp.lockAxis : 0;
  const dir = new THREE.Vector3(
    axisIdx === 0 ? 1 : 0,
    axisIdx === 1 ? 1 : 0,
    axisIdx === 2 ? 1 : 0,
  );
  if (!hasAxis && !transformOp.wPlane) return;

  let center = new THREE.Vector3();
  if (transformOp.targetVertex >= 0) {
    const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
    const posArr = inst ? inst.renderer.positions : rendererND.positions;
    const idx = transformOp.targetVertex * 3;
    center.set(posArr[idx], posArr[idx+1], posArr[idx+2]);
  } else {
    if (transformOp.instIdx === -1 && M > 0) {
      center = computeCenterFromPositions(rendererND.positions, M);
    } else if (transformOp.instIdx >= 0) {
      const inst = extraInstances[transformOp.instIdx];
      center = computeCenterFromPositions(inst.renderer.positions, inst.M);
    }
  }
  const len = 3;
  const points = [
    center.clone().addScaledVector(dir, -len),
    center.clone().addScaledVector(dir, len),
  ];
  if (hasAxis) {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffa64d, linewidth: 2, depthTest: false, transparent: true, opacity: 0.9 });
    axisGuide = new THREE.Line(geom, mat);
    axisGuide.renderOrder = 30;
    scene.add(axisGuide);
  }
  if (transformOp.wPlane) {
    const wDir = new THREE.Vector3(0, 0, 0);
    wDir.copy(dir).cross(camera.getWorldDirection(tmpVec).normalize()).normalize();
    if (wDir.lengthSq() === 0) wDir.copy(camera.up).normalize();
    const wLen = 2;
    const wPoints = [
      center.clone().addScaledVector(wDir, -wLen),
      center.clone().addScaledVector(wDir, wLen),
    ];
    const wGeom = new THREE.BufferGeometry().setFromPoints(wPoints);
    const wMat = new THREE.LineBasicMaterial({ color: 0xc084fc, linewidth: 2, depthTest: false, transparent: true, opacity: 0.9 });
    wGuide = new THREE.Line(wGeom, wMat);
    wGuide.renderOrder = 31;
    scene.add(wGuide);
  }
}

function updateVertexCloud(instIdx: number) {
  if (!PARAMS.editMode || !getObjectVisible(instIdx)) {
    if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
    if (vertexMarker) { scene.remove(vertexMarker); vertexMarker = null; }
    return;
  }
  const rendererRef = instIdx === -1 ? rendererND : extraInstances[instIdx].renderer;
  const count = instIdx === -1 ? M : extraInstances[instIdx].M;
  if (!rendererRef || count <= 0) return;
  if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
  const mat = new THREE.MeshBasicMaterial({ color: 0xbfc7d5 });
  vertexCloud = new THREE.InstancedMesh(vertexGeo, mat, count);
  const dummy = new THREE.Object3D();
  const posArr = rendererRef.positions;
  for (let i = 0; i < count; i++) {
    const pIdx = i * 3;
    dummy.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
    dummy.updateMatrix();
    vertexCloud.setMatrixAt(i, dummy.matrix);
  }
  vertexCloud.instanceMatrix.needsUpdate = true;
  vertexCloud.renderOrder = 5;
  scene.add(vertexCloud);
  if (selectedVertex >= 0) placeVertexMarker(instIdx, selectedVertex);
}

function placeVertexMarker(instIdx: number, vIdx: number) {
  if (!getObjectVisible(instIdx)) return;
  if (!vertexMarker) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffa64d, depthTest: false });
    vertexMarker = new THREE.Mesh(vertexGeo, mat);
    vertexMarker.renderOrder = 20;
  }
  vertexMarker.scale.setScalar(1.35);
  const rendererRef = instIdx === -1 ? rendererND : extraInstances[instIdx].renderer;
  const posArr = rendererRef.positions;
  const pIdx = vIdx * 3;
  vertexMarker.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
  scene.add(vertexMarker);
}

function deleteSelected() {
  if (selectedInstance < 0) return;
  pushUndoSnapshot();
  const inst = extraInstances[selectedInstance];
  inst.renderer.dispose();
  extraInstances.splice(selectedInstance, 1);
  selectedInstance = NO_SELECTION;
  if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
  deletePending = false;
  projectAndRenderAll();
  applySliceFilter();
  updateObjectList();
  selectObject(selectedInstance);
}

type Instance = {
  renderer: HypercubeRenderer;
  Y: Float32Array;
  X: Float32Array;
  E: Uint32Array;
  M: number;
  offset: THREE.Vector3;
  label: string;
  kind: PrimitiveKind;
  transform: TransformState;
  originalN: number;
  axisMap: AxisMap;
  visible: boolean;
  surface: SurfaceState;
};

const extraInstances: Instance[] = [];

function restoreInstanceSnapshot(snap: InstanceSnapshot): Instance {
  const instanceRenderer = new HypercubeRenderer(scene);
  instanceRenderer.build(snap.M, snap.E);
  const surface = normalizeSurface(snap.surface);
  instanceRenderer.setSurface(surface);
  instanceRenderer.setMode(PARAMS.renderMode);

  return {
    renderer: instanceRenderer,
    Y: new Float32Array(3 * snap.M),
    X: new Float32Array(snap.X),
    E: new Uint32Array(snap.E),
    M: snap.M,
    offset: snap.offset.clone(),
    label: snap.label,
    kind: snap.kind,
    transform: cloneTransformState(snap.transform),
    originalN: snap.originalN,
    axisMap: normalizeAxisMap(snap.axisMap, snap.originalN),
    visible: snap.visible,
    surface,
  };
}

const rendererND = new HypercubeRenderer(scene);
if (M > 0) {
  rendererND.build(M, E);
  rendererND.setMode('faceted');
}

// --- UI state ---
const PARAMS = {
  N: 4,
  primitive: 'hypercube' as PrimitiveMode,
  projection: 'Canonical' as ProjMode,
  // Slicing
  sliceDim: -1,
  sliceMin: -0.5,
  sliceMax: 0.5,
  renderMode: 'faceted' as ViewMode,
  editMode: false,
  autoSpin: false,
  axesX: 0,
  axesY: 1,
  axesZ: 2,
};
initAxisGizmo();

const clonePlane = (p: Plane) => ({ ...p, _lastTheta: p._lastTheta ?? 0 });
const DEFAULT_PLANES: Plane[] = [
  { i: 0, j: 1, theta: 0, auto: true, speed: 0.45 },
  { i: 2, j: 3, theta: 0, auto: true, speed: 0.31 },
  { i: 4, j: 5, theta: 0, auto: true, speed: 0.18 },
];
// Planes (up to 3)
const planes: Plane[] = DEFAULT_PLANES.map(clonePlane);
function refreshPlaneOptions() {
  // Keep i,j indices inside [0, N-1].
  planes.forEach(p => {
    p.i = Math.min(p.i, N-1);
    p.j = Math.min(p.j, N-1);
    p.theta = 0;
    p._lastTheta = 0;
  });
}

function updateDimensionControl() {
  if (dimensionValue) dimensionValue.textContent = `${PARAMS.N}D`;
  if (dimensionDownButton) dimensionDownButton.disabled = PARAMS.N <= 3;
  if (dimensionUpButton) dimensionUpButton.disabled = PARAMS.N >= MAX_N;
}

function setNewPrimitiveDimension(value: number) {
  if (!Number.isFinite(value)) {
    updateDimensionControl();
    return;
  }
  const next = Math.max(3, Math.min(MAX_N, Math.round(value)));
  PARAMS.N = next;
  const nVis = visibleDims();
  axesOffset = (((axesOffset % nVis) + nVis) % nVis);
  const visibleOrder = axesOrder.slice(0, nVis);
  PARAMS.axesX = visibleOrder[axesOffset % nVis] ?? 0;
  PARAMS.axesY = visibleOrder[(axesOffset + 1) % nVis] ?? 1;
  PARAMS.axesZ = visibleOrder[(axesOffset + 2) % nVis] ?? 2;
  updateDimensionControl();
  renderAxisList();
  updateAxisLegend();
}

function updateEditModeToggle() {
  if (!editModeToggle) return;
  editModeToggle.classList.toggle('active', PARAMS.editMode);
  editModeToggle.setAttribute('aria-pressed', String(PARAMS.editMode));
}

function setEditMode(active: boolean) {
  PARAMS.editMode = active;
  applySceneBackground(PARAMS.editMode);
  updateEditModeToggle();

  selectedVertex = -1;
  if (vertexMarker) { scene.remove(vertexMarker); vertexMarker = null; }
  if (!PARAMS.editMode) {
    if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
  } else {
    updateVertexCloud(selectedInstance);
  }
  updateSelectionOutline();
  updateTransformActionButtons();
}

function updateTransformActionButtons() {
  const buttons: { mode: TransformMode; el: HTMLButtonElement | null; }[] = [
    { mode: 'move', el: transformMoveButton },
    { mode: 'rotate', el: transformRotateButton },
    { mode: 'scale', el: transformScaleButton },
  ];
  const hasTarget = getObjectVisible(selectedInstance);
  const busy = transformOp.mode !== 'none';

  for (const entry of buttons) {
    if (!entry.el) continue;
    entry.el.classList.toggle('active', transformOp.mode === entry.mode);
    entry.el.disabled = !hasTarget || busy;
  }
}

function setPaneCollapsed(collapsed: boolean) {
  paneCollapsed = collapsed;
  document.body.classList.toggle('pane-collapsed', paneCollapsed);
  const paneToggleButton = getPaneToggleButton();
  if (paneToggleButton) {
    paneToggleButton.setAttribute('aria-expanded', String(!paneCollapsed));
    paneToggleButton.setAttribute('aria-label', paneCollapsed ? 'Show panel details' : 'Hide panel details');
    paneToggleButton.title = paneCollapsed ? 'Show panel details' : 'Hide panel details';
  }
}

function syncPaneCollapsedToViewport(force = false) {
  const isMobile = isMobilePaneViewport();
  if (!force && isMobile === paneViewportWasMobile) return;
  paneViewportWasMobile = isMobile;
  setPaneCollapsed(isMobile);
}

function applyProjectionMatrix() {
  if (PARAMS.projection === 'Canonical' || M === 0) {
    const nVis = visibleDims();
    const axes = [PARAMS.axesX % nVis, PARAMS.axesY % nVis, PARAMS.axesZ % nVis].map(v => Math.max(0, Math.min(nVis - 1, v)));
    const P = new Float32Array(3 * N);
    P[0 * N + axes[0]] = 1;
    P[1 * N + axes[1]] = 1;
    P[2 * N + axes[2]] = 1;
    projector.setCustomP(P);
    pcaCache = null;
  } else {
    if (!pcaCache || projectionDirty) {
      const { P } = pcaTopK(X, N, M, 3);
      pcaCache = P;
      projectionDirty = false;
    }
    projector.setCustomP(pcaCache!);
    if (M > 0) {
      const chooseMaxDim = (row: number) => {
        let best = 0, bestVal = -Infinity;
        for (let k = 0; k < N; k++) {
          const val = Math.abs(pcaCache![row * N + k]);
          if (val > bestVal) { bestVal = val; best = k; }
        }
        return best;
      };
      const newAxes = { x: chooseMaxDim(0), y: chooseMaxDim(1), z: chooseMaxDim(2) };
      if (newAxes.x !== PARAMS.axesX || newAxes.y !== PARAMS.axesY || newAxes.z !== PARAMS.axesZ) {
        PARAMS.axesX = newAxes.x; PARAMS.axesY = newAxes.y; PARAMS.axesZ = newAxes.z;
        axesOffset = axesOrder.indexOf(PARAMS.axesX);
        updateAxisLegend();
        renderAxisList();
      }
    }
  }
}

function applySliceFilter() {
  if (M > 0 && rendererND.geometry) {
    rendererND.filterEdgesByDimRange(X, N, M, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
  }
  extraInstances.forEach(inst => {
    inst.renderer.filterEdgesByDimRange(inst.X, N, inst.M, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
  });
  updateSelectionOutline();
  applySceneBackground(PARAMS.editMode);
  if (PARAMS.editMode) {
    updateVertexCloud(selectedInstance);
  } else {
    if (vertexCloud) { scene.remove(vertexCloud); vertexCloud = null; }
  }
}

function recenterProjected(Yarr: Float32Array, Mloc: number) {
  if (Mloc === 0) return tmpCenter.set(0,0,0);
  let sumX = 0, sumY = 0, sumZ = 0;
  for (let i = 0; i < Mloc; i++) {
    sumX += Yarr[i];
    sumY += Yarr[Mloc + i];
    sumZ += Yarr[2 * Mloc + i];
  }
  const cx = sumX / Mloc, cy = sumY / Mloc, cz = sumZ / Mloc;
  for (let i = 0; i < Mloc; i++) {
    Yarr[i] -= cx;
    Yarr[Mloc + i] -= cy;
    Yarr[2 * Mloc + i] -= cz;
  }
  return tmpCenter.set(cx, cy, cz);
}

function projectAndRenderAll() {
  const usePerspective = N >= 4;
  if (usePerspective) {
    const axes = [PARAMS.axesX % N, PARAMS.axesY % N, PARAMS.axesZ % N].map(v => Math.max(0, Math.min(N - 1, v)));
    const k = 0.6;
    const projectOne = (
      Xsrc: Float32Array,
      Mloc: number,
      Ydst: Float32Array,
      transform: { pos: THREE.Vector3; rot: THREE.Vector3; scale: THREE.Vector3; },
      renderer: HypercubeRenderer,
      originalN: number,
      axisMap: AxisMap,
    ) => {
      if (Mloc === 0) return;
      const n = N;
      const R = rot.matrix;
      const depthDim = perspectiveDepthDim(originalN, axisMap);
      for (let m = 0; m < Mloc; m++) {
        // rotate into tmpN
        for (let d = 0; d < n; d++) {
          let acc = 0;
          for (let a = 0; a < n; a++) acc += R[d * n + a] * Xsrc[a * Mloc + m];
          tmpN[d] = acc;
        }
        const w = depthDim >= 0 ? tmpN[depthDim] ?? 0 : 0;
        const scale = depthDim >= 0 ? 1 / Math.max(0.05, (1 - k * w)) : 1;
        Ydst[0 * Mloc + m] = tmpN[axes[0]] * scale;
        Ydst[1 * Mloc + m] = tmpN[axes[1]] * scale;
        Ydst[2 * Mloc + m] = tmpN[axes[2]] * scale;
      }
      const center = recenterProjected(Ydst, Mloc);
      const tpos = tmpVec.set(transform.pos.x + center.x, transform.pos.y + center.y, transform.pos.z + center.z);
      renderer.setTransform(tpos, new THREE.Euler(transform.rot.x, transform.rot.y, transform.rot.z), transform.scale);
      renderer.writeInterleavedFrom(Ydst);
      renderer.refreshSurface();
    };
    if (M > 0 && rendererND.geometry) {
      projectOne(X, M, Y, baseTransform, rendererND, baseOriginalN || visibleDims(), baseAxisMap);
    }
    extraInstances.forEach(inst => {
      projectOne(inst.X, inst.M, inst.Y, inst.transform, inst.renderer, inst.originalN, inst.axisMap);
    });
  } else {
    applyProjectionMatrix();
    if (M > 0 && rendererND.geometry) {
      projector.project(X, M, Y);
      const center = recenterProjected(Y, M);
      const tpos = tmpVec.set(baseTransform.pos.x + center.x, baseTransform.pos.y + center.y, baseTransform.pos.z + center.z);
      rendererND.setTransform(tpos, new THREE.Euler(baseTransform.rot.x, baseTransform.rot.y, baseTransform.rot.z), baseTransform.scale);
      rendererND.writeInterleavedFrom(Y);
      rendererND.refreshSurface();
    }
    extraInstances.forEach(inst => {
      projector.project(inst.X, inst.M, inst.Y);
      const center = recenterProjected(inst.Y, inst.M);
      const tpos = tmpVec.set(inst.transform.pos.x + center.x, inst.transform.pos.y + center.y, inst.transform.pos.z + center.z);
      inst.renderer.setTransform(tpos, new THREE.Euler(inst.transform.rot.x, inst.transform.rot.y, inst.transform.rot.z), inst.transform.scale);
      inst.renderer.writeInterleavedFrom(inst.Y);
      inst.renderer.refreshSurface();
    });
  }
  applyObjectVisibility();
  updateSelectionOutline();
  if (PARAMS.editMode) updateVertexCloud(selectedInstance);
  updateAxisGuide();
}

function updateAutoRotateToggle() {
  if (!autoRotateToggle) return;
  const active = PARAMS.autoSpin;
  autoRotateToggle.classList.toggle('active', active);
  autoRotateToggle.setAttribute('aria-pressed', String(active));
  autoRotateToggle.setAttribute('aria-label', active ? 'Stop auto rotation' : 'Start auto rotation');
  autoRotateToggle.title = active ? 'Stop auto rotation' : 'Start auto rotation';
}

function resetAutoRotationState() {
  rot.reset();
  planes.forEach(plane => {
    plane.theta = 0;
    plane._lastTheta = 0;
  });
  wGizmoAngle = -Math.PI / 4;
  applySceneBackground(PARAMS.editMode);
  projectionDirty = true;
}

function setAutoRotation(active: boolean) {
  const wasActive = PARAMS.autoSpin;
  PARAMS.autoSpin = active;
  if (wasActive && !active) {
    resetAutoRotationState();
    projectAndRenderAll();
    applySliceFilter();
  }
  updateAutoRotateToggle();
}

function applyAutoRotation(dt: number) {
  if (!PARAMS.autoSpin) return;

  const nVis = visibleDims();
  let rotated = false;
  let wDelta = 0;
  const wPlane = currentWGizmoRotationPlane();
  for (const plane of planes) {
    if (!plane.auto || plane.speed === 0 || plane.i === plane.j) continue;
    if (plane.i >= nVis || plane.j >= nVis) continue;

    const delta = plane.speed * dt;
    plane.theta += delta;
    rot.applyGivensLeft(plane.i, plane.j, delta);
    if (wPlane && (plane.i === wPlane.wDim || plane.j === wPlane.wDim)) {
      // Keep gizmo/hue in sync whenever auto-rotation spins through W.
      wDelta += plane.i === wPlane.wDim ? -delta : delta;
    }
    rotated = true;
  }

  if (rotated) {
    projectionDirty = true;
    if (Math.abs(wDelta) > 1e-6) {
      wGizmoAngle = normalizeSignedAngleDelta(wGizmoAngle + wDelta);
      applySceneBackground(PARAMS.editMode);
    }
  }
}

function showDeleteConfirm(ev?: MouseEvent) {
  if (!ctxMenu) return;
  deletePending = true;
  ctxMenu.innerHTML = '';
  const title = document.createElement('div');
  title.textContent = 'Delete?';
  title.style.padding = '8px 12px';
  title.style.fontWeight = '700';
  ctxMenu.appendChild(title);
  const confirm = document.createElement('button');
  confirm.textContent = 'Confirm';
  confirm.onclick = () => {
    ctxMenu.style.display = 'none';
    deletePending = false;
    deleteSelected();
  };
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.onclick = () => {
    deletePending = false;
    ctxMenu.style.display = 'none';
  };
  ctxMenu.appendChild(confirm);
  ctxMenu.appendChild(cancel);
  const x = ev?.clientX ?? lastPointer.x;
  const y = ev?.clientY ?? lastPointer.y;
  ctxMenu.style.left = `${x}px`;
  ctxMenu.style.top = `${y}px`;
  ctxMenu.style.display = 'block';
}

function clearExtraInstances() {
  extraInstances.forEach(inst => inst.renderer.dispose());
  extraInstances.length = 0;
  selectedInstance = NO_SELECTION;
}

function addInstanceAt(offset: THREE.Vector3, recordUndo = true) {
  if (recordUndo) pushUndoSnapshot();
  let data: { verts: Float32Array; edges: Uint32Array; V: number; kind: PrimitiveKind; axisMap: AxisMap; originalN: number };
  if (M > 0 && baseVisible) {
    data = {
      verts: new Float32Array(X),
      edges: new Uint32Array(E),
      V: M,
      kind: PARAMS.primitive,
      axisMap: [...baseAxisMap],
      originalN: baseOriginalN || PARAMS.N,
    };
  } else {
    const local = buildPrimitive(PARAMS.primitive, PARAMS.N);
    const axisMap = currentAxisMap(PARAMS.N);
    const embedded = embedToMax(local.verts, PARAMS.N, axisMap);
    data = { verts: embedded, edges: local.edges, V: local.V, kind: PARAMS.primitive, axisMap, originalN: PARAMS.N };
  }
  const instRenderer = new HypercubeRenderer(scene);
  instRenderer.build(data.V, data.edges);
  const surface = M > 0 && baseVisible ? cloneSurface(baseSurface) : cloneSurface(DEFAULT_SURFACE);
  instRenderer.setSurface(surface);
  const Yloc = new Float32Array(3 * data.V);
  const label = `${data.kind} #${extraInstances.length + 1}`;
  const t = { pos: offset.clone(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
  extraInstances.push({
    renderer: instRenderer,
    Y: Yloc,
    X: data.verts,
    E: data.edges,
    M: data.V,
    offset: offset.clone(),
    label,
    kind: data.kind,
    transform: t,
    originalN: data.originalN,
    axisMap: [...data.axisMap],
    visible: true,
    surface,
  });
  projector.project(data.verts, data.V, Yloc);
  instRenderer.setTransform(t.pos, new THREE.Euler(t.rot.x, t.rot.y, t.rot.z), t.scale);
  instRenderer.writeInterleavedFrom(Yloc);
  instRenderer.filterEdgesByDimRange(data.verts, MAX_N, data.V, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
  instRenderer.setMode(PARAMS.renderMode);
  projectAndRenderAll();
  applySliceFilter();
  if (setViewMode) setViewMode(PARAMS.renderMode);
  updateObjectList();
}

function rebuildState(newN: number, newX: Float32Array, newE: Uint32Array, source: 'primitive' | 'custom', localN?: number, axisMap?: AxisMap) {
  setAutoRotation(false);
  endAxisShiftDrag();
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enabled = true;
  controls.reset();
  camera.position.copy(DEFAULT_CAMERA_POSITION);
  // ensure render mode persists
  const currentMode = PARAMS.renderMode;
  dataSource = source;
  const ambientN = MAX_N;
  N = ambientN;
  PARAMS.N = Math.min(PARAMS.N, MAX_N);
  X = new Float32Array(newX);
  E = newE.length ? new Uint32Array(newE) : edgesFallback;
  M = ambientN > 0 ? Math.floor(newX.length / ambientN) : 0;
  rot = new RotND(ambientN);
  projector = new NDProjector(ambientN, rot.matrix, canonicalP(ambientN));
  Y = new Float32Array(3 * M);
  pcaCache = null;
  projectionDirty = true;
  clearExtraInstances();
  baseVisible = true;
  baseTransform.pos.set(0,0,0);
  baseTransform.rot.set(0,0,0);
  baseTransform.scale.set(1,1,1);
  baseOriginalN = localN ?? visibleDims();
  baseAxisMap = normalizeAxisMap(axisMap, baseOriginalN);
  baseSurface = cloneSurface(DEFAULT_SURFACE);
  axesOrder = Array.from({ length: N }, (_, i) => i);
  axesOffset = 0;
  PARAMS.axesX = axesOrder[0] ?? 0;
  PARAMS.axesY = axesOrder[1] ?? 1;
  PARAMS.axesZ = axesOrder[2] ?? 2;
  refreshPlaneOptions();
  if (PARAMS.sliceDim >= ambientN) PARAMS.sliceDim = ambientN - 1;
  if (M > 0) {
    rendererND.build(M, E);
    rendererND.setSurface(baseSurface);
    rendererND.setMode(PARAMS.renderMode);
    if (setViewMode) setViewMode(currentMode);
    projectAndRenderAll();
    applySliceFilter();
  } else {
    // no base geometry
    rendererND.dispose?.();
  }
  updateDimensionControl();
  baseLabel = source === 'custom' ? 'Custom' : 'Hypercube';
  updateObjectList();
  selectObject(BASE_SELECTION);
  updateAxisLegend();
  renderAxisList();
}

function downloadText(name: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleImport(file: File) {
  try {
    const text = await file.text();
    const parsed = parseGeometryJson(text);
    if (parsed.N < 3 || parsed.N > 8) {
      alert('Only datasets between 3 and 8 dimensions can be visualized.');
      return;
    }
    pushUndoSnapshot();
    PARAMS.N = parsed.N;
    const axisMap = canonicalAxisMap(parsed.N);
    const embedded = embedToMax(parsed.X, parsed.N, axisMap);
    const edges = parsed.edges.length ? parsed.edges : edgesFallback;
    rebuildState(MAX_N, embedded, edges, 'custom', parsed.N, axisMap);
  } catch (err) {
    console.error(err);
    alert(`Import failed: ${(err as Error).message}`);
  } finally {
    if (fileInput) fileInput.value = '';
  }
}

function exportProjectionJSON() {
  const { Xsrc, count, Esrc } = getCurrentExportData();
  if (count === 0) { alert('No data to export'); return; }
  downloadText('data.json', serializeGeometryJson(Xsrc, count, N, Esrc), 'application/json');
}

function getCurrentExportData() {
  if (selectedInstance >= 0 && extraInstances[selectedInstance]) {
    const inst = extraInstances[selectedInstance];
    return { Xsrc: inst.X, count: inst.M, Esrc: inst.E };
  }
  if (M > 0) return { Xsrc: X, count: M, Esrc: E };
  return { Xsrc: new Float32Array(), count: 0, Esrc: new Uint32Array() };
}

function formatCoords(Nloc: number, coords: Float32Array, count: number, idx: number) {
  const parts: string[] = [];
  for (let d = 0; d < Nloc; d++) {
    const v = coords[d * count + idx];
    parts.push(`d${d}: ${v.toFixed(3)}`);
  }
  return parts;
}

function pickPointOnTargetPlane(ev: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1,
  );
  clickPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmpVec).normalize(), controls.target);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.ray.intersectPlane(clickPlane, clickPoint);
  return hit ? clickPoint.clone() : controls.target.clone();
}

function handleHover(ev: PointerEvent) {
  if (!tooltipEl) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ev.clientX - rect.left;
  const my = ev.clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  let best = -1;
  let bestDist2 = Number.POSITIVE_INFINITY;
  const considerPoint = (px: number, py: number, pz: number, idx: number, instIdx: number) => {
    tmpVec.set(px, py, pz).project(camera);
    const sx = (tmpVec.x * 0.5 + 0.5) * w;
    const sy = (-tmpVec.y * 0.5 + 0.5) * h;
    const dx = sx - mx;
    const dy = sy - my;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist2) {
      bestDist2 = d2;
      best = idx;
      selectedHoverInst = instIdx;
    }
  };
  let selectedHoverInst = -1;
  if (baseVisible) {
    for (let i = 0; i < M; i++) {
      const pIdx = i * 3;
      considerPoint(rendererND.positions[pIdx], rendererND.positions[pIdx + 1], rendererND.positions[pIdx + 2], i, -1);
    }
  }
  extraInstances.forEach((inst, instIdx) => {
    if (!inst.visible) return;
    const pos = inst.renderer.positions;
    for (let i = 0; i < inst.M; i++) {
      const pIdx = i * 3;
      considerPoint(pos[pIdx], pos[pIdx + 1], pos[pIdx + 2], i, instIdx);
    }
  });
  const thresh2 = 30 * 30; // pixels^2
  if (best >= 0 && bestDist2 < thresh2) {
    const hoverData = selectedHoverInst >= 0 && extraInstances[selectedHoverInst]
      ? { coords: extraInstances[selectedHoverInst].X, count: extraInstances[selectedHoverInst].M }
      : { coords: X, count: M };
    const lines = formatCoords(N, hoverData.coords, hoverData.count, best);
    tooltipEl.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">v${best}</div><div>${lines.join('<br>')}</div>`;
    tooltipEl.style.left = `${ev.clientX}px`;
    tooltipEl.style.top = `${ev.clientY}px`;
    tooltipEl.classList.add('visible');
  } else {
    tooltipEl.classList.remove('visible');
  }

  // status bar when idle
  if (statusBar && transformOp.mode === 'none') {
    const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    statusBar.textContent = `Cursor NDC: (${ndcX.toFixed(3)}, ${ndcY.toFixed(3)})`;
  }
}
function resetToIsometric() {
  const targetN = 6;
  PARAMS.N = targetN;
  PARAMS.primitive = 'hypercube';
  PARAMS.projection = 'PCA';
  setAutoRotation(false);
  PARAMS.renderMode = 'faceted';
  PARAMS.sliceDim = -1;
  PARAMS.sliceMin = -0.5;
  PARAMS.sliceMax = 0.5;

  const rebuilt = buildPrimitive(PARAMS.primitive, targetN);
  const axisMap = canonicalAxisMap(targetN);
  const embedded = embedToMax(rebuilt.verts, targetN, axisMap);
  rebuildState(MAX_N, embedded, rebuilt.edges, 'primitive', targetN, axisMap);

  DEFAULT_PLANES.forEach((base, idx) => {
    const clone = clonePlane(base);
    clone.i = Math.min(clone.i, targetN - 1);
    clone.j = Math.min(clone.j, targetN - 1);
    Object.assign(planes[idx], clone, { _lastTheta: clone.theta });
  });

  controls.reset();
  camera.position.copy(DEFAULT_CAMERA_POSITION);
}
projectAndRenderAll();
applySliceFilter();
updateAxisLegend();
renderAxisList();
updateObjectList();
applySceneBackground(PARAMS.editMode);
updateDimensionControl();
updateEditModeToggle();
bindTextureControls();
updateTexturePanel();

if (viewToggle) {
  const btns = Array.from(viewToggle.querySelectorAll('button')) as HTMLButtonElement[];
  const isViewMode = (mode: string | undefined): mode is ViewMode => (
    VIEW_MODES.includes(mode as ViewMode)
  );
  const syncButtons = () => {
    btns.forEach(btn => btn.classList.toggle('active', (btn.dataset.mode === PARAMS.renderMode)));
  };
  setViewMode = (mode: ViewMode) => {
    PARAMS.renderMode = mode;
    rendererND.setMode(mode);
    rendererND.refreshSurface();
    extraInstances.forEach(inst => {
      inst.renderer.setMode(mode);
      inst.renderer.refreshSurface();
    });
    updateTexturePanel();
    syncButtons();
  };
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isViewMode(btn.dataset.mode)) setViewMode(btn.dataset.mode);
    });
  });
  syncButtons();
}

if (M === 0 && extraInstances.length === 0) {
  addInstanceAt(new THREE.Vector3(0, 0, 0), false);
  selectObject(0);
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleImport(file);
  });
}

importJsonButton?.addEventListener('click', () => fileInput?.click());
exportJsonButton?.addEventListener('click', () => exportProjectionJSON());
editModeToggle?.addEventListener('click', () => setEditMode(!PARAMS.editMode));
helpToggleButton?.addEventListener('click', ev => {
  ev.stopPropagation();
  setHelpOverlayOpen(true);
});
helpCloseButton?.addEventListener('click', () => setHelpOverlayOpen(false));
helpOverlay?.addEventListener('click', ev => {
  if (ev.target === helpOverlay) setHelpOverlayOpen(false);
});
mobileOnboardingOpenButton?.addEventListener('click', ev => {
  ev.preventDefault();
  setHelpOverlayOpen(false);
  openMobileOnboarding(0);
});
mobileOnboardingCloseButton?.addEventListener('click', () => closeMobileOnboarding(true));
mobileOnboardingSkipButton?.addEventListener('click', () => closeMobileOnboarding(true));
mobileOnboardingPrevButton?.addEventListener('click', () => setMobileOnboardingStep(mobileOnboardingStep - 1));
mobileOnboardingNextButton?.addEventListener('click', () => setMobileOnboardingStep(mobileOnboardingStep + 1));
mobileOnboardingFinishButton?.addEventListener('click', () => closeMobileOnboarding(true));
mobileOnboardingOverlay?.addEventListener('click', ev => {
  if (ev.target === mobileOnboardingOverlay) closeMobileOnboarding(true);
});
mobileOnboardingProgressButtons.forEach(button => {
  button.addEventListener('click', () => {
    const step = Number.parseInt(button.dataset.step ?? '', 10);
    if (Number.isNaN(step)) return;
    setMobileOnboardingStep(step);
  });
});
[
  { el: transformMoveButton, mode: 'move' as TransformMode },
  { el: transformRotateButton, mode: 'rotate' as TransformMode },
  { el: transformScaleButton, mode: 'scale' as TransformMode },
].forEach(entry => {
  entry.el?.addEventListener('pointerdown', ev => beginToolbarTransformDrag(entry.mode, ev));
});
dimensionDownButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N - 1));
dimensionUpButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N + 1));
dimensionControl?.addEventListener('keydown', ev => {
  ev.stopPropagation();
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' || ev.key === '-' || ev.key === '_') {
    ev.preventDefault();
    setNewPrimitiveDimension(PARAMS.N - 1);
  } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight' || ev.key === '+' || ev.key === '=') {
    ev.preventDefault();
    setNewPrimitiveDimension(PARAMS.N + 1);
  }
});

autoRotateToggle?.addEventListener('click', () => setAutoRotation(!PARAMS.autoSpin));
updateAutoRotateToggle();
updateTransformActionButtons();
syncPaneCollapsedToViewport(true);
setMobileOnboardingStep(0);
maybeOpenMobileOnboarding();

function applyTransformPointer(clientX: number, clientY: number) {
  if (transformOp.mode === 'none') return;

  const dx = clientX - transformOp.startMouse.x;
  const dy = clientY - transformOp.startMouse.y;
  if (transformOp.targetVertex >= 0) {
    const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
    const posArr = inst ? inst.renderer.positions : rendererND.positions;
    const idx = transformOp.targetVertex * 3;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    // plane always facing camera through start point to follow cursor
    transformOp.plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmpVec).normalize(), transformOp.planeHitStart);
    const hit = raycaster.ray.intersectPlane(transformOp.plane, tmpVec);
    if (!hit) return;
    const dragWorld = dragWorldTarget;
    if (transformOp.mode === 'move') {
      const locked = transformOp.lockAxis;
      dragWorld.set(
        locked === 1 || locked === 2 ? transformOp.vertexStart.x : hit.x,
        locked === 0 || locked === 2 ? transformOp.vertexStart.y : hit.y,
        locked === 0 || locked === 1 ? transformOp.vertexStart.z : hit.z,
      );
      transformOp.lastHit.copy(dragWorld);
    } else if (transformOp.mode === 'scale') {
      const fromOrigin = hit.clone().sub(transformOp.planeHitStart);
      const base = transformOp.vertexStart.clone().sub(transformOp.planeHitStart);
      const baseLen = base.length();
      const newLen = fromOrigin.length();
      const s = baseLen > 1e-6 ? newLen / baseLen : 1;
      const scaled = base.multiplyScalar(s).add(transformOp.planeHitStart);
      dragWorld.copy(scaled);
      transformOp.lastHit.copy(scaled);
    } else if (transformOp.mode === 'rotate') {
      const base = transformOp.vertexStart.clone().sub(transformOp.planeHitStart);
      const cur = hit.clone().sub(transformOp.planeHitStart);
      const angle = Math.atan2(cur.y, cur.x) - Math.atan2(base.y, base.x);
      const q = new THREE.Quaternion().setFromAxisAngle(transformOp.axis, angle);
      base.applyQuaternion(q).add(transformOp.planeHitStart);
      dragWorld.copy(base);
      transformOp.lastHit.copy(base);
    } else {
      return;
    }
    if (!setDraggedVertexFromWorldPosition(transformOp.instIdx, transformOp.targetVertex, dragWorld)) return;
    projectAndRenderAll();
    applySliceFilter();
    const refreshed = inst ? inst.renderer.positions : rendererND.positions;
    if (vertexMarker) vertexMarker.position.set(refreshed[idx], refreshed[idx + 1], refreshed[idx + 2]);
    if (statusBar) statusBar.textContent = `Vertex (${transformOp.targetVertex}): (${refreshed[idx].toFixed(3)}, ${refreshed[idx+1].toFixed(3)}, ${refreshed[idx+2].toFixed(3)})`;
  } else {
    const target = transformOp.instIdx === -1 ? baseTransform : extraInstances[transformOp.instIdx].transform;
    if (transformOp.mode === 'move') {
      const src = transformOp.instIdx === -1 ? X : extraInstances[transformOp.instIdx].X;
      const baseData = transformOp.objectDataStart;
      const count = transformOp.instIdx === -1 ? M : extraInstances[transformOp.instIdx].M;
      if (baseData && count > 0) {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.ray.intersectPlane(transformOp.plane, tmpVec);
        if (!hit) return;
        const delta = hit.clone().add(transformOp.moveOffset).sub(transformOp.planeHitStart);
        if (transformOp.lockAxis === 0) {
          delta.y = 0;
          delta.z = 0;
        } else if (transformOp.lockAxis === 1) {
          delta.x = 0;
          delta.z = 0;
        } else if (transformOp.lockAxis === 2) {
          delta.x = 0;
          delta.y = 0;
        }
        const axes = [PARAMS.axesX, PARAMS.axesY, PARAMS.axesZ];
        for (let i = 0; i < count; i++) {
          for (let c = 0; c < 3; c++) {
            const dim = axes[c] % N;
            const idxD = dim * count + i;
            src[idxD] = baseData[idxD] + delta.getComponent(c);
          }
        }
        transformOp.lastHit.copy(hit);
        projectionDirty = true;
      }
    } else if (transformOp.mode === 'rotate') {
      if (transformOp.wPlane && transformOp.objectDataStart) {
        const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
        const src = inst ? inst.X : X;
        const baseData = transformOp.objectDataStart;
        const count = inst ? inst.M : M;
        if (count > 0) {
          const originalN = inst ? inst.originalN : baseOriginalN || visibleDims();
          const axisMap = inst ? inst.axisMap : baseAxisMap;
          const dimB = perspectiveDepthDim(originalN, axisMap);
          const dimA = wRotationPlaneAxis(transformOp.lockAxis, dimB);
          if (dimA < 0 || dimB < 0 || dimA === dimB) return;
          const angle = (dx - dy) * 0.01;
          const c = Math.cos(angle), s = Math.sin(angle);
          for (let i = 0; i < count; i++) {
            const a0 = baseData[dimA * count + i];
            const b0 = baseData[dimB * count + i];
            src[dimA * count + i] = a0 * c - b0 * s;
            src[dimB * count + i] = a0 * s + b0 * c;
          }
          projectionDirty = true;
        }
      } else {
        const deltaX = dx * 0.005;
        const deltaY = dy * 0.005;
        const lx = transformOp.startRot.x;
        const ly = transformOp.startRot.y;
        const lz = transformOp.startRot.z;
        if (transformOp.lockAxis === 0) {
          target.rot.set(lx + deltaY, ly, lz);
        } else if (transformOp.lockAxis === 1) {
          target.rot.set(lx, ly + deltaX, lz);
        } else if (transformOp.lockAxis === 2) {
          target.rot.set(lx, ly, lz + deltaX);
        } else {
          target.rot.set(lx + deltaY, ly + deltaX, lz);
        }
      }
    } else if (transformOp.mode === 'scale') {
      const delta = (dx - dy) * 0.005;
      const s = Math.max(0.1, Math.min(5, transformOp.startScale + delta));
      target.scale.set(s, s, s);
    }
    if (statusBar) statusBar.textContent = `Object: pos(${target.pos.x.toFixed(3)}, ${target.pos.y.toFixed(3)}, ${target.pos.z.toFixed(3)}) rot(${target.rot.x.toFixed(3)}, ${target.rot.y.toFixed(3)}, ${target.rot.z.toFixed(3)})`;
  }
  projectAndRenderAll();
  applySliceFilter();
  updateSelectionOutline();
  updateAxisGuide();
}

function finishTransformInteraction(commit: boolean) {
  if (transformOp.mode === 'none') return;

  if (commit) {
    if (transformOp.targetVertex >= 0) {
      const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : rendererND.positions;
      const idx = transformOp.targetVertex * 3;
      dragWorldTarget.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
      setDraggedVertexFromWorldPosition(transformOp.instIdx, transformOp.targetVertex, dragWorldTarget);
    }
    if (statusBar) {
      if (transformOp.targetVertex >= 0) {
        const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
        const posArr = inst ? inst.renderer.positions : rendererND.positions;
        const idx = transformOp.targetVertex * 3;
        statusBar.textContent = `Vertex (${transformOp.targetVertex}) commit: (${posArr[idx].toFixed(3)}, ${posArr[idx+1].toFixed(3)}, ${posArr[idx+2].toFixed(3)})`;
      } else {
        const target = transformOp.instIdx === -1 ? baseTransform : extraInstances[transformOp.instIdx].transform;
        statusBar.textContent = `Object commit: pos(${target.pos.x.toFixed(3)}, ${target.pos.y.toFixed(3)}, ${target.pos.z.toFixed(3)})`;
      }
    }
  } else {
    if (transformOp.targetVertex >= 0) {
      const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : rendererND.positions;
      const idx = transformOp.targetVertex * 3;
      posArr[idx] = transformOp.vertexStart.x;
      posArr[idx + 1] = transformOp.vertexStart.y;
      posArr[idx + 2] = transformOp.vertexStart.z;
      const targetRenderer = inst ? inst.renderer : rendererND;
      if (transformOp.vertexDataStart) {
        const src = inst ? inst.X : X;
        const mcount = inst ? inst.M : M;
        for (let d = 0; d < N; d++) src[d * mcount + transformOp.targetVertex] = transformOp.vertexDataStart[d];
      }
      if (inst) {
        projector.project(inst.X, inst.M, inst.Y);
        inst.renderer.writeInterleavedFrom(inst.Y);
        inst.renderer.filterEdgesByDimRange(inst.X, N, inst.M, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
      } else {
        projector.project(X, M, Y);
        rendererND.writeInterleavedFrom(Y);
        rendererND.filterEdgesByDimRange(X, N, M, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
      }
      (targetRenderer.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      targetRenderer.geometry.computeBoundingBox();
      targetRenderer.geometry.computeBoundingSphere();
      if (vertexMarker) vertexMarker.position.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
    } else {
      const target = transformOp.instIdx === -1 ? baseTransform : extraInstances[transformOp.instIdx].transform;
      if (transformOp.objectDataStart) {
        const src = transformOp.instIdx === -1 ? X : extraInstances[transformOp.instIdx].X;
        src.set(transformOp.objectDataStart);
        projectionDirty = true;
      }
      target.pos.copy(transformOp.startPos);
      target.rot.copy(transformOp.startRot);
      target.scale.set(transformOp.startScale, transformOp.startScale, transformOp.startScale);
    }
  }

  transformOp.mode = 'none';
  transformOp.vertexDataStart = null;
  transformOp.lockAxis = -1;
  transformOp.objectDataStart = null;
  transformOp.wPlane = false;
  clearAxisGuide();
  transformOp.moveOffset.set(0, 0, 0);
  projectAndRenderAll();
  applySliceFilter();
  if (PARAMS.editMode && selectedVertex >= 0) placeVertexMarker(selectedInstance, selectedVertex);
  updateSelectionOutline();
  updateTransformActionButtons();
}

function beginToolbarTransformDrag(mode: TransformMode, ev: PointerEvent) {
  if (mode === 'none') return;
  if (transformOp.mode !== 'none') return;
  if (!getObjectVisible(selectedInstance)) return;

  ev.preventDefault();
  ev.stopPropagation();
  toolbarTransformDrag.active = true;
  toolbarTransformDrag.started = false;
  toolbarTransformDrag.pointerId = ev.pointerId;
  toolbarTransformDrag.mode = mode;
  toolbarTransformDrag.startX = ev.clientX;
  toolbarTransformDrag.startY = ev.clientY;
  toolbarTransformDrag.sourceButton = ev.currentTarget as HTMLButtonElement | null;
  try {
    toolbarTransformDrag.sourceButton?.setPointerCapture(ev.pointerId);
  } catch {
    // Some browsers may reject capture when pointerdown starts from nested SVG nodes.
  }
}

// --- Animation ---
const clock = new THREE.Clock();
renderer.domElement.addEventListener('pointermove', handleHover);
renderer.domElement.addEventListener('pointermove', (ev) => {
  lastPointer = { x: ev.clientX, y: ev.clientY };
  if (transformOp.mode === 'none') return;
  ev.preventDefault();
  applyTransformPointer(ev.clientX, ev.clientY);
});
renderer.domElement.addEventListener('pointerleave', () => tooltipEl?.classList.remove('visible'));
renderer.domElement.addEventListener('contextmenu', (ev) => {
  if (!ctxMenu) return;
  ev.preventDefault();
  lastPointer = { x: ev.clientX, y: ev.clientY };
  deletePending = false;
  ctxMenu.innerHTML = '';
  const spawnPoint = pickPointOnTargetPlane(ev);
  if (PARAMS.editMode) {
    if (selectedVertex < 0) return;
    const actions: { label: string; mode?: TransformMode }[] = [
      { label: 'Move vertex', mode: 'move' },
    ];
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.onclick = () => {
        ctxMenu.style.display = 'none';
        startTransform(action.mode! as TransformMode, ev);
      };
      ctxMenu.appendChild(btn);
    });
  } else {
    const hasSelection = (selectedInstance === BASE_SELECTION && M > 0) || selectedInstance >= 0;
    if (!hasSelection) {
      const opts: { label: string; kind: PrimitiveKind }[] = [
        { label: 'Hypercube', kind: 'hypercube' },
        { label: 'Cross polytope', kind: 'cross' },
        { label: 'Simplex', kind: 'simplex' },
        { label: 'Simplex prism', kind: 'simplexPrism' },
      ];
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = `Add ${opt.label}`;
        btn.onclick = () => {
          ctxMenu.style.display = 'none';
          pushUndoSnapshot();
          const data = buildPrimitive(opt.kind, PARAMS.N);
          const axisMap = currentAxisMap(PARAMS.N);
          const embedded = embedToMax(data.verts, PARAMS.N, axisMap);
          const instRenderer = new HypercubeRenderer(scene);
          instRenderer.build(data.V, data.edges);
          tmpOffset.copy(spawnPoint);
          const Yloc = new Float32Array(3 * data.V);
          const label = `${opt.label} #${extraInstances.length + 1}`;
          const t = { pos: tmpOffset.clone(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
          const surface = cloneSurface(DEFAULT_SURFACE);
          instRenderer.setSurface(surface);
          extraInstances.push({ renderer: instRenderer, Y: Yloc, X: embedded, E: data.edges, M: data.V, offset: tmpOffset.clone(), label, kind: opt.kind, transform: t, originalN: PARAMS.N, axisMap, visible: true, surface });
          projector.project(embedded, data.V, Yloc);
          instRenderer.setTransform(t.pos, new THREE.Euler(t.rot.x, t.rot.y, t.rot.z), t.scale);
          instRenderer.writeInterleavedFrom(Yloc);
          instRenderer.filterEdgesByDimRange(embedded, MAX_N, data.V, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
          instRenderer.setMode(PARAMS.renderMode);
          projectAndRenderAll();
          applySliceFilter();
          if (setViewMode) setViewMode(PARAMS.renderMode);
          updateObjectList();
        };
        ctxMenu.appendChild(btn);
      });
    } else {
      const actions: { label: string; mode?: TransformMode; onClick?: () => void }[] = [
        { label: 'Move', mode: 'move' },
        { label: 'Rotate', mode: 'rotate' },
        { label: 'Scale', mode: 'scale' },
        { label: 'Delete', onClick: () => showDeleteConfirm(ev) },
      ];
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.textContent = action.label;
        btn.onclick = () => {
          ctxMenu.style.display = 'none';
          if (action.onClick) { action.onClick(); return; }
          startTransform(action.mode! as TransformMode, ev);
        };
        ctxMenu.appendChild(btn);
      });
    }
  }
  const x = Math.min(ev.clientX, window.innerWidth - 180);
  const y = Math.min(ev.clientY, window.innerHeight - 150);
  ctxMenu.style.left = `${x}px`;
  ctxMenu.style.top = `${y}px`;
  ctxMenu.style.display = ctxMenu.innerHTML ? 'block' : 'none';
});
window.addEventListener('click', () => {
  if (deletePending) return;
  if (ctxMenu) ctxMenu.style.display = 'none';
  deletePending = false;
});
renderer.domElement.addEventListener('wheel', (ev) => {
  if (!PARAMS.editMode) return;
  ev.preventDefault();
  const dir = ev.deltaY > 0 ? 1 : -1;
  let v = PARAMS.sliceDim + dir;
  v = Math.max(-1, Math.min(N - 1, v));
  PARAMS.sliceDim = v;
  applySliceFilter();
});
renderer.domElement.addEventListener('mousedown', (ev) => {
  if (ev.button === 1) {
    ev.preventDefault();
    ev.stopPropagation();
    axisDrag.active = true;
    axisDrag.lastX = ev.clientX;
    axisDrag.accum = 0;
    axisDrag.prevZoom = controls.enableZoom;
    axisDrag.prevPan = controls.enablePan;
    controls.enableZoom = false;
    controls.enablePan = false;
    return;
  }
}, { capture: true });
renderer.domElement.addEventListener('pointerdown', (ev) => {
  if (axisDrag.active) return;
  lastPointer = { x: ev.clientX, y: ev.clientY };
  if (transformOp.mode !== 'none') {
    if (ev.button === 0) {
      pushUndoSnapshot();
      finishTransformInteraction(true);
    } else if (ev.button === 2) {
      finishTransformInteraction(false);
    }
    ev.preventDefault();
    return;
  }
  if (ev.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ev.clientX - rect.left;
  const my = ev.clientY - rect.top;
  const w = rect.width;
  const h = rect.height;

  const screenBounds = (positions: Float32Array, count: number) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
      const pIdx = i * 3;
      tmpVec.set(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]).project(camera);
      const sx = (tmpVec.x * 0.5 + 0.5) * w;
      const sy = (-tmpVec.y * 0.5 + 0.5) * h;
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    }
    return { minX, maxX, minY, maxY };
  };

  const candidates: { instIdx: number; contains: boolean; area: number; nearestDist2: number; }[] = [];

  if (M > 0) {
    const box = screenBounds(rendererND.positions, M);
    const contains = mx >= box.minX && mx <= box.maxX && my >= box.minY && my <= box.maxY;
    const area = (box.maxX - box.minX) * (box.maxY - box.minY);
    candidates.push({ instIdx: -1, contains, area, nearestDist2: Number.POSITIVE_INFINITY });
  }
  extraInstances.forEach((inst, idx) => {
    if (!inst.visible) return;
    const box = screenBounds(inst.renderer.positions, inst.M);
    const contains = mx >= box.minX && mx <= box.maxX && my >= box.minY && my <= box.maxY;
    const area = (box.maxX - box.minX) * (box.maxY - box.minY);
    candidates.push({ instIdx: idx, contains, area, nearestDist2: Number.POSITIVE_INFINITY });
  });

  let bestInst = -1;
  // Prefer objects whose screen bbox contains the click; pick the smallest area
  const containing = candidates.filter(c => c.contains && isFinite(c.area));
  if (containing.length) {
    containing.sort((a, b) => a.area - b.area);
    bestInst = containing[0].instIdx;
  } else {
    // fallback to nearest vertex
    let bestDist2 = Number.POSITIVE_INFINITY;
    const consider = (px: number, py: number, pz: number, instIdx: number) => {
      tmpVec.set(px, py, pz).project(camera);
      const sx = (tmpVec.x * 0.5 + 0.5) * w;
      const sy = (-tmpVec.y * 0.5 + 0.5) * h;
      const dx = sx - mx;
      const dy = sy - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestInst = instIdx;
      }
    };
    if (baseVisible) {
      for (let i = 0; i < M; i++) {
        const pIdx = i * 3;
        consider(rendererND.positions[pIdx], rendererND.positions[pIdx + 1], rendererND.positions[pIdx + 2], -1);
      }
    }
    extraInstances.forEach((inst, idx) => {
      if (!inst.visible) return;
      const pos = inst.renderer.positions;
      for (let i = 0; i < inst.M; i++) {
        const pIdx = i * 3;
        consider(pos[pIdx], pos[pIdx + 1], pos[pIdx + 2], idx);
      }
    });
    const thresh = 35 * 35;
    if (bestDist2 >= thresh) bestInst = -999; // none
  }

  if (bestInst !== -999) {
    selectObject(bestInst);
    if (PARAMS.editMode && ev.button === 0) {
      const targetRenderer = bestInst === -1 ? rendererND : extraInstances[bestInst].renderer;
      const posArr = targetRenderer.positions;
      let nearest = -1, nearestD2 = Number.POSITIVE_INFINITY;
      const count = bestInst === -1 ? M : extraInstances[bestInst].M;
      for (let i = 0; i < count; i++) {
        const pIdx = i * 3;
        tmpVec.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]).project(camera);
        const sx = (tmpVec.x * 0.5 + 0.5) * w;
        const sy = (-tmpVec.y * 0.5 + 0.5) * h;
        const dx = sx - mx, dy = sy - my;
        const d2 = dx*dx + dy*dy;
        if (d2 < nearestD2) { nearestD2 = d2; nearest = i; }
      }
      selectedVertex = nearest;
      placeVertexMarker(bestInst, nearest);
    }
  } else {
    // click on empty space: clear selections
    selectObject(NO_SELECTION);
    selectedVertex = -1;
    if (vertexMarker) { scene.remove(vertexMarker); vertexMarker = null; }
    if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
  }
});

window.addEventListener('pointermove', (ev) => {
  if (toolbarTransformDrag.active && ev.pointerId === toolbarTransformDrag.pointerId) {
    ev.preventDefault();
    lastPointer = { x: ev.clientX, y: ev.clientY };
    if (!toolbarTransformDrag.started) {
      const moved = Math.hypot(ev.clientX - toolbarTransformDrag.startX, ev.clientY - toolbarTransformDrag.startY);
      if (moved < 3) return;
      pushUndoSnapshot();
      startTransform(toolbarTransformDrag.mode, new PointerEvent('pointerdown', { clientX: ev.clientX, clientY: ev.clientY }));
      toolbarTransformDrag.started = transformOp.mode !== 'none';
      if (!toolbarTransformDrag.started) {
        toolbarTransformDrag.active = false;
        toolbarTransformDrag.pointerId = -1;
        toolbarTransformDrag.mode = 'none';
        return;
      }
      updateTransformActionButtons();
    }
    applyTransformPointer(ev.clientX, ev.clientY);
    return;
  }
  if (!axisDrag.active) return;
  if ((ev.buttons & 4) === 0) {
    endAxisShiftDrag();
    return;
  }
  ev.preventDefault();
  const dx = ev.clientX - axisDrag.lastX;
  axisDrag.lastX = ev.clientX;
  axisDrag.accum += dx;
  const threshold = 35;
  let steps = 0;
  while (axisDrag.accum > threshold) { steps++; axisDrag.accum -= threshold; }
  while (axisDrag.accum < -threshold) { steps--; axisDrag.accum += threshold; }
  if (steps !== 0) cycleAxes(steps);
});

window.addEventListener('pointerup', (ev) => {
  if (toolbarTransformDrag.active && ev.pointerId === toolbarTransformDrag.pointerId) {
    if (toolbarTransformDrag.sourceButton?.hasPointerCapture(ev.pointerId)) {
      toolbarTransformDrag.sourceButton.releasePointerCapture(ev.pointerId);
    }
    const shouldCommit = toolbarTransformDrag.started && transformOp.mode !== 'none';
    if (shouldCommit) finishTransformInteraction(true);
    toolbarTransformDrag.active = false;
    toolbarTransformDrag.started = false;
    toolbarTransformDrag.pointerId = -1;
    toolbarTransformDrag.mode = 'none';
    toolbarTransformDrag.sourceButton = null;
    ev.preventDefault();
    return;
  }
  if (axisDrag.active) {
    endAxisShiftDrag();
  }
});

window.addEventListener('pointercancel', (ev) => {
  if (toolbarTransformDrag.active && ev.pointerId === toolbarTransformDrag.pointerId) {
    if (toolbarTransformDrag.sourceButton?.hasPointerCapture(ev.pointerId)) {
      toolbarTransformDrag.sourceButton.releasePointerCapture(ev.pointerId);
    }
    const shouldCancel = toolbarTransformDrag.started && transformOp.mode !== 'none';
    if (shouldCancel) finishTransformInteraction(false);
    toolbarTransformDrag.active = false;
    toolbarTransformDrag.started = false;
    toolbarTransformDrag.pointerId = -1;
    toolbarTransformDrag.mode = 'none';
    toolbarTransformDrag.sourceButton = null;
  }
  if (axisDrag.active) {
    endAxisShiftDrag();
  }
});
window.addEventListener('blur', () => {
  if (axisDrag.active) endAxisShiftDrag();
});

window.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (isMobileOnboardingOpen()) {
    ev.preventDefault();
    closeMobileOnboarding(true);
    return;
  }
  if (!isHelpOverlayOpen()) return;
  ev.preventDefault();
  setHelpOverlayOpen(false);
});

window.addEventListener('keydown', (ev) => {
  if (isModalUIOpen()) return;
  const key = ev.key.toLowerCase();
  const hasMod = ev.ctrlKey || ev.metaKey;
  if (!hasMod) return;
  const wantsUndo = key === 'z' && !ev.shiftKey;
  const wantsRedo = key === 'y' || (key === 'z' && ev.shiftKey);
  if (!wantsUndo && !wantsRedo) return;
  if (isPlainTextEditTarget(ev.target)) return;
  if (transformOp.mode !== 'none') return;

  ev.preventDefault();
  if (wantsUndo) {
    const snap = undoStack.pop();
    if (snap) {
      redoStack.push(captureSnapshot());
      applySnapshot(snap);
    }
  } else if (wantsRedo) {
    const snap = redoStack.pop();
    if (snap) {
      undoStack.push(captureSnapshot());
      applySnapshot(snap);
    }
  }
});

window.addEventListener('keydown', (ev) => {
  if (isModalUIOpen()) return;
  if (isTextEntryTarget(ev.target)) return;
  if (transformOp.mode === 'none') return;
  const key = ev.key.toLowerCase();
  if (key === 'w') {
    if (transformOp.mode === 'rotate') {
      ev.preventDefault();
      transformOp.wPlane = !transformOp.wPlane;
      updateAxisGuide();
    }
    return;
  }
  if (key === 'x' || key === 'y' || key === 'z') {
    transformOp.lockAxis = key === 'x' ? 0 : key === 'y' ? 1 : 2;
    updateAxisGuide();
  }
});

window.addEventListener('keydown', (ev) => {
  if (isModalUIOpen()) return;
  if (isTextEntryTarget(ev.target)) return;
  if (ev.key === 'Tab') {
    ev.preventDefault();
    setEditMode(!PARAMS.editMode);
  }
  // Transform hotkeys
  if (transformOp.mode === 'none') {
    if (ev.key === 'g' || ev.key === 'r' || ev.key === 's') {
      ev.preventDefault();
      const modeMap: Record<string, TransformMode> = { g: 'move', r: 'rotate', s: 'scale' };
      const fakeEvent = new PointerEvent('pointerdown', { clientX: lastPointer.x, clientY: lastPointer.y });
      startTransform(modeMap[ev.key], fakeEvent);
    } else if (ev.key.toLowerCase() === 'a' && ev.shiftKey) {
      ev.preventDefault();
      // open add-object menu at last pointer position
      if (!ctxMenu) return;
      ctxMenu.innerHTML = '';
      const opts: { label: string; kind: PrimitiveKind }[] = [
        { label: 'Hypercube', kind: 'hypercube' },
        { label: 'Cross polytope', kind: 'cross' },
        { label: 'Simplex', kind: 'simplex' },
        { label: 'Simplex prism', kind: 'simplexPrism' },
      ];
      const spawnPoint = pickPointOnTargetPlane(new PointerEvent('pointerdown', { clientX: lastPointer.x, clientY: lastPointer.y }));
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = `Add ${opt.label}`;
        btn.onclick = () => {
          ctxMenu.style.display = 'none';
          pushUndoSnapshot();
          const data = buildPrimitive(opt.kind, PARAMS.N);
          const axisMap = currentAxisMap(PARAMS.N);
          const embedded = embedToMax(data.verts, PARAMS.N, axisMap);
          const instRenderer = new HypercubeRenderer(scene);
          instRenderer.build(data.V, data.edges);
          tmpOffset.copy(spawnPoint);
          const Yloc = new Float32Array(3 * data.V);
          const label = `${opt.label} #${extraInstances.length + 1}`;
          const t = { pos: tmpOffset.clone(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
          const surface = cloneSurface(DEFAULT_SURFACE);
          instRenderer.setSurface(surface);
          extraInstances.push({ renderer: instRenderer, Y: Yloc, X: embedded, E: data.edges, M: data.V, offset: tmpOffset.clone(), label, kind: opt.kind, transform: t, originalN: PARAMS.N, axisMap, visible: true, surface });
          projector.project(embedded, data.V, Yloc);
          instRenderer.setTransform(t.pos, new THREE.Euler(t.rot.x, t.rot.y, t.rot.z), t.scale);
          instRenderer.writeInterleavedFrom(Yloc);
          instRenderer.filterEdgesByDimRange(embedded, MAX_N, data.V, PARAMS.sliceDim, PARAMS.sliceMin, PARAMS.sliceMax);
          instRenderer.setMode(PARAMS.renderMode);
          projectAndRenderAll();
          applySliceFilter();
          updateObjectList();
        };
        ctxMenu.appendChild(btn);
      });
      ctxMenu.style.left = `${lastPointer.x}px`;
      ctxMenu.style.top = `${lastPointer.y}px`;
      ctxMenu.style.display = 'block';
    } else if (ev.key === 'x') {
      ev.preventDefault();
      const hasSel = (selectedInstance === BASE_SELECTION && M > 0) || selectedInstance >= 0;
      if (!hasSel) return;
      if (deletePending) {
        deletePending = false;
        if (ctxMenu) ctxMenu.style.display = 'none';
        deleteSelected();
      } else {
        showDeleteConfirm();
      }
    }
  }
});

// vertex drag disabled; edit mode uses transform menu

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  applyAutoRotation(dt);

  projectAndRenderAll();

  controls.update();
  updateTransformActionButtons();
  updateAxisGizmo();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function startTransform(mode: TransformMode, ev: PointerEvent) {
  if (!getObjectVisible(selectedInstance)) return;
  transformOp.mode = mode;
  transformOp.instIdx = selectedInstance;
  transformOp.targetVertex = PARAMS.editMode ? selectedVertex : -1;
  transformOp.startMouse.set(ev.clientX, ev.clientY);
  if (transformOp.targetVertex >= 0) {
    if (transformOp.targetVertex < 0) { transformOp.mode = 'none'; return; }
    const inst = transformOp.instIdx === -1 ? null : extraInstances[transformOp.instIdx];
    const posArr = inst ? inst.renderer.positions : rendererND.positions;
    const idx = transformOp.targetVertex * 3;
    transformOp.vertexStart.set(posArr[idx], posArr[idx+1], posArr[idx+2]);
    const src = inst ? inst.X : X;
    transformOp.vertexDataStart = new Float32Array(N);
    for (let d = 0; d < N; d++) transformOp.vertexDataStart[d] = src[d * (inst ? inst.M : M) + transformOp.targetVertex];
    transformOp.startScale = 1;
    transformOp.plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmpVec).normalize(), transformOp.vertexStart);
    transformOp.planeHitStart.copy(transformOp.vertexStart);
    transformOp.lastHit.copy(transformOp.vertexStart);
    transformOp.lockAxis = -1;
    transformOp.wPlane = false;
  } else {
    const target = selectedInstance === BASE_SELECTION ? baseTransform : extraInstances[selectedInstance]?.transform;
    if (!target) return;
    transformOp.startPos.copy(target.pos);
    transformOp.startRot.copy(target.rot);
    transformOp.startScale = target.scale.x;
    transformOp.lockAxis = -1;
    transformOp.wPlane = false;
    if (mode === 'move' || mode === 'rotate') {
      const src = selectedInstance === BASE_SELECTION ? X : extraInstances[selectedInstance].X;
      const count = selectedInstance === BASE_SELECTION ? M : extraInstances[selectedInstance].M;
      transformOp.objectDataStart = new Float32Array(src.length);
      transformOp.objectDataStart.set(src);
      transformOp.lastHit.set(0,0,0);
      if (mode === 'move') {
        const positions = selectedInstance === BASE_SELECTION ? rendererND.positions : extraInstances[selectedInstance].renderer.positions;
        const ctr = computeCenterFromPositions(positions, count);
        transformOp.planeHitStart.copy(ctr);
        transformOp.plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmpVec).normalize(), ctr);
        // compute initial cursor offset so movement stays relative to click
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.ray.intersectPlane(transformOp.plane, tmpVec);
        if (hit) {
          transformOp.lastHit.copy(hit);
          transformOp.moveOffset.copy(transformOp.planeHitStart).sub(hit);
        } else {
          transformOp.lastHit.copy(ctr);
          transformOp.moveOffset.set(0,0,0);
        }
      }
    } else {
      transformOp.objectDataStart = null;
    }
  }
}

// --- Resize ---
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  syncPaneCollapsedToViewport();
  updateTexturePanel();
});

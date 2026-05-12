import * as THREE from 'three';
import { MAX_N, VIEW_MODES, type ViewMode } from '../constants';
import type { PrimitiveKind, PrimitiveSurfaceTopology } from '../geometry/primitives';
import { normalizeAntialiasMode, type AnimationKeyframeState, type AnimationTimelineState, type RenderQuality } from '../animation/KeyframeTimelineController';
import { DEFAULT_SURFACE, normalizeSurface, type SurfaceState } from './surface';
import { packF32, packU32, unpackF32, unpackU32 } from './sceneUrlState';
import { packCellTopologyForUrl, packSurfaceTopology, unpackCellTopology, unpackSurfaceTopology, type PackedCellTopology, type PackedTopology } from './topologyState';
import { normalizeSceneLightState } from './sceneLightRuntime';
import type { BackgroundUrlState } from '../background/BackgroundController';
import type { ExtraAxisGizmoState } from '../ui/ExtraAxisGizmoController';
import type { DataSource, InstanceSnapshot, SceneLightKind, SceneLightState, SceneMaterialState, SceneSnapshot, TransformState } from './types';

export type PrimitiveMode = PrimitiveKind;
export type PackedVec3 = [number, number, number];
export type PackedTransform = [
  number, number, number,
  number, number, number,
  number, number, number,
];
export type PackedCamera = [
  number, number, number,
  number, number, number,
  number, number, number,
  number, number,
];
export type PackedSurface = [
  0 | 1,
  number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number,
];
export type PackedSceneMaterial = [string, string, PackedSurface];
export type PackedBackgroundState = [string, string, number, number, number, (0 | 1)?];
export type PackedSceneLight = [0 | 1, string, string, number, number, PackedVec3, PackedVec3, 0 | 1, 0 | 1];
export type PackedAnimationSettings = [number, number, number, number, number];
export type PackedAnimationKeyframeState = {
  d: number;
  r: string;
  o: number[];
  f: number;
  m: ViewMode;
  b: number;
  mb: number;
  ch?: number;
  cs?: number;
  cb?: number;
  cc?: number;
  gi?: number;
  aa?: 0 | 1;
  c: PackedCamera;
  li?: PackedSceneLight[];
};
export type PackedAnimationTimelineState = {
  s: PackedAnimationSettings;
  c: number;
  p: 0 | 1;
  fv: 0 | 1;
  k: Array<[number, PackedAnimationKeyframeState]>;
};
export type PackedInstanceState = {
  x: string;
  e: string;
  ct?: PackedCellTopology;
  st?: PackedTopology;
  m: number;
  o: PackedVec3;
  l: string;
  k: PrimitiveMode;
  t: PackedTransform;
  g: string;
  n: number;
  a: number[];
  v: 0 | 1;
  mi?: string;
  s: PackedSurface;
};
export type PackedSceneUrlState = {
  v: 1;
  sn?: string;
  n: number;
  x: string;
  e: string;
  ct?: PackedCellTopology;
  st?: PackedTopology;
  m: number;
  ds: DataSource;
  l: string;
  pn: number;
  pk: PrimitiveMode;
  rm: ViewMode;
  em: 0 | 1;
  fx: [number, number, number, number, number, number, number, 0 | 1];
  r: string;
  ax: [number, number, number];
  ao: number[];
  of: number;
  bam: number[];
  bt: PackedTransform;
  bo: string;
  bn: number;
  bv: 0 | 1;
  ma?: PackedSceneMaterial[];
  bm?: string;
  bs: PackedSurface;
  si: number;
  ss: number[];
  sv: number;
  es?: [number, number[]];
  i: PackedInstanceState[];
  c: PackedCamera;
  bg: PackedBackgroundState;
  li?: PackedSceneLight[];
  tl?: PackedAnimationTimelineState;
  pc: 0 | 1;
  ag?: ExtraAxisGizmoState;
};

export type SceneCodecDefaults = {
  defaultCameraPosition: THREE.Vector3;
  worldUp: THREE.Vector3;
  createMaterialId: () => string;
  createSceneLightId: () => string;
  noSelection: number;
  bloomIntensity: number;
  motionBlurIntensity: number;
  colorHue: number;
  colorSaturation: number;
  colorBrightness: number;
  colorContrast: number;
  grainIntensity: number;
};

export function cloneTransformState(transform: TransformState): TransformState {
  return {
    pos: transform.pos.clone(),
    rot: transform.rot.clone(),
    scale: transform.scale.clone(),
  };
}

export function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function finiteInteger(value: unknown, fallback = 0) {
  return Math.round(finiteNumber(value, fallback));
}

export function colorToHex(color: number) {
  return `#${Math.max(0, Math.min(0xffffff, color >>> 0)).toString(16).padStart(6, '0')}`;
}

export function colorFromInput(value: string | undefined, fallback = 0xffffff) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value.replace('#', ''), 16);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(0xffffff, parsed >>> 0)) : fallback;
}

export function normalizedAxisDim(value: unknown, fallback = 0) {
  return Math.max(0, Math.min(MAX_N - 1, finiteInteger(value, fallback)));
}

export function normalizeViewMode(mode: unknown): ViewMode {
  return VIEW_MODES.includes(mode as ViewMode) ? mode as ViewMode : 'solid';
}

export function packVec3(vec: THREE.Vector3): PackedVec3 {
  return [vec.x, vec.y, vec.z];
}

export function unpackVec3(values: ArrayLike<unknown> | undefined, fallback = new THREE.Vector3()) {
  return new THREE.Vector3(
    finiteNumber(values?.[0], fallback.x),
    finiteNumber(values?.[1], fallback.y),
    finiteNumber(values?.[2], fallback.z),
  );
}

export function packTransformState(transform: TransformState): PackedTransform {
  return [
    transform.pos.x, transform.pos.y, transform.pos.z,
    transform.rot.x, transform.rot.y, transform.rot.z,
    transform.scale.x, transform.scale.y, transform.scale.z,
  ];
}

export function unpackTransformState(values: ArrayLike<unknown> | undefined): TransformState {
  return {
    pos: unpackVec3(values),
    rot: unpackVec3(values ? [values[3], values[4], values[5]] : undefined),
    scale: unpackVec3(values ? [values[6], values[7], values[8]] : undefined, new THREE.Vector3(1, 1, 1)),
  };
}

export function packSurfaceState(surface: SurfaceState): PackedSurface {
  return [
    surface.materialType === 'glass' ? 1 : 0,
    surface.color,
    surface.metalness,
    surface.roughness,
    surface.alpha,
    surface.transmission,
    surface.ior,
    surface.thickness,
    surface.attenuationDistance,
    surface.attenuationColor,
    surface.clearcoat,
    surface.clearcoatRoughness,
    surface.specularIntensity,
    surface.emissiveColor,
    surface.emissiveIntensity,
  ];
}

export function unpackSurfaceState(surface: ArrayLike<unknown> | undefined) {
  return normalizeSurface({
    materialType: surface?.[0] === 1 ? 'glass' : 'standard',
    color: finiteInteger(surface?.[1], DEFAULT_SURFACE.color),
    metalness: finiteNumber(surface?.[2], DEFAULT_SURFACE.metalness),
    roughness: finiteNumber(surface?.[3], DEFAULT_SURFACE.roughness),
    alpha: finiteNumber(surface?.[4], DEFAULT_SURFACE.alpha),
    transmission: finiteNumber(surface?.[5], DEFAULT_SURFACE.transmission),
    ior: finiteNumber(surface?.[6], DEFAULT_SURFACE.ior),
    thickness: finiteNumber(surface?.[7], DEFAULT_SURFACE.thickness),
    attenuationDistance: finiteNumber(surface?.[8], DEFAULT_SURFACE.attenuationDistance),
    attenuationColor: finiteInteger(surface?.[9], DEFAULT_SURFACE.attenuationColor),
    clearcoat: finiteNumber(surface?.[10], DEFAULT_SURFACE.clearcoat),
    clearcoatRoughness: finiteNumber(surface?.[11], DEFAULT_SURFACE.clearcoatRoughness),
    specularIntensity: finiteNumber(surface?.[12], DEFAULT_SURFACE.specularIntensity),
    emissiveColor: finiteInteger(surface?.[13], DEFAULT_SURFACE.emissiveColor),
    emissiveIntensity: finiteNumber(surface?.[14], DEFAULT_SURFACE.emissiveIntensity),
  });
}

export function packMaterialState(material: SceneMaterialState): PackedSceneMaterial {
  return [material.id, material.name, packSurfaceState(normalizeSurface(material.surface))];
}

export function unpackMaterialState(
  material: PackedSceneMaterial | undefined,
  fallbackIndex: number,
  createMaterialId: () => string,
): SceneMaterialState | null {
  if (!Array.isArray(material)) return null;
  const id = typeof material[0] === 'string' && material[0].trim() ? material[0].trim() : createMaterialId();
  const name = typeof material[1] === 'string' && material[1].trim() ? material[1].trim() : `Material ${fallbackIndex + 1}`;
  return {
    id,
    name,
    surface: unpackSurfaceState(material[2]),
  };
}

export function packBackgroundState(state: BackgroundUrlState): PackedBackgroundState {
  return [state.key, state.quality, state.blur, state.lightness, state.color, state.environmentLighting ? 1 : 0];
}

export function unpackBackgroundState(state: PackedBackgroundState | undefined): BackgroundUrlState | undefined {
  if (!state) return undefined;
  return {
    key: typeof state[0] === 'string' ? state[0] : 'ferndale',
    quality: state[1] === 'hd' ? 'hd' : 'sd',
    blur: finiteNumber(state[2], 0),
    lightness: finiteNumber(state[3], 0.15),
    color: finiteInteger(state[4], 0x10141a),
    environmentLighting: state[5] === 1,
  };
}

export function packSceneLightState(lightState: SceneLightState): PackedSceneLight {
  return [
    lightState.kind === 'directional' ? 1 : 0,
    lightState.id,
    lightState.label,
    lightState.color,
    lightState.intensity,
    [lightState.position.x, lightState.position.y, lightState.position.z],
    [lightState.target.x, lightState.target.y, lightState.target.z],
    lightState.visible ? 1 : 0,
    lightState.castShadow ? 1 : 0,
  ];
}

export function unpackSceneLightState(
  state: PackedSceneLight | undefined,
  fallbackIndex: number,
  createSceneLightId: () => string,
): SceneLightState | null {
  if (!Array.isArray(state)) return null;
  const kind: SceneLightKind = state[0] === 1 ? 'directional' : 'point';
  const raw = state as unknown[];
  const hasPackedTarget = Array.isArray(raw[6]);
  const visibleFlag = hasPackedTarget ? raw[7] : raw[6];
  const shadowFlag = hasPackedTarget ? raw[8] : raw[7];
  return normalizeSceneLightState({
    id: typeof state[1] === 'string' && state[1].trim() ? state[1].trim() : createSceneLightId(),
    kind,
    label: typeof state[2] === 'string' && state[2].trim()
      ? state[2].trim()
      : `${kind === 'point' ? 'Point' : 'Directional'} light ${fallbackIndex + 1}`,
    color: finiteInteger(state[3], 0xffffff),
    intensity: finiteNumber(state[4], kind === 'point' ? 3 : 1),
    position: unpackVec3(state[5], kind === 'point' ? new THREE.Vector3(1.8, 1.8, 1.8) : new THREE.Vector3(2, 3, 4)),
    target: hasPackedTarget ? unpackVec3(raw[6] as PackedVec3, new THREE.Vector3()) : new THREE.Vector3(),
    visible: visibleFlag !== 0,
    castShadow: shadowFlag === 1,
  }, createSceneLightId);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clampSigned01(value: number) {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function packAnimationKeyframeState(state: AnimationKeyframeState): PackedAnimationKeyframeState {
  const packed: PackedAnimationKeyframeState = {
    d: state.dimension,
    r: packF32(state.rotMatrix),
    o: [...state.axesOrder],
    f: state.axesOffset,
    m: state.renderMode,
    b: state.bloomIntensity,
    mb: state.motionBlurIntensity,
    ch: state.colorHue,
    cs: state.colorSaturation,
    cb: state.colorBrightness,
    cc: state.colorContrast,
    gi: state.grainIntensity,
    aa: state.antialiasMode === 'smaa' ? 1 : 0,
    c: [
      state.cameraPosition.x, state.cameraPosition.y, state.cameraPosition.z,
      state.cameraTarget.x, state.cameraTarget.y, state.cameraTarget.z,
      state.cameraUp.x, state.cameraUp.y, state.cameraUp.z,
      state.cameraFov, state.cameraZoom,
    ],
  };
  if (state.lights) packed.li = state.lights.map(lightState => packSceneLightState(lightState));
  return packed;
}

export function unpackAnimationKeyframeState(
  state: PackedAnimationKeyframeState,
  defaults: SceneCodecDefaults,
): AnimationKeyframeState {
  return {
    dimension: Math.max(3, Math.min(MAX_N, finiteInteger(state.d, MAX_N))),
    rotMatrix: unpackF32(state.r),
    axesOrder: Array.isArray(state.o) ? state.o.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    axesOffset: finiteInteger(state.f, 0),
    renderMode: normalizeViewMode(state.m),
    bloomIntensity: clamp01(finiteNumber(state.b, defaults.bloomIntensity)),
    motionBlurIntensity: clamp01(finiteNumber(state.mb, defaults.motionBlurIntensity)),
    colorHue: clampSigned01(finiteNumber(state.ch, defaults.colorHue)),
    colorSaturation: clampSigned01(finiteNumber(state.cs, defaults.colorSaturation)),
    colorBrightness: clampSigned01(finiteNumber(state.cb, defaults.colorBrightness)),
    colorContrast: clampSigned01(finiteNumber(state.cc, defaults.colorContrast)),
    grainIntensity: clamp01(finiteNumber(state.gi, defaults.grainIntensity)),
    antialiasMode: normalizeAntialiasMode(state.aa === 1 ? 'smaa' : 'off'),
    cameraPosition: unpackVec3(state.c, defaults.defaultCameraPosition),
    cameraTarget: unpackVec3([state.c[3], state.c[4], state.c[5]], new THREE.Vector3()),
    cameraUp: unpackVec3([state.c[6], state.c[7], state.c[8]], defaults.worldUp).normalize(),
    cameraFov: Math.max(1, Math.min(179, finiteNumber(state.c[9], 50))),
    cameraZoom: Math.max(0.01, Math.min(100, finiteNumber(state.c[10], 1))),
    lights: Array.isArray(state.li)
      ? state.li.map((lightState, idx) => unpackSceneLightState(lightState, idx, defaults.createSceneLightId)).filter((lightState): lightState is SceneLightState => !!lightState)
      : undefined,
  };
}

export function packRenderQuality(quality: RenderQuality) {
  switch (quality) {
    case 'low': return 0;
    case 'high': return 2;
    case 'medium': return 3;
    case 'full':
    default: return 1;
  }
}

export function unpackRenderQuality(value: unknown): RenderQuality {
  if (value === 0) return 'low';
  if (value === 2) return 'high';
  if (value === 3) return 'medium';
  return 'full';
}

export function packTimelineState(state: AnimationTimelineState): PackedAnimationTimelineState {
  return {
    s: [
      state.settings.fps,
      state.settings.frameCount,
      packRenderQuality(state.settings.renderQuality),
      state.settings.cameraWidth,
      state.settings.cameraHeight,
    ],
    c: state.currentFrame,
    p: state.playing ? 1 : 0,
    fv: state.cameraDimensionsFollowViewport ? 1 : 0,
    k: state.keyframes.map(keyframe => [keyframe.frame, packAnimationKeyframeState(keyframe.state)]),
  };
}

export function unpackTimelineState(
  state: PackedAnimationTimelineState,
  defaults: SceneCodecDefaults,
): AnimationTimelineState {
  return {
    settings: {
      fps: finiteInteger(state.s[0], 60),
      frameCount: finiteInteger(state.s[1], 180),
      renderQuality: unpackRenderQuality(state.s[2]),
      cameraWidth: finiteInteger(state.s[3], window.innerWidth),
      cameraHeight: finiteInteger(state.s[4], window.innerHeight),
    },
    currentFrame: finiteNumber(state.c, 0),
    playing: state.p === 1,
    cameraDimensionsFollowViewport: state.fv === 1,
    keyframes: state.k.map(([frame, keyframe]) => ({
      frame: finiteInteger(frame, 0),
      state: unpackAnimationKeyframeState(keyframe, defaults),
    })),
  };
}

export function packInstanceState(instance: InstanceSnapshot): PackedInstanceState {
  return {
    x: packF32(instance.X),
    e: packU32(instance.E),
    ct: packCellTopologyForUrl(instance.kind, undefined, instance.cellTopology),
    st: packSurfaceTopology(instance.surfaceTopology),
    m: instance.M,
    o: packVec3(instance.offset),
    l: instance.label,
    k: instance.kind,
    t: packTransformState(instance.transform),
    g: packF32(instance.origin ? new Float32Array(instance.origin) : new Float32Array(MAX_N)),
    n: instance.originalN,
    a: [...instance.axisMap],
    v: instance.visible ? 1 : 0,
    mi: instance.materialId,
    s: packSurfaceState(normalizeSurface(instance.surface)),
  };
}

export function unpackInstanceState(instance: PackedInstanceState): InstanceSnapshot {
  return {
    X: unpackF32(instance.x),
    E: unpackU32(instance.e),
    cellTopology: unpackCellTopology(instance.ct),
    surfaceTopology: unpackSurfaceTopology(instance.st),
    M: finiteInteger(instance.m, 0),
    offset: unpackVec3(instance.o),
    label: typeof instance.l === 'string' ? instance.l : 'Object',
    kind: instance.k,
    transform: unpackTransformState(instance.t),
    origin: unpackF32(instance.g),
    originalN: Math.max(1, Math.min(MAX_N, finiteInteger(instance.n, MAX_N))),
    axisMap: Array.isArray(instance.a) ? instance.a.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    visible: instance.v === 1,
    materialId: typeof instance.mi === 'string' ? instance.mi : '',
    surface: unpackSurfaceState(instance.s),
  };
}

export function sanitizeSceneName(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/gu, ' ').slice(0, 80);
}

export function unpackSceneUrlSnapshot(
  state: PackedSceneUrlState,
  defaults: SceneCodecDefaults,
): SceneSnapshot<PrimitiveMode> {
  return {
    N: Math.max(1, Math.min(MAX_N, finiteInteger(state.n, MAX_N))),
    X: unpackF32(state.x),
    E: unpackU32(state.e),
    cellTopology: unpackCellTopology(state.ct),
    surfaceTopology: unpackSurfaceTopology(state.st),
    M: finiteInteger(state.m, 0),
    source: state.ds === 'custom' ? 'custom' : 'primitive',
    label: typeof state.l === 'string' ? state.l : 'Scene',
    paramsN: Math.max(3, Math.min(MAX_N, finiteInteger(state.pn, MAX_N))),
    primitive: state.pk,
    rotMatrix: unpackF32(state.r),
    axes: {
      x: normalizedAxisDim(state.ax?.[0], 0),
      y: normalizedAxisDim(state.ax?.[1], 1),
      z: normalizedAxisDim(state.ax?.[2], 2),
    },
    axesOrder: Array.isArray(state.ao) ? state.ao.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    axesOffset: finiteInteger(state.of, 0),
    baseAxisMap: Array.isArray(state.bam) ? state.bam.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    baseTransform: unpackTransformState(state.bt),
    baseOrigin: unpackF32(state.bo),
    baseOrigN: Math.max(1, Math.min(MAX_N, finiteInteger(state.bn, MAX_N))),
    baseVisible: state.bv === 1,
    materials: Array.isArray(state.ma)
      ? state.ma.map((material, idx) => unpackMaterialState(material, idx, defaults.createMaterialId)).filter((material): material is SceneMaterialState => !!material)
      : undefined,
    baseMaterialId: typeof state.bm === 'string' ? state.bm : '',
    baseSurface: unpackSurfaceState(state.bs),
    selectedInstance: finiteInteger(state.si, defaults.noSelection),
    selectedInstances: Array.isArray(state.ss) ? state.ss.map(idx => finiteInteger(idx, defaults.noSelection)) : [],
    instances: state.i.map(unpackInstanceState),
    lights: Array.isArray(state.li)
      ? state.li.map((lightState, idx) => unpackSceneLightState(lightState, idx, defaults.createSceneLightId)).filter((lightState): lightState is SceneLightState => !!lightState)
      : [],
  };
}

export function isPackedSceneUrlState(value: unknown): value is PackedSceneUrlState {
  return typeof value === 'object' && value !== null && (value as { v?: unknown }).v === 1;
}

import * as THREE from 'three';
import type { PrimitiveKind, PrimitiveSurfaceTopology } from '../geometry/primitives';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { AxisMap } from '../geometry/projectionUtils';
import type { ObjectOrigin } from './objectOrigin';
import type { SurfaceState } from './surface';

export type DataSource = 'primitive' | 'custom';
export type TransformMode = 'none' | 'move' | 'rotate' | 'scale';
export type ProjectionAxes = { x: number; y: number; z: number };
export type TransformState = { pos: THREE.Vector3; rot: THREE.Vector3; scale: THREE.Vector3 };

export type InstanceSnapshot = {
  X: Float32Array;
  E: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  M: number;
  offset: THREE.Vector3;
  label: string;
  kind: PrimitiveKind;
  transform: TransformState;
  origin?: ObjectOrigin;
  originalN: number;
  axisMap: AxisMap;
  visible: boolean;
  surface?: SurfaceState;
};

export type SceneSnapshot<TPrimitiveMode> = {
  N: number;
  X: Float32Array;
  E: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  M: number;
  source: DataSource;
  label: string;
  paramsN: number;
  primitive: TPrimitiveMode;
  rotMatrix: Float32Array;
  axes: ProjectionAxes;
  axesOrder: number[];
  axesOffset: number;
  baseAxisMap: AxisMap;
  baseTransform: TransformState;
  baseOrigin?: ObjectOrigin;
  baseOrigN: number;
  baseVisible: boolean;
  baseSurface?: SurfaceState;
  selectedInstance: number;
  instances: InstanceSnapshot[];
};

export type Instance = {
  renderer: HypercubeRenderer;
  Y: Float32Array;
  X: Float32Array;
  E: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  M: number;
  offset: THREE.Vector3;
  label: string;
  kind: PrimitiveKind;
  transform: TransformState;
  origin: ObjectOrigin;
  originalN: number;
  axisMap: AxisMap;
  visible: boolean;
  surface: SurfaceState;
};

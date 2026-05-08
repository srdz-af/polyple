import * as THREE from 'three';
import type { ViewMode } from '../constants';
import { clonePrimitiveSurfaceTopology, type PrimitiveKind, type PrimitiveSurfaceTopology } from '../geometry/primitives';
import type { AxisMap } from '../geometry/projectionUtils';
import type { NDProjector } from '../geometry/NDProjector';
import { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import { cloneObjectOrigin, type ObjectOrigin } from './objectOrigin';
import { cloneSurface, normalizeSurface, type SurfaceState } from './surface';
import type { Instance } from './types';

export type InstanceGeometryData = {
  verts: Float32Array;
  edges: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  V: number;
  kind: PrimitiveKind;
  axisMap: AxisMap;
  originalN: number;
  origin?: ObjectOrigin;
};

type InstanceFactoryOptions = {
  scene: THREE.Scene;
  projector: NDProjector;
  data: InstanceGeometryData;
  offset: THREE.Vector3;
  label: string;
  surface: SurfaceState;
  renderMode: ViewMode;
  sliceDim: number;
  sliceMin: number;
  sliceMax: number;
  projectionN: number;
};

export function createSceneInstance(options: InstanceFactoryOptions): Instance {
  const renderer = new HypercubeRenderer(options.scene);
  renderer.build(options.data.V, options.data.edges, options.data.surfaceTopology);
  const surface = cloneSurface(normalizeSurface(options.surface));
  renderer.setSurface(surface);

  const Y = new Float32Array(3 * options.data.V);
  const transform = {
    pos: options.offset.clone(),
    rot: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
  };

  options.projector.project(options.data.verts, options.data.V, Y);
  renderer.setTransform(transform.pos, new THREE.Euler(transform.rot.x, transform.rot.y, transform.rot.z), transform.scale);
  renderer.writeInterleavedFrom(Y);
  renderer.filterEdgesByDimRange(
    options.data.verts,
    options.projectionN,
    options.data.V,
    options.sliceDim,
    options.sliceMin,
    options.sliceMax,
  );
  renderer.setMode(options.renderMode);

  return {
    renderer,
    Y,
    X: options.data.verts,
    E: options.data.edges,
    surfaceTopology: clonePrimitiveSurfaceTopology(options.data.surfaceTopology),
    M: options.data.V,
    offset: options.offset.clone(),
    label: options.label,
    kind: options.data.kind,
    transform,
    origin: cloneObjectOrigin(options.data.origin, options.data.verts, options.data.V, options.projectionN),
    originalN: options.data.originalN,
    axisMap: [...options.data.axisMap],
    visible: true,
    surface,
  };
}

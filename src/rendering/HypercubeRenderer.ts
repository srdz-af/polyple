import * as THREE from 'three';
import type { ViewMode } from '../constants';
import { HullGeometryBuilder, type VertexPoint } from './hullGeometry';

export type SurfaceMaterial = {
  color: number;
  metalness: number;
  roughness: number;
  alpha: number;
};
const DEFAULT_SURFACE: SurfaceMaterial = {
  color: 0xbfc7d5,
  metalness: 1.0,
  roughness: 0.05,
  alpha: 1.0,
};
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export class HypercubeRenderer {
  scene: THREE.Scene;
  group: THREE.Group;
  geometry!: THREE.BufferGeometry;
  line!: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  mesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  positions!: Float32Array;
  M!: number;
  allEdges!: Uint32Array;
  visibleEdges!: Uint32Array;
  offset = new THREE.Vector3();
  private lineMaterial: THREE.LineBasicMaterial;
  private solidMaterial: THREE.MeshStandardMaterial;
  private facetedMaterial: THREE.MeshStandardMaterial;
  private mode: ViewMode = 'wireframe';
  private hullNeedsUpdate = false;
  private points: VertexPoint[] = [];
  private visibleVertexMask?: Uint8Array;
  private transform = new THREE.Matrix4();
  private tmp = new THREE.Vector3();
  private surface: SurfaceMaterial = { ...DEFAULT_SURFACE };
  private hullBuilder = new HullGeometryBuilder();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xe5efff, transparent: true, opacity: 0.95 });
    this.solidMaterial = new THREE.MeshStandardMaterial({
      color: this.surface.color,
      metalness: this.surface.metalness,
      roughness: this.surface.roughness,
      transparent: false,
      opacity: this.surface.alpha,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
      depthWrite: true,
      vertexColors: false,
    });
    this.facetedMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.35,
      roughness: 0.55,
      transparent: false,
      opacity: 1,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
      depthWrite: true,
      vertexColors: true,
    });
  }

  build(M: number, edges: Uint32Array): void {
    this.dispose();
    this.M = M;
    this.allEdges = edges;
    this.visibleEdges = edges;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(3 * M);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.setIndexAttribute(this.visibleEdges);

    this.line = new THREE.LineSegments(this.geometry, this.lineMaterial);
    this.line.visible = this.mode === 'wireframe';
    this.group.add(this.line);

    this.points = Array.from({ length: M }, (_, idx) => {
      const v = new THREE.Vector3() as VertexPoint;
      v.__vertexId = idx;
      return v;
    });

    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.solidMaterial);
    this.mesh.visible = this.mode !== 'wireframe';
    this.group.add(this.mesh);

    this.hullNeedsUpdate = true;
    this.visibleVertexMask = undefined;
    this.hullBuilder.reset(M, edges);
  }

  setTransform(position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3): void {
    const q = new THREE.Quaternion().setFromEuler(rotation);
    this.transform.compose(position, q, scale);
  }

  writeInterleavedFrom(Y: Float32Array): void {
    const M = this.M;
    const { positions } = this;
    const xs = Y.subarray(0, M);
    const ys = Y.subarray(M, 2 * M);
    const zs = Y.subarray(2 * M, 3 * M);
    let p = 0;

    for (let i = 0; i < M; i++) {
      this.tmp.set(xs[i], ys[i], zs[i]).applyMatrix4(this.transform);
      positions[p++] = this.tmp.x;
      positions[p++] = this.tmp.y;
      positions[p++] = this.tmp.z;
      this.points[i].copy(this.tmp);
    }

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();

    if (this.mode !== 'wireframe') {
      this.hullNeedsUpdate = true;
      this.updateHullGeometry();
    }
  }

  setMode(mode: ViewMode): void {
    this.mode = mode;

    if (this.line) {
      this.line.visible = mode === 'wireframe' || mode === 'transparent';
      this.line.material.depthTest = mode !== 'transparent';
      this.line.renderOrder = mode === 'transparent' ? 5 : 0;
    }

    if (this.mesh) {
      this.mesh.material = mode === 'faceted' ? this.facetedMaterial : this.solidMaterial;
      this.mesh.visible = mode !== 'wireframe' && this.mesh.geometry.attributes.position !== undefined;
      if (mode !== 'faceted') this.applySurfaceMaterial();
    }

    this.hullNeedsUpdate = mode !== 'wireframe';
    if (mode !== 'wireframe') this.updateHullGeometry();
  }

  setSurface(surface: SurfaceMaterial): void {
    this.surface = {
      color: Math.max(0, Math.min(0xffffff, surface.color >>> 0)),
      metalness: clamp01(surface.metalness),
      roughness: clamp01(surface.roughness),
      alpha: clamp01(surface.alpha),
    };
    this.applySurfaceMaterial();
  }

  getSurface(): SurfaceMaterial {
    return { ...this.surface };
  }

  filterEdgesByDimRange(X: Float32Array, N: number, M: number, dim: number, minV: number, maxV: number): void {
    if (dim < 0 || dim >= N) {
      this.visibleEdges = this.allEdges;
      this.visibleVertexMask = undefined;
      this.setIndexAttribute(this.allEdges);
      this.refreshSurface();
      return;
    }

    const keep = new Uint8Array(M);
    const base = dim * M;
    for (let m = 0; m < M; m++) {
      const v = X[base + m];
      keep[m] = v >= minV && v <= maxV ? 1 : 0;
    }

    const arr: number[] = [];
    for (let e = 0; e < this.allEdges.length; e += 2) {
      const a = this.allEdges[e];
      const b = this.allEdges[e + 1];
      if (keep[a] && keep[b]) arr.push(a, b);
    }

    this.visibleEdges = new Uint32Array(arr.length ? arr : [0, 0]);
    this.visibleVertexMask = keep;
    this.setIndexAttribute(this.visibleEdges);
    this.geometry.index!.needsUpdate = true;
    this.refreshSurface();
  }

  refreshSurface(): void {
    if (this.mode === 'wireframe' || !this.mesh) return;
    this.hullNeedsUpdate = true;
    this.updateHullGeometry();
  }

  dispose(): void {
    if (this.line) {
      this.group.remove(this.line);
      this.line.geometry.dispose();
    }

    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = undefined;
    }

    this.geometry = undefined as unknown as THREE.BufferGeometry;
    this.hullBuilder.reset();
  }

  private setIndexAttribute(array: Uint32Array): void {
    this.geometry.setIndex(new THREE.BufferAttribute(array, 1));
  }

  private applySurfaceMaterial(): void {
    if (this.mode === 'faceted') return;
    const material = this.solidMaterial;
    material.color.setHex(this.surface.color);
    material.metalness = this.surface.metalness;
    material.roughness = this.surface.roughness;
    if (this.mode === 'transparent') {
      material.transparent = true;
      material.opacity = 0.5;
      material.depthWrite = false;
    } else {
      material.transparent = this.surface.alpha < 0.999;
      material.opacity = this.surface.alpha;
      material.depthWrite = !material.transparent;
    }
    material.needsUpdate = true;
  }

  private updateHullGeometry(): void {
    if (!this.mesh || !this.hullNeedsUpdate || this.mode === 'wireframe') return;

    const indices = this.visibleVertexMask
      ? this.points.reduce<number[]>((acc, _p, idx) => {
          if (this.visibleVertexMask![idx] === 1) acc.push(idx);
          return acc;
        }, [])
      : this.points.map((_p, idx) => idx);

    if (indices.length < 4) {
      this.mesh.visible = false;
      this.hullNeedsUpdate = false;
      return;
    }

    const geometry = this.hullBuilder.build(indices.map(idx => this.points[idx]));
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!positionAttr || positionAttr.count < 3) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
      this.mesh.visible = false;
      this.hullNeedsUpdate = false;
      return;
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
    this.mesh.visible = true;
    this.hullNeedsUpdate = false;
  }

}

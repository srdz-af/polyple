import * as THREE from 'three';
import { ConvexHull, type Face } from 'three/examples/jsm/math/ConvexHull.js';
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
const COPLANAR_NORMAL_EPS = 1e-4;
const COPLANAR_CONST_EPS = 1e-4;
const FACET_HUE_STOPS = [0, 20, 40, 55, 80, 105, 130, 155, 180, 205, 230, 255, 280, 305, 330];
const FACET_LIGHTNESS_STOPS = [0.40, 0.54, 0.68];
const FACET_SATURATION = 0.92;
const FACET_COLOR_COUNT = FACET_HUE_STOPS.length * FACET_LIGHTNESS_STOPS.length;

export type SurfaceTopology = {
  triangles: Uint32Array;
  facetIds: Uint16Array;
};

type FaceInfo = {
  face: Face;
  planeConstant: number;
};

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
  private surfaceNeedsUpdate = false;
  private points: VertexPoint[] = [];
  private visibleVertexMask?: Uint8Array;
  private transform = new THREE.Matrix4();
  private tmp = new THREE.Vector3();
  private surface: SurfaceMaterial = { ...DEFAULT_SURFACE };
  private surfaceTopology?: SurfaceTopology;
  private facetColorCache = new Map<number, THREE.Color>();
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

  build(M: number, edges: Uint32Array, surfaceTopology?: SurfaceTopology): void {
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

    this.surfaceNeedsUpdate = true;
    this.visibleVertexMask = undefined;
    this.surfaceTopology = surfaceTopology ? {
      triangles: new Uint32Array(surfaceTopology.triangles),
      facetIds: new Uint16Array(surfaceTopology.facetIds),
    } : undefined;
    this.facetColorCache.clear();
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
      this.surfaceNeedsUpdate = true;
      this.updateHullGeometry();
    }
  }

  setMode(mode: ViewMode): void {
    this.mode = mode;

    if (this.line) {
      this.line.visible = mode === 'wireframe';
      this.line.material.depthTest = true;
      this.line.renderOrder = 0;
    }

    if (this.mesh) {
      this.mesh.material = mode === 'faceted' ? this.facetedMaterial : this.solidMaterial;
      this.mesh.visible = mode !== 'wireframe' && this.mesh.geometry.attributes.position !== undefined;
      if (mode !== 'faceted') this.applySurfaceMaterial();
    }

    this.surfaceNeedsUpdate = mode !== 'wireframe';
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
    this.surfaceNeedsUpdate = true;
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
    material.transparent = this.surface.alpha < 0.999;
    material.opacity = this.surface.alpha;
    material.depthWrite = !material.transparent;
    material.needsUpdate = true;
  }

  private updateHullGeometry(): void {
    if (!this.mesh || !this.surfaceNeedsUpdate || this.mode === 'wireframe') return;

    if (!this.surfaceTopology) this.surfaceTopology = this.buildSurfaceTopologyFromCurrentPoints();
    const geometry = this.surfaceTopology
      ? this.buildSurfaceGeometryFromTopology(this.surfaceTopology)
      : this.buildSurfaceGeometryFromHullFallback();
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!positionAttr || positionAttr.count < 3) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
      this.mesh.visible = false;
      this.surfaceNeedsUpdate = false;
      return;
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
    this.mesh.visible = true;
    this.surfaceNeedsUpdate = false;
  }

  private buildSurfaceGeometryFromHullFallback(): THREE.BufferGeometry {
    const indices = this.visibleVertexMask
      ? this.points.reduce<number[]>((acc, _p, idx) => {
          if (this.visibleVertexMask![idx] === 1) acc.push(idx);
          return acc;
        }, [])
      : this.points.map((_p, idx) => idx);

    if (indices.length < 4) return new THREE.BufferGeometry();
    return this.hullBuilder.build(indices.map(idx => this.points[idx]));
  }

  private buildSurfaceGeometryFromTopology(topology: SurfaceTopology): THREE.BufferGeometry {
    const triangles = topology.triangles;
    const facetIds = topology.facetIds;
    if (triangles.length < 3 || facetIds.length * 3 !== triangles.length) return new THREE.BufferGeometry();

    const keep = this.visibleVertexMask;
    let visibleTriangleCount = 0;
    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i];
      const b = triangles[i + 1];
      const c = triangles[i + 2];
      if (keep && !(keep[a] && keep[b] && keep[c])) continue;
      visibleTriangleCount++;
    }
    if (visibleTriangleCount <= 0) return new THREE.BufferGeometry();

    const positions = new Float32Array(visibleTriangleCount * 9);
    const colors = this.mode === 'faceted' ? new Float32Array(visibleTriangleCount * 9) : null;
    let vertexWrite = 0;
    let colorWrite = 0;
    let triangleWrite = 0;

    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i];
      const b = triangles[i + 1];
      const c = triangles[i + 2];
      if (keep && !(keep[a] && keep[b] && keep[c])) continue;

      const pa = this.points[a];
      const pb = this.points[b];
      const pc = this.points[c];
      positions[vertexWrite++] = pa.x;
      positions[vertexWrite++] = pa.y;
      positions[vertexWrite++] = pa.z;
      positions[vertexWrite++] = pb.x;
      positions[vertexWrite++] = pb.y;
      positions[vertexWrite++] = pb.z;
      positions[vertexWrite++] = pc.x;
      positions[vertexWrite++] = pc.y;
      positions[vertexWrite++] = pc.z;

      if (colors) {
        const facetId = facetIds[i / 3] ?? 0;
        const color = this.facetColorForFacet(facetId);
        for (let v = 0; v < 3; v++) {
          colors[colorWrite++] = color.r;
          colors[colorWrite++] = color.g;
          colors[colorWrite++] = color.b;
        }
      }

      triangleWrite++;
    }

    if (triangleWrite <= 0) return new THREE.BufferGeometry();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (colors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }

  private buildSurfaceTopologyFromCurrentPoints(): SurfaceTopology | undefined {
    if (this.points.length < 4) return undefined;

    const hypercubeTopology = this.buildHypercubeSurfaceTopology();
    if (hypercubeTopology) return hypercubeTopology;

    let hull: ConvexHull;
    try {
      hull = new ConvexHull().setFromPoints(this.points);
    } catch {
      return undefined;
    }

    const faceInfos = hull.faces.map(face => this.collectFaceInfo(face));
    if (faceInfos.length === 0) return undefined;

    const facetIdsByFace = this.groupCoplanarFaces(faceInfos);
    const triangles: number[] = [];
    const facetIds: number[] = [];

    for (let faceIdx = 0; faceIdx < faceInfos.length; faceIdx++) {
      const polygon = this.collectFacePolygon(faceInfos[faceIdx].face);
      if (polygon.length < 3) continue;
      const anchor = polygon[0].__vertexId;
      for (let i = 1; i < polygon.length - 1; i++) {
        const b = polygon[i].__vertexId;
        const c = polygon[i + 1].__vertexId;
        if (anchor === b || b === c || anchor === c) continue;
        triangles.push(anchor, b, c);
        facetIds.push(facetIdsByFace[faceIdx]);
      }
    }

    if (triangles.length < 3 || facetIds.length === 0) return undefined;
    return {
      triangles: new Uint32Array(triangles),
      facetIds: new Uint16Array(facetIds),
    };
  }

  private buildHypercubeSurfaceTopology(): SurfaceTopology | undefined {
    const dim = this.detectHypercubeDimension(this.M, this.allEdges);
    if (dim <= 0 || dim > 30) return undefined;

    const triangles: number[] = [];
    const facetIds: number[] = [];
    let facetId = 0;
    const vertexCount = this.M;

    for (let axisA = 0; axisA < dim; axisA++) {
      for (let axisB = axisA + 1; axisB < dim; axisB++) {
        const bitA = 1 << axisA;
        const bitB = 1 << axisB;
        for (let base = 0; base < vertexCount; base++) {
          if ((base & bitA) !== 0 || (base & bitB) !== 0) continue;
          const v00 = base;
          const v10 = base | bitA;
          const v01 = base | bitB;
          const v11 = base | bitA | bitB;

          triangles.push(v00, v10, v11, v00, v11, v01);
          facetIds.push(facetId, facetId);
          facetId++;
        }
      }
    }

    if (triangles.length < 3 || facetIds.length === 0) return undefined;
    return {
      triangles: new Uint32Array(triangles),
      facetIds: new Uint16Array(facetIds),
    };
  }

  private collectFacePolygon(face: Face): VertexPoint[] {
    const polygon: VertexPoint[] = [];
    let edge = face.edge;
    do {
      polygon.push(edge.head().point as VertexPoint);
      edge = edge.next;
    } while (edge !== face.edge);
    return polygon;
  }

  private collectFaceInfo(face: Face): FaceInfo {
    const polygon = this.collectFacePolygon(face);
    const planeConstant = polygon.length > 0 ? face.normal.dot(polygon[0]) : 0;
    return { face, planeConstant };
  }

  private groupCoplanarFaces(faceInfos: FaceInfo[]): Uint16Array {
    const assigned = new Uint8Array(faceInfos.length);
    const facetIdsByFace = new Uint16Array(faceInfos.length);
    let nextFacetId = 0;

    for (let i = 0; i < faceInfos.length; i++) {
      if (assigned[i]) continue;
      assigned[i] = 1;
      facetIdsByFace[i] = nextFacetId;
      for (let j = i + 1; j < faceInfos.length; j++) {
        if (assigned[j]) continue;
        if (!this.areCoplanar(faceInfos[i], faceInfos[j])) continue;
        assigned[j] = 1;
        facetIdsByFace[j] = nextFacetId;
      }
      nextFacetId++;
    }

    return facetIdsByFace;
  }

  private areCoplanar(a: FaceInfo, b: FaceInfo): boolean {
    const normalDot = a.face.normal.dot(b.face.normal);
    if (Math.abs(normalDot) < (1 - COPLANAR_NORMAL_EPS)) return false;
    const scale = Math.max(1, Math.abs(a.planeConstant), Math.abs(b.planeConstant));
    if (normalDot >= 0) {
      return Math.abs(a.planeConstant - b.planeConstant) <= (COPLANAR_CONST_EPS * scale);
    }
    return Math.abs(a.planeConstant + b.planeConstant) <= (COPLANAR_CONST_EPS * scale);
  }

  private facetColorForFacet(facetId: number): THREE.Color {
    const cached = this.facetColorCache.get(facetId);
    if (cached) return cached;

    const colorIdx = ((facetId % FACET_COLOR_COUNT) + FACET_COLOR_COUNT) % FACET_COLOR_COUNT;
    const hueIdx = colorIdx % FACET_HUE_STOPS.length;
    const lightnessIdx = Math.floor(colorIdx / FACET_HUE_STOPS.length) % FACET_LIGHTNESS_STOPS.length;
    const hue = FACET_HUE_STOPS[hueIdx];
    let lightness = FACET_LIGHTNESS_STOPS[lightnessIdx];
    if (hue >= 45 && hue <= 75) lightness = Math.max(0.34, lightness - 0.08);

    const color = new THREE.Color().setHSL(hue / 360, FACET_SATURATION, lightness);
    this.facetColorCache.set(facetId, color);
    return color;
  }

  private detectHypercubeDimension(vertexCount: number, edges: Uint32Array<ArrayBufferLike>): number {
    if (vertexCount < 4 || (vertexCount & (vertexCount - 1)) !== 0) return 0;
    const dim = Math.log2(vertexCount);
    if (!Number.isInteger(dim) || dim <= 0) return 0;
    const expectedEdgeCount = (vertexCount * dim) / 2;
    if ((edges.length & 1) !== 0 || (edges.length / 2) !== expectedEdgeCount) return 0;

    const degree = new Uint16Array(vertexCount);
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i];
      const b = edges[i + 1];
      if (a >= vertexCount || b >= vertexCount || a === b) return 0;
      const xor = a ^ b;
      if (xor === 0 || (xor & (xor - 1)) !== 0) return 0;
      degree[a]++;
      degree[b]++;
    }
    for (let i = 0; i < vertexCount; i++) {
      if (degree[i] !== dim) return 0;
    }

    return dim;
  }

}

import * as THREE from 'three';
import type { RotND } from '../RotND';
import type { NDProjector } from '../geometry/NDProjector';
import { perspectiveScaleFrom, type AxisMap } from '../geometry/projectionUtils';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { ObjectOrigin } from './objectOrigin';
import type { Instance, TransformState } from './types';
import type { ViewMode } from '../constants';

type ProjectionParams = {
  N: number;
  renderMode: ViewMode;
  editMode: boolean;
  axesX: number;
  axesY: number;
  axesZ: number;
};

type ProjectionPipelineOptions = {
  getN: () => number;
  getX: () => Float32Array;
  getM: () => number;
  getY: () => Float32Array;
  getRot: () => RotND;
  getProjector: () => NDProjector;
  getParams: () => ProjectionParams;
  getRendererND: () => HypercubeRenderer;
  getExtraInstances: () => Instance[];
  getBaseTransform: () => TransformState;
  getBaseOrigin: () => ObjectOrigin;
  getBaseOriginalN: () => number;
  getBaseAxisMap: () => AxisMap;
  visibleDims: () => number;
  perspectiveDimsFor: (localN: number, axisMap: AxisMap) => number[];
  applyObjectVisibility: () => void;
  updateSelectionOutline: () => void;
  updateVertexCloud: () => void;
  updateAxisGuide: () => void;
  tmpN: Float32Array;
  tmpVec: THREE.Vector3;
  tmpCenter: THREE.Vector3;
};

export class ProjectionPipeline {
  constructor(private readonly options: ProjectionPipelineOptions) {}

  projectAndRenderAll() {
    const N = this.options.getN();
    const M = this.options.getM();
    const params = this.options.getParams();
    const rendererND = this.options.getRendererND();
    const usePerspective = N >= 4;

    if (usePerspective) {
      const axes = [params.axesX % N, params.axesY % N, params.axesZ % N].map(v => Math.max(0, Math.min(N - 1, v)));
      const projectOne = (
        Xsrc: Float32Array,
        Mloc: number,
        Ydst: Float32Array,
        transform: TransformState,
        renderer: HypercubeRenderer,
        origin: ObjectOrigin,
        originalN: number,
        axisMap: AxisMap,
      ) => {
        if (Mloc === 0) return;
        const R = this.options.getRot().matrix;
        const perspectiveDims = this.options.perspectiveDimsFor(originalN, axisMap);
        const tmpN = this.options.tmpN;
        for (let m = 0; m < Mloc; m++) {
          for (let d = 0; d < N; d++) {
            let acc = 0;
            for (let a = 0; a < N; a++) acc += R[d * N + a] * Xsrc[a * Mloc + m];
            tmpN[d] = acc;
          }
          const scale = perspectiveScaleFrom(tmpN, perspectiveDims);
          Ydst[0 * Mloc + m] = tmpN[axes[0]] * scale;
          Ydst[1 * Mloc + m] = tmpN[axes[1]] * scale;
          Ydst[2 * Mloc + m] = tmpN[axes[2]] * scale;
        }
        const originProjected = this.projectPerspectiveOrigin(origin, axes, perspectiveDims, this.options.tmpCenter);
        this.subtractOrigin(Ydst, Mloc, originProjected);
        const tpos = this.options.tmpVec.set(
          transform.pos.x + originProjected.x,
          transform.pos.y + originProjected.y,
          transform.pos.z + originProjected.z,
        );
        renderer.setTransform(tpos, new THREE.Euler(transform.rot.x, transform.rot.y, transform.rot.z), transform.scale);
        renderer.writeInterleavedFrom(Ydst);
      };

      if (M > 0 && rendererND.geometry) {
        projectOne(
          this.options.getX(),
          M,
          this.options.getY(),
          this.options.getBaseTransform(),
          rendererND,
          this.options.getBaseOrigin(),
          this.options.getBaseOriginalN() || this.options.visibleDims(),
          this.options.getBaseAxisMap(),
        );
      }
      this.options.getExtraInstances().forEach(inst => {
        projectOne(inst.X, inst.M, inst.Y, inst.transform, inst.renderer, inst.origin, inst.originalN, inst.axisMap);
      });
    } else {
      this.applyProjectionMatrix();
      const projector = this.options.getProjector();
      if (M > 0 && rendererND.geometry) {
        const Y = this.options.getY();
        projector.project(this.options.getX(), M, Y);
        const originProjected = this.projectLinearOrigin(this.options.getBaseOrigin(), this.options.tmpCenter);
        this.subtractOrigin(Y, M, originProjected);
        const baseTransform = this.options.getBaseTransform();
        const tpos = this.options.tmpVec.set(
          baseTransform.pos.x + originProjected.x,
          baseTransform.pos.y + originProjected.y,
          baseTransform.pos.z + originProjected.z,
        );
        rendererND.setTransform(tpos, new THREE.Euler(baseTransform.rot.x, baseTransform.rot.y, baseTransform.rot.z), baseTransform.scale);
        rendererND.writeInterleavedFrom(Y);
      }
      this.options.getExtraInstances().forEach(inst => {
        projector.project(inst.X, inst.M, inst.Y);
        const originProjected = this.projectLinearOrigin(inst.origin, this.options.tmpCenter);
        this.subtractOrigin(inst.Y, inst.M, originProjected);
        const tpos = this.options.tmpVec.set(
          inst.transform.pos.x + originProjected.x,
          inst.transform.pos.y + originProjected.y,
          inst.transform.pos.z + originProjected.z,
        );
        inst.renderer.setTransform(tpos, new THREE.Euler(inst.transform.rot.x, inst.transform.rot.y, inst.transform.rot.z), inst.transform.scale);
        inst.renderer.writeInterleavedFrom(inst.Y);
      });
    }

    this.options.applyObjectVisibility();
    this.options.updateSelectionOutline();
    if (params.editMode) this.options.updateVertexCloud();
    this.options.updateAxisGuide();
  }

  private subtractOrigin(Yarr: Float32Array, Mloc: number, origin: THREE.Vector3) {
    for (let i = 0; i < Mloc; i++) {
      Yarr[i] -= origin.x;
      Yarr[Mloc + i] -= origin.y;
      Yarr[2 * Mloc + i] -= origin.z;
    }
  }

  private projectPerspectiveOrigin(
    origin: ObjectOrigin,
    axes: number[],
    perspectiveDims: number[],
    target: THREE.Vector3,
  ) {
    const N = this.options.getN();
    const R = this.options.getRot().matrix;
    const tmpN = this.options.tmpN;
    for (let d = 0; d < N; d++) {
      let acc = 0;
      for (let a = 0; a < N; a++) acc += R[d * N + a] * (origin[a] ?? 0);
      tmpN[d] = acc;
    }
    const scale = perspectiveScaleFrom(tmpN, perspectiveDims);
    return target.set(
      (tmpN[axes[0]] ?? 0) * scale,
      (tmpN[axes[1]] ?? 0) * scale,
      (tmpN[axes[2]] ?? 0) * scale,
    );
  }

  private projectLinearOrigin(origin: ObjectOrigin, target: THREE.Vector3) {
    const N = this.options.getN();
    const projector = this.options.getProjector();
    const R = this.options.getRot().matrix;
    const P = projector.P;
    const tmpN = this.options.tmpN;
    for (let d = 0; d < N; d++) {
      let acc = 0;
      for (let a = 0; a < N; a++) acc += R[d * N + a] * (origin[a] ?? 0);
      tmpN[d] = acc;
    }
    const x = this.projectLinearComponent(tmpN, P, 0, N);
    const y = this.projectLinearComponent(tmpN, P, 1, N);
    const z = this.projectLinearComponent(tmpN, P, 2, N);
    return target.set(x, y, z);
  }

  private projectLinearComponent(rotated: Float32Array, P: Float32Array, component: number, N: number) {
    let acc = 0;
    const offset = component * N;
    for (let k = 0; k < N; k++) acc += (P[offset + k] ?? 0) * (rotated[k] ?? 0);
    return acc;
  }

  private applyProjectionMatrix() {
    const params = this.options.getParams();
    const N = this.options.getN();
    const projector = this.options.getProjector();
    const nVis = this.options.visibleDims();
    const axes = [params.axesX % nVis, params.axesY % nVis, params.axesZ % nVis].map(v => Math.max(0, Math.min(nVis - 1, v)));
    const P = new Float32Array(3 * N);
    P[0 * N + axes[0]] = 1;
    P[1 * N + axes[1]] = 1;
    P[2 * N + axes[2]] = 1;
    projector.setCustomP(P);
  }
}

import * as THREE from 'three';
import type { RotND } from '../RotND';
import type { NDProjector } from '../geometry/NDProjector';
import { perspectiveScaleFrom, recenterProjected, type AxisMap } from '../geometry/projectionUtils';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { Instance, TransformState } from './types';
import type { ViewMode } from '../constants';

type ProjectionParams = {
  N: number;
  sliceDim: number;
  sliceMin: number;
  sliceMax: number;
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
  getBaseOriginalN: () => number;
  getBaseAxisMap: () => AxisMap;
  visibleDims: () => number;
  perspectiveDimsFor: (localN: number, axisMap: AxisMap) => number[];
  applyObjectVisibility: () => void;
  updateSelectionOutline: () => void;
  updateVertexCloud: () => void;
  updateAxisGuide: () => void;
  applySceneBackground: () => void;
  clearVertexCloud: () => void;
  tmpN: Float32Array;
  tmpVec: THREE.Vector3;
  tmpCenter: THREE.Vector3;
};

export class ProjectionPipeline {
  constructor(private readonly options: ProjectionPipelineOptions) {}

  applySliceFilter() {
    const params = this.options.getParams();
    const N = this.options.getN();
    const M = this.options.getM();
    const rendererND = this.options.getRendererND();
    const X = this.options.getX();
    if (M > 0 && rendererND.geometry) {
      rendererND.filterEdgesByDimRange(X, N, M, params.sliceDim, params.sliceMin, params.sliceMax);
    }
    this.options.getExtraInstances().forEach(inst => {
      inst.renderer.filterEdgesByDimRange(inst.X, N, inst.M, params.sliceDim, params.sliceMin, params.sliceMax);
    });
    this.options.updateSelectionOutline();
    this.options.applySceneBackground();
    if (params.editMode) this.options.updateVertexCloud();
    else this.options.clearVertexCloud();
  }

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
        const center = recenterProjected(Ydst, Mloc, this.options.tmpCenter);
        const tpos = this.options.tmpVec.set(transform.pos.x + center.x, transform.pos.y + center.y, transform.pos.z + center.z);
        renderer.setTransform(tpos, new THREE.Euler(transform.rot.x, transform.rot.y, transform.rot.z), transform.scale);
        renderer.writeInterleavedFrom(Ydst);
        renderer.refreshSurface();
      };

      if (M > 0 && rendererND.geometry) {
        projectOne(
          this.options.getX(),
          M,
          this.options.getY(),
          this.options.getBaseTransform(),
          rendererND,
          this.options.getBaseOriginalN() || this.options.visibleDims(),
          this.options.getBaseAxisMap(),
        );
      }
      this.options.getExtraInstances().forEach(inst => {
        projectOne(inst.X, inst.M, inst.Y, inst.transform, inst.renderer, inst.originalN, inst.axisMap);
      });
    } else {
      this.applyProjectionMatrix();
      const projector = this.options.getProjector();
      if (M > 0 && rendererND.geometry) {
        const Y = this.options.getY();
        projector.project(this.options.getX(), M, Y);
        const center = recenterProjected(Y, M, this.options.tmpCenter);
        const baseTransform = this.options.getBaseTransform();
        const tpos = this.options.tmpVec.set(baseTransform.pos.x + center.x, baseTransform.pos.y + center.y, baseTransform.pos.z + center.z);
        rendererND.setTransform(tpos, new THREE.Euler(baseTransform.rot.x, baseTransform.rot.y, baseTransform.rot.z), baseTransform.scale);
        rendererND.writeInterleavedFrom(Y);
        rendererND.refreshSurface();
      }
      this.options.getExtraInstances().forEach(inst => {
        projector.project(inst.X, inst.M, inst.Y);
        const center = recenterProjected(inst.Y, inst.M, this.options.tmpCenter);
        const tpos = this.options.tmpVec.set(inst.transform.pos.x + center.x, inst.transform.pos.y + center.y, inst.transform.pos.z + center.z);
        inst.renderer.setTransform(tpos, new THREE.Euler(inst.transform.rot.x, inst.transform.rot.y, inst.transform.rot.z), inst.transform.scale);
        inst.renderer.writeInterleavedFrom(inst.Y);
        inst.renderer.refreshSurface();
      });
    }

    this.options.applyObjectVisibility();
    this.options.updateSelectionOutline();
    if (params.editMode) this.options.updateVertexCloud();
    this.options.updateAxisGuide();
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

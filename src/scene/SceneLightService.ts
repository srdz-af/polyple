import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ViewportOperation, ViewportOperationScope } from '../interaction/ViewportOperationManager';
import { SceneLightPanelController } from '../ui/SceneLightPanelController';
import type { SceneLightKind, SceneLightState } from './types';
import {
  cloneSceneLightState,
  createSceneLightRuntime,
  disposeSceneLightRuntime,
  normalizeSceneLightState,
  rebuildSceneLightRuntimeKind,
  syncSceneLightRuntime,
  type SceneLightRuntime,
} from './sceneLightRuntime';

type SceneLightDragHandle = 'position' | 'target';

type SceneLightServiceOptions = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  ndc: THREE.Vector2;
  lightSelectionBase: number;
  noSelection: number;
  getRenderQuality: () => string;
  getEditMode: () => boolean;
  getSelectedItems: () => number[];
  getSelectedLightId: () => string;
  setSelectedLightId: (id: string) => void;
  clearSelection: () => void;
  repairSelectionAfterLightRemoval: (removedSelection: number) => void;
  selectObject: (idx: number, additive?: boolean) => void;
  setSceneControlTab: (tab: 'environment' | 'render' | 'texture' | 'lights') => void;
  isTransformActive: () => boolean;
  isTransformGizmoDragging: () => boolean;
  pushUndoSnapshot: () => void;
  runImmediateOperation: (kind: string, scope: ViewportOperationScope, commit: () => void) => void;
  requestSceneUrlUpdate: () => void;
  updateObjectList: () => void;
  updateSelectionOutline: () => void;
  updateTransformActionButtons: () => void;
};

const MARKER_RADIUS = 0.025;
const MARKER_PIXEL_DIAMETER = 11;
const SELECTED_MARKER_PIXEL_DIAMETER = 15;
const TARGET_PIXEL_DIAMETER = 10;
const SHADOW_MAP_SIZE_BY_QUALITY: Record<string, number> = {
  full: 2048,
  high: 1024,
  medium: 512,
  low: 0,
};

export class SceneLightService {
  private idCounter = 1;
  private readonly lights: SceneLightRuntime[] = [];
  private readonly markerGeometry = new THREE.SphereGeometry(MARKER_RADIUS, 12, 8);
  private readonly tmpVec = new THREE.Vector3();
  private readonly drag = {
    active: false,
    moved: false,
    pointerId: -1,
    lightId: '',
    handle: 'position' as SceneLightDragHandle,
    controlsEnabled: true,
    plane: new THREE.Plane(),
    startHit: new THREE.Vector3(),
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
  };
  private readonly panel: SceneLightPanelController;

  constructor(private readonly options: SceneLightServiceOptions) {
    this.panel = new SceneLightPanelController({
      getLights: () => this.lights,
      getSelected: () => this.selectedRuntime(),
      selectLight: id => {
        this.options.setSelectedLightId(id);
        this.options.selectObject(this.selectedSelectionIndex());
      },
      setKind: kind => this.setSelectedKind(kind),
      removeSelected: () => this.removeSelected(),
      setShadow: enabled => this.updateSelected(state => {
        state.castShadow = enabled;
      }),
      setColor: color => this.updateSelected(state => {
        state.color = color;
      }),
      setIntensity: intensity => this.updateSelected(state => {
        state.intensity = intensity;
      }),
      currentShadowMapSize: () => this.currentShadowMapSize(),
      syncRuntimes: () => this.syncRuntimes(),
    });
  }

  bindPanel() {
    this.panel.bind();
  }

  syncPanel() {
    this.panel.sync();
  }

  getLights() {
    return this.lights;
  }

  getLightStates() {
    return this.lights.map(runtime => cloneSceneLightState(runtime.state));
  }

  createId() {
    return `light_${this.idCounter++}`;
  }

  lightSelectionIndex(lightIndex: number) {
    return this.options.lightSelectionBase - lightIndex;
  }

  isLightSelectionIndex(idx: number) {
    return idx <= this.options.lightSelectionBase && this.lights[this.options.lightSelectionBase - idx] !== undefined;
  }

  indexFromSelection(idx: number) {
    return this.isLightSelectionIndex(idx) ? this.options.lightSelectionBase - idx : -1;
  }

  runtimeForSelection(idx: number) {
    return this.lights[this.indexFromSelection(idx)] ?? null;
  }

  indexOf(runtime: SceneLightRuntime) {
    return this.lights.indexOf(runtime);
  }

  selectedRuntime() {
    const selectedId = this.options.getSelectedLightId();
    return this.lights.find(runtime => runtime.state.id === selectedId) ?? null;
  }

  selectedSelectionIndex() {
    const index = this.lights.findIndex(runtime => runtime.state.id === this.options.getSelectedLightId());
    return index >= 0 ? this.lightSelectionIndex(index) : this.options.noSelection;
  }

  ensureSelectedId() {
    if (!this.lights.some(runtime => runtime.state.id === this.options.getSelectedLightId())) {
      this.options.setSelectedLightId(this.lights[0]?.state.id ?? '');
    }
    return this.options.getSelectedLightId();
  }

  currentShadowMapSize() {
    return SHADOW_MAP_SIZE_BY_QUALITY[this.options.getRenderQuality()] ?? SHADOW_MAP_SIZE_BY_QUALITY.full;
  }

  syncRuntimes() {
    this.lights.forEach(runtime => {
      const lightIndex = this.lights.indexOf(runtime);
      syncSceneLightRuntime(runtime, this.runtimeOptions(
        lightIndex >= 0 && this.options.getSelectedItems().includes(this.lightSelectionIndex(lightIndex)),
      ));
    });
    this.syncRendererShadowState();
  }

  setLights(states: SceneLightState[]) {
    this.lights.splice(0).forEach(runtime => disposeSceneLightRuntime(this.options.scene, runtime));
    states.forEach(state => {
      this.lights.push(createSceneLightRuntime(state, this.runtimeOptions(false)));
    });
    this.syncIdCounter();
    this.ensureSelectedId();
    this.syncRuntimes();
    this.panel.sync();
  }

  applyAnimationLights(states: SceneLightState[] | undefined) {
    if (!states) return;
    const compatible = states.length === this.lights.length
      && states.every((state, index) => this.lights[index]?.state.id === state.id && this.lights[index]?.state.kind === state.kind);

    if (!compatible) {
      this.setLights(states.map(cloneSceneLightState));
      this.options.updateObjectList();
      return;
    }

    states.forEach((state, index) => {
      this.lights[index].state = cloneSceneLightState(state);
    });
    this.syncRuntimes();
    this.panel.sync();
  }

  addLightAt(kind: SceneLightKind, position: THREE.Vector3) {
    const index = this.lights.filter(runtime => runtime.state.kind === kind).length + 1;
    const label = `${kind === 'point' ? 'Point' : 'Directional'} light ${index}`;
    const target = kind === 'directional' && position.lengthSq() < 1e-8
      ? new THREE.Vector3(0, -1, 0)
      : new THREE.Vector3();
    const state = normalizeSceneLightState({
      id: this.createId(),
      kind,
      label,
      position: position.clone(),
      target,
    });
    this.lights.push(createSceneLightRuntime(state, this.runtimeOptions(false)));
    this.options.setSelectedLightId(state.id);
    this.options.selectObject(this.lightSelectionIndex(this.lights.length - 1));
    this.options.setSceneControlTab('lights');
    this.options.updateObjectList();
    this.panel.sync();
    this.options.requestSceneUrlUpdate();
  }

  duplicateFromSelection(idx: number, position: THREE.Vector3, duplicateLabel: (label: string) => string) {
    const lightRuntime = this.runtimeForSelection(idx);
    if (!lightRuntime) return null;
    const state = cloneSceneLightState(lightRuntime.state);
    const delta = position.clone().sub(state.position);
    state.id = this.createId();
    state.label = duplicateLabel(state.label);
    state.position.copy(position);
    if (state.kind === 'directional') state.target.add(delta);
    const runtime = createSceneLightRuntime(state, this.runtimeOptions(false));
    this.lights.push(runtime);
    this.options.setSelectedLightId(state.id);
    this.options.selectObject(this.lightSelectionIndex(this.lights.length - 1));
    this.options.updateObjectList();
    this.panel.sync();
    return runtime;
  }

  removeRuntime(runtime: SceneLightRuntime) {
    const idx = this.lights.indexOf(runtime);
    if (idx < 0) return false;
    this.lights.splice(idx, 1);
    disposeSceneLightRuntime(this.options.scene, runtime);
    return true;
  }

  removeSelected() {
    const commit = () => this.performRemoveSelected();
    this.options.runImmediateOperation('remove-scene-light', 'light', commit);
  }

  updateSelected(mutator: (state: SceneLightState) => void) {
    const commit = () => this.performUpdateSelected(mutator);
    this.options.runImmediateOperation('update-scene-light', 'light', commit);
  }

  setSelectedKind(kind: SceneLightKind) {
    const selected = this.selectedRuntime();
    if (!selected || selected.state.kind === kind) return;
    this.updateSelected(state => {
      state.kind = kind;
    });
  }

  updateScreenSpaceMarkers() {
    this.lights.forEach(runtime => {
      const lightIndex = this.lights.indexOf(runtime);
      const selected = lightIndex >= 0 && this.options.getSelectedItems().includes(this.lightSelectionIndex(lightIndex));
      if (runtime.marker.visible) {
        runtime.marker.scale.setScalar(this.markerScale(
          runtime.marker.position,
          selected ? SELECTED_MARKER_PIXEL_DIAMETER : MARKER_PIXEL_DIAMETER,
        ));
      }
      if (runtime.targetMarker.visible) {
        runtime.targetMarker.scale.setScalar(this.markerScale(runtime.targetMarker.position, TARGET_PIXEL_DIAMETER));
      }
    });
  }

  createDragOperation(ev: PointerEvent): ViewportOperation | null {
    if (
      ev.button !== 0
      || this.options.getEditMode()
      || this.options.isTransformActive()
      || this.options.isTransformGizmoDragging()
    ) {
      return null;
    }
    const lightHit = this.pickHandle(ev);
    if (!lightHit) return null;

    this.options.setSelectedLightId(lightHit.runtime.state.id);
    this.options.selectObject(this.selectedSelectionIndex());
    const runtime = lightHit.runtime;
    const handle = lightHit.handle;
    const dragPoint = handle === 'target' ? runtime.state.target : runtime.state.position;
    this.options.camera.getWorldDirection(this.tmpVec).normalize();
    this.drag.plane.setFromNormalAndCoplanarPoint(this.tmpVec, dragPoint);
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const planeHit = this.options.raycaster.ray.intersectPlane(this.drag.plane, this.tmpVec);
    this.drag.active = true;
    this.drag.moved = false;
    this.drag.pointerId = ev.pointerId;
    this.drag.lightId = runtime.state.id;
    this.drag.handle = handle;
    this.drag.controlsEnabled = this.options.controls.enabled;
    this.drag.startPosition.copy(runtime.state.position);
    this.drag.startTarget.copy(runtime.state.target);
    this.drag.startHit.copy(planeHit ?? dragPoint);
    this.options.controls.enabled = false;
    try {
      this.options.renderer.domElement.setPointerCapture(ev.pointerId);
    } catch {
      // Window handlers still keep the drag alive if pointer capture is unavailable.
    }
    return {
      kind: 'scene-light-drag',
      scope: 'light',
      blocksCamera: true,
      blocksSelection: true,
      blocksContextMenu: true,
      usesPointerCapture: true,
      usesPointerLock: true,
      updatePointer: (point, pointerEvent) => (pointerEvent ? this.updateDrag(pointerEvent, point) : false),
      commit: () => {
        this.endDrag(null, true);
      },
      cancel: () => {
        this.endDrag(null, false);
      },
      cleanup: () => {
        this.releasePointerCapture();
      },
    };
  }

  getPositionForSelection(idx: number) {
    return this.runtimeForSelection(idx)?.state.position.clone() ?? null;
  }

  setPositionForSelection(idx: number, position: THREE.Vector3) {
    const runtime = this.runtimeForSelection(idx);
    if (!runtime) return;
    const delta = position.clone().sub(runtime.state.position);
    runtime.state.position.copy(position);
    if (runtime.state.kind === 'directional') runtime.state.target.add(delta);
    this.syncRuntimes();
    this.options.requestSceneUrlUpdate();
  }

  setTarget(runtime: SceneLightRuntime, target: THREE.Vector3) {
    if (runtime.state.kind !== 'directional') return;
    if (target.distanceToSquared(runtime.state.position) < 1e-8) return;
    runtime.state.target.copy(target);
    this.syncRuntimes();
    this.options.requestSceneUrlUpdate();
  }

  private performRemoveSelected() {
    const selected = this.selectedRuntime();
    if (!selected) return;
    this.options.pushUndoSnapshot();
    const index = this.lights.indexOf(selected);
    const removedSelection = this.lightSelectionIndex(index);
    this.lights.splice(index, 1);
    disposeSceneLightRuntime(this.options.scene, selected);
    this.options.setSelectedLightId(this.lights[Math.min(index, this.lights.length - 1)]?.state.id ?? '');
    this.options.repairSelectionAfterLightRemoval(removedSelection);
    this.panel.sync();
    this.options.updateObjectList();
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();
    this.options.requestSceneUrlUpdate();
  }

  private performUpdateSelected(mutator: (state: SceneLightState) => void) {
    const selected = this.selectedRuntime();
    if (!selected) return;
    const previousKind = selected.state.kind;
    this.options.pushUndoSnapshot();
    mutator(selected.state);
    selected.state = normalizeSceneLightState(selected.state);
    const selectedLightIdx = this.selectedSelectionIndex();
    if (!selected.state.visible && this.options.getSelectedItems().includes(selectedLightIdx)) {
      this.options.clearSelection();
    }
    if (selected.state.kind !== previousKind) {
      rebuildSceneLightRuntimeKind(selected, this.runtimeOptions(false));
    }
    this.syncRuntimes();
    this.panel.sync();
    this.options.updateObjectList();
    this.options.updateTransformActionButtons();
    this.options.requestSceneUrlUpdate();
  }

  private syncIdCounter() {
    let max = 0;
    for (const { state } of this.lights) {
      const match = /^light_(\d+)$/.exec(state.id);
      if (match) max = Math.max(max, Number.parseInt(match[1], 10));
    }
    this.idCounter = Math.max(this.idCounter, max + 1);
  }

  private runtimeOptions(selected = false) {
    return {
      scene: this.options.scene,
      markerGeometry: this.markerGeometry,
      createId: () => this.createId(),
      shadowMapSize: () => this.currentShadowMapSize(),
      selected,
    };
  }

  private syncRendererShadowState() {
    const shadowMapSize = this.currentShadowMapSize();
    const enabled = shadowMapSize > 0 && this.lights.some(runtime => runtime.state.visible && runtime.state.castShadow);
    this.options.renderer.shadowMap.enabled = enabled;
    this.options.renderer.shadowMap.needsUpdate = enabled;
  }

  private markerScale(position: THREE.Vector3, pixelDiameter: number) {
    const viewportHeight = Math.max(1, this.options.renderer.domElement.clientHeight || this.options.renderer.domElement.height);
    const cameraSpace = this.tmpVec.copy(position).applyMatrix4(this.options.camera.matrixWorldInverse);
    const distance = Math.max(0.01, Math.abs(cameraSpace.z));
    const visibleHeight = (2 * distance * Math.tan(THREE.MathUtils.degToRad(this.options.camera.fov) * 0.5)) / this.options.camera.zoom;
    const worldDiameter = (pixelDiameter / viewportHeight) * visibleHeight;
    return Math.max(0.01, worldDiameter / (MARKER_RADIUS * 2));
  }

  private pickHandle(ev: PointerEvent) {
    const markers = this.lights
      .flatMap(runtime => [runtime.targetMarker, runtime.marker])
      .filter(marker => marker.visible);
    if (!markers.length) return null;

    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const hit = this.options.raycaster.intersectObjects(markers, false)[0];
    const lightId = hit?.object.userData.sceneLightId;
    if (typeof lightId !== 'string') return null;
    const runtime = this.lights.find(entry => entry.state.id === lightId) ?? null;
    if (!runtime) return null;
    const handle: SceneLightDragHandle = hit.object.userData.sceneLightHandle === 'target' ? 'target' : 'position';
    return { runtime, handle };
  }

  private updateDrag(ev: PointerEvent, point: { clientX: number; clientY: number } = ev) {
    if (!this.drag.active || ev.pointerId !== this.drag.pointerId) return false;
    const runtime = this.lights.find(entry => entry.state.id === this.drag.lightId);
    if (!runtime) return false;

    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(
      ((point.clientX - rect.left) / rect.width) * 2 - 1,
      -((point.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const hit = this.options.raycaster.ray.intersectPlane(this.drag.plane, this.tmpVec);
    if (!hit) return true;

    const nextPoint = (this.drag.handle === 'target' ? this.drag.startTarget : this.drag.startPosition)
      .clone()
      .add(hit.sub(this.drag.startHit));
    const movedDistance = this.drag.handle === 'target'
      ? nextPoint.distanceToSquared(this.drag.startTarget)
      : nextPoint.distanceToSquared(this.drag.startPosition);
    if (!this.drag.moved && movedDistance > 1e-8) {
      this.options.pushUndoSnapshot();
      this.drag.moved = true;
    }
    if (this.drag.handle === 'target') {
      this.setTarget(runtime, nextPoint);
    } else {
      this.setPositionForSelection(this.lightSelectionIndex(this.lights.indexOf(runtime)), nextPoint);
    }
    ev.preventDefault();
    return true;
  }

  private endDrag(ev: PointerEvent | null, commit: boolean) {
    if (!this.drag.active || (ev && ev.pointerId !== this.drag.pointerId)) return false;
    this.releasePointerCapture();
    if (!commit) {
      const runtime = this.lights.find(entry => entry.state.id === this.drag.lightId);
      if (runtime) {
        runtime.state.position.copy(this.drag.startPosition);
        runtime.state.target.copy(this.drag.startTarget);
      }
    }
    this.options.controls.enabled = this.drag.controlsEnabled;
    this.drag.active = false;
    this.drag.pointerId = -1;
    this.drag.lightId = '';
    this.drag.handle = 'position';
    this.drag.moved = false;
    this.panel.sync();
    if (commit) this.options.requestSceneUrlUpdate();
    ev?.preventDefault();
    return true;
  }

  private releasePointerCapture() {
    try {
      if (this.options.renderer.domElement.hasPointerCapture(this.drag.pointerId)) {
        this.options.renderer.domElement.releasePointerCapture(this.drag.pointerId);
      }
    } catch {
      // Pointer capture release is best-effort.
    }
  }
}

import * as THREE from 'three';

const MARKER_GEOMETRY_RADIUS = 0.012;

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) material.forEach(entry => entry.dispose());
  else material.dispose();
}

function disposeRenderable(renderable: THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }) {
  renderable.geometry?.dispose();
  if (renderable.material) disposeMaterial(renderable.material);
}

type EditOverlayRendererOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

export class EditOverlayRenderer {
  private selectionVertexMarker: THREE.InstancedMesh | null = null;
  private vertexCloud: THREE.InstancedMesh | null = null;
  private faceCenterCloud: THREE.InstancedMesh | null = null;
  private editWireOverlay: THREE.LineSegments | null = null;
  private editComponentOverlay: THREE.LineSegments | null = null;
  private editFaceTintOverlay: THREE.Mesh | null = null;
  private readonly markerMatrix = new THREE.Matrix4();
  private readonly markerPosition = new THREE.Vector3();
  private readonly markerQuaternion = new THREE.Quaternion();
  private readonly tmpVec = new THREE.Vector3();

  constructor(private readonly options: EditOverlayRendererOptions) {}

  clearAll() {
    this.clearSelectionVertexMarker();
    this.clearVertexCloud();
    this.clearFaceCenterCloud();
    this.clearEditWireOverlay();
    this.clearEditComponentOverlay();
  }

  clearSelectionVertexMarker() {
    if (!this.selectionVertexMarker) return;
    this.options.scene.remove(this.selectionVertexMarker);
    disposeMaterial(this.selectionVertexMarker.material);
    this.selectionVertexMarker = null;
  }

  clearVertexCloud() {
    if (!this.vertexCloud) return;
    this.options.scene.remove(this.vertexCloud);
    disposeMaterial(this.vertexCloud.material);
    this.vertexCloud = null;
  }

  clearFaceCenterCloud() {
    if (!this.faceCenterCloud) return;
    this.options.scene.remove(this.faceCenterCloud);
    disposeMaterial(this.faceCenterCloud.material);
    this.faceCenterCloud = null;
  }

  clearEditWireOverlay() {
    if (!this.editWireOverlay) return;
    this.options.scene.remove(this.editWireOverlay);
    disposeMaterial(this.editWireOverlay.material);
    this.editWireOverlay = null;
  }

  clearEditComponentOverlay() {
    if (this.editComponentOverlay) {
      this.options.scene.remove(this.editComponentOverlay);
      disposeRenderable(this.editComponentOverlay);
      this.editComponentOverlay = null;
    }
    this.clearEditFaceTintOverlay();
  }

  clearEditFaceTintOverlay() {
    if (!this.editFaceTintOverlay) return;
    this.options.scene.remove(this.editFaceTintOverlay);
    disposeRenderable(this.editFaceTintOverlay);
    this.editFaceTintOverlay = null;
  }

  setVertexCloud(mesh: THREE.InstancedMesh | null) {
    this.clearVertexCloud();
    this.vertexCloud = mesh;
    if (mesh) this.options.scene.add(mesh);
  }

  setFaceCenterCloud(mesh: THREE.InstancedMesh | null) {
    this.clearFaceCenterCloud();
    this.faceCenterCloud = mesh;
    if (mesh) this.options.scene.add(mesh);
  }

  setSelectionVertexMarker(mesh: THREE.InstancedMesh | null) {
    this.clearSelectionVertexMarker();
    this.selectionVertexMarker = mesh;
    if (mesh) this.options.scene.add(mesh);
  }

  setEditWireOverlay(line: THREE.LineSegments | null) {
    this.clearEditWireOverlay();
    this.editWireOverlay = line;
    if (line) this.options.scene.add(line);
  }

  ensureEditWireOverlayInScene() {
    if (this.editWireOverlay && !this.options.scene.children.includes(this.editWireOverlay)) {
      this.options.scene.add(this.editWireOverlay);
    }
  }

  hasEditWireGeometry(geometry: THREE.BufferGeometry) {
    return this.editWireOverlay?.geometry === geometry;
  }

  setEditComponentOverlay(line: THREE.LineSegments | null) {
    this.clearEditComponentOverlay();
    this.editComponentOverlay = line;
    if (line) this.options.scene.add(line);
  }

  setEditFaceTintOverlay(mesh: THREE.Mesh | null) {
    this.clearEditFaceTintOverlay();
    this.editFaceTintOverlay = mesh;
    if (mesh) this.options.scene.add(mesh);
  }

  updateScreenSpaceMarkerScales(pixelSizes: {
    vertex: number;
    faceCenter: number;
    selected: number;
  }) {
    this.updateInstancedMarkerScale(this.vertexCloud, pixelSizes.vertex);
    this.updateInstancedMarkerScale(this.faceCenterCloud, pixelSizes.faceCenter);
    this.updateInstancedMarkerScale(this.selectionVertexMarker, pixelSizes.selected);
  }

  screenSpaceMarkerScale(position: THREE.Vector3, pixelDiameter: number) {
    const viewportHeight = Math.max(1, this.options.renderer.domElement.clientHeight || this.options.renderer.domElement.height);
    const cameraSpace = this.tmpVec.copy(position).applyMatrix4(this.options.camera.matrixWorldInverse);
    const distance = Math.max(0.01, Math.abs(cameraSpace.z));
    const visibleHeight = (2 * distance * Math.tan(THREE.MathUtils.degToRad(this.options.camera.fov) * 0.5)) / this.options.camera.zoom;
    const worldDiameter = (pixelDiameter / viewportHeight) * visibleHeight;
    return Math.max(0.01, worldDiameter / (MARKER_GEOMETRY_RADIUS * 2));
  }

  private updateInstancedMarkerScale(mesh: THREE.InstancedMesh | null, pixelDiameter: number) {
    if (!mesh || mesh.count <= 0) return;
    const scale = new THREE.Vector3();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, this.markerMatrix);
      this.markerMatrix.decompose(this.markerPosition, this.markerQuaternion, scale);
      const nextScale = this.screenSpaceMarkerScale(this.markerPosition, pixelDiameter);
      this.markerMatrix.compose(
        this.markerPosition,
        this.markerQuaternion,
        scale.setScalar(nextScale),
      );
      mesh.setMatrixAt(i, this.markerMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

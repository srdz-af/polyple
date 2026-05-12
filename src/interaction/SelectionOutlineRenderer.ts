import * as THREE from 'three';

type SelectionOutlineRendererOptions = {
  scene: THREE.Scene;
  getEditMode: () => boolean;
  getSelectionItems: () => number[];
  getObjectVisible: (idx: number) => boolean;
  getSelectionGeometry: (idx: number) => THREE.BufferGeometry | null;
  reconcileSelection: () => void;
};

export class SelectionOutlineRenderer {
  private outlines: THREE.LineSegments[] = [];
  private outlineKeys: number[] = [];

  constructor(private readonly options: SelectionOutlineRendererOptions) {}

  clear() {
    this.outlines.forEach(outline => {
      this.options.scene.remove(outline);
      if (Array.isArray(outline.material)) outline.material.forEach(material => material.dispose());
      else outline.material.dispose();
    });
    this.outlines = [];
    this.outlineKeys = [];
  }

  update() {
    this.options.reconcileSelection();
    const desiredKeys = this.options.getEditMode()
      ? []
      : this.options.getSelectionItems().filter(idx => this.options.getObjectVisible(idx) && this.options.getSelectionGeometry(idx));
    const unchanged = desiredKeys.length === this.outlineKeys.length
      && desiredKeys.every((idx, i) => idx === this.outlineKeys[i]);
    if (unchanged) {
      this.outlines.forEach(outline => {
        if (!this.options.scene.children.includes(outline)) this.options.scene.add(outline);
      });
      return;
    }

    this.clear();
    if (this.options.getEditMode()) return;

    desiredKeys.forEach((idx, selectionIdx) => {
      if (!this.options.getObjectVisible(idx)) return;
      const geom = this.options.getSelectionGeometry(idx);
      if (!geom) return;
      const outline = this.buildOutline(geom, selectionIdx === 0);
      this.outlines.push(outline);
      this.outlineKeys.push(idx);
      this.options.scene.add(outline);
    });
  }

  private buildOutline(geom: THREE.BufferGeometry, primary: boolean) {
    const mat = new THREE.LineBasicMaterial({
      color: 0xffa64d,
      transparent: true,
      opacity: primary ? 1 : 0.38,
      depthTest: false,
      depthWrite: false,
    });
    const outline = new THREE.LineSegments(geom, mat);
    outline.renderOrder = primary ? 10 : 9;
    return outline;
  }
}

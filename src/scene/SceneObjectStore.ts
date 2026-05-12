import type { Instance, SceneLightState } from './types';

export type SceneObjectRow = {
  idx: number;
  label: string;
  dimension: number | string;
  visible: boolean;
};

export type MaterialUsageRow = {
  idx: number;
  label: string;
};

type SceneLightRuntimeLike = {
  state: SceneLightState;
};

type BaseObjectState = {
  M: number;
  label: string;
  originalN: number;
  paramsN: number;
  visible: boolean;
  materialId: string;
};

type SceneObjectStoreOptions<TLight extends SceneLightRuntimeLike> = {
  baseSelection: number;
  noSelection: number;
  lightSelectionBase: number;
  getBase: () => BaseObjectState;
  getInstances: () => Instance[];
  getLights: () => TLight[];
};

export class SceneObjectStore<TLight extends SceneLightRuntimeLike = SceneLightRuntimeLike> {
  constructor(private readonly options: SceneObjectStoreOptions<TLight>) {}

  lightSelectionIndex(lightIndex: number) {
    return this.options.lightSelectionBase - lightIndex;
  }

  isLightSelectionIndex(idx: number) {
    return idx <= this.options.lightSelectionBase && this.options.getLights()[this.options.lightSelectionBase - idx] !== undefined;
  }

  lightIndexFromSelection(idx: number) {
    return this.isLightSelectionIndex(idx) ? this.options.lightSelectionBase - idx : -1;
  }

  lightRuntimeForSelection(idx: number) {
    return this.options.getLights()[this.lightIndexFromSelection(idx)] ?? null;
  }

  isGeometrySelectionIndex(idx: number) {
    return idx === this.options.baseSelection || idx >= 0;
  }

  normalizeSelectionIndex(idx: number) {
    const base = this.options.getBase();
    if (idx === this.options.baseSelection) return base.M > 0 ? idx : this.options.noSelection;
    if (idx >= 0) return this.options.getInstances()[idx] ? idx : this.options.noSelection;
    return this.isLightSelectionIndex(idx) ? idx : this.options.noSelection;
  }

  isSelectableObject(idx: number) {
    return this.normalizeSelectionIndex(idx) === idx;
  }

  getObjectVisible(idx: number) {
    const base = this.options.getBase();
    if (idx === this.options.baseSelection) return base.M > 0 && base.visible;
    if (idx >= 0) return this.options.getInstances()[idx]?.visible ?? false;
    if (this.isLightSelectionIndex(idx)) return this.lightRuntimeForSelection(idx)?.state.visible ?? false;
    return false;
  }

  objectRows(): SceneObjectRow[] {
    const base = this.options.getBase();
    return [
      ...(base.M > 0 ? [{
        idx: this.options.baseSelection,
        label: base.label,
        dimension: base.originalN || base.paramsN,
        visible: base.visible,
      }] : []),
      ...this.options.getInstances().map((inst, idx) => ({
        idx,
        label: inst.label,
        dimension: inst.originalN,
        visible: inst.visible,
      })),
      ...this.options.getLights().map((runtime, idx) => ({
        idx: this.lightSelectionIndex(idx),
        label: runtime.state.label,
        dimension: runtime.state.kind === 'point' ? 'Point' : 'Dir',
        visible: runtime.state.visible,
      })),
    ];
  }

  objectLabel(idx: number) {
    const base = this.options.getBase();
    if (idx === this.options.baseSelection) return base.label;
    return this.options.getInstances()[idx]?.label ?? `Object ${idx + 1}`;
  }

  objectMaterialId(idx: number) {
    const base = this.options.getBase();
    if (idx === this.options.baseSelection) return base.materialId;
    return this.options.getInstances()[idx]?.materialId ?? '';
  }

  materialUsageRows(materialId: string): MaterialUsageRow[] {
    const base = this.options.getBase();
    const rows: MaterialUsageRow[] = [];
    if (base.M > 0 && base.materialId === materialId) {
      rows.push({ idx: this.options.baseSelection, label: base.label });
    }
    this.options.getInstances().forEach((inst, idx) => {
      if (inst.materialId === materialId) rows.push({ idx, label: inst.label });
    });
    return rows;
  }

  referencedMaterialIds() {
    const base = this.options.getBase();
    const ids = new Set<string>();
    if (base.M > 0) ids.add(base.materialId);
    this.options.getInstances().forEach(inst => ids.add(inst.materialId));
    return ids;
  }
}

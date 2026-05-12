import { DEFAULT_SURFACE, cloneSurface, normalizeSurface, surfacesEqual, type SurfaceState } from './surface';
import type { Instance, SceneMaterialState } from './types';
import type { MaterialUsageRow } from './SceneObjectStore';

export type SceneMaterialTextureEntry = {
  id: string;
  name: string;
  surface: SurfaceState;
  objectLabels: string[];
};

export type SceneMaterialTextureTarget = {
  materialId: string;
  material: SceneMaterialTextureEntry;
  materials: SceneMaterialTextureEntry[];
  canSplit: boolean;
  hasObjectTarget: boolean;
};

type SceneMaterialBaseState = {
  M: number;
  materialId: string;
  surface: SurfaceState;
};

type SceneMaterialServiceOptions = {
  baseSelection: number;
  getBase: () => SceneMaterialBaseState;
  setBaseMaterialId: (materialId: string) => void;
  getInstances: () => Instance[];
  getSelectedIndex: () => number;
  isGeometrySelectionIndex: (idx: number) => boolean;
  isSelectableObject: (idx: number) => boolean;
  objectMaterialId: (idx: number) => string;
  objectLabel: (idx: number) => string;
  materialUsageRows: (materialId: string) => MaterialUsageRow[];
  referencedMaterialIds: () => Set<string>;
  applyMaterialToObject: (idx: number, material: SceneMaterialState) => boolean;
  pushUndoSnapshot: () => void;
  updateObjectList: () => void;
  updateTexturePanel: () => void;
  requestSceneUrlUpdate: () => void;
};

export class SceneMaterialService {
  private slots: SceneMaterialState[] = [{ id: 'mat_1', name: 'Material 1', surface: cloneSurface(DEFAULT_SURFACE) }];
  private materialIdCounter = 2;
  private textureEditorMaterialId = 'mat_1';

  constructor(private readonly options: SceneMaterialServiceOptions) {}

  createMaterialId() {
    return `mat_${this.materialIdCounter++}`;
  }

  setMaterials(materials: SceneMaterialState[]) {
    this.slots = materials.length
      ? materials.map((material, idx) => ({
        id: material.id || `mat_${idx + 1}`,
        name: material.name?.trim() || `Material ${idx + 1}`,
        surface: cloneSurface(normalizeSurface(material.surface)),
      }))
      : [this.createSceneMaterial(DEFAULT_SURFACE, 'Material 1')];
    this.syncMaterialIdCounter();
    this.textureEditorMaterialId = this.slots[0]?.id ?? 'mat_1';
  }

  materialsSnapshot() {
    return this.slots.map(material => ({
      id: material.id,
      name: material.name,
      surface: cloneSurface(material.surface),
    }));
  }

  materialSlotById(id: string | undefined) {
    return this.slots.find(material => material.id === id) ?? null;
  }

  ensureMaterialSlot(id: string | undefined, fallbackSurface = DEFAULT_SURFACE, fallbackName?: string) {
    const existing = this.materialSlotById(id);
    if (existing) return existing;

    const material = this.createSceneMaterial(fallbackSurface, fallbackName);
    this.slots.push(material);
    return material;
  }

  defaultMaterialId(fallbackName = 'Material 1') {
    return this.slots[0]?.id ?? this.ensureMaterialSlot(undefined, DEFAULT_SURFACE, fallbackName).id;
  }

  surfaceForMaterialOrFallback(id: string | undefined, fallbackSurface = DEFAULT_SURFACE) {
    return cloneSurface(this.materialSlotById(id)?.surface ?? normalizeSurface(fallbackSurface));
  }

  deriveMaterialsFromSurfaces(
    base: { surface: SurfaceState | undefined; materialId?: string },
    instances: Array<{ surface: SurfaceState | undefined; materialId?: string }>,
  ) {
    const derivedMaterials: SceneMaterialState[] = [];
    const addDerivedMaterial = (surface: SurfaceState | undefined, name: string, id?: string) => {
      const normalized = normalizeSurface(surface);
      const existing = id
        ? derivedMaterials.find(material => material.id === id)
        : derivedMaterials.find(material => surfacesEqual(material.surface, normalized));
      if (existing) return existing.id;
      const material = {
        id: id || `mat_${derivedMaterials.length + 1}`,
        name,
        surface: normalized,
      };
      derivedMaterials.push(material);
      return material.id;
    };

    const baseMaterialId = addDerivedMaterial(base.surface, 'Material 1', base.materialId);
    const instanceMaterialIds = instances.map((instance, idx) => (
      addDerivedMaterial(instance.surface, `Material ${idx + 2}`, instance.materialId)
    ));
    this.setMaterials(derivedMaterials);
    return { baseMaterialId, instanceMaterialIds };
  }

  setObjectMaterialId(idx: number, materialId: string) {
    const material = this.ensureMaterialSlot(materialId);
    return this.options.applyMaterialToObject(idx, material);
  }

  reconcile() {
    if (!this.slots.length) this.setMaterials([this.createSceneMaterial(DEFAULT_SURFACE, 'Material 1')]);

    const base = this.options.getBase();
    if (base.M > 0 && !this.materialSlotById(base.materialId)) {
      const matched = this.slots.find(material => surfacesEqual(material.surface, base.surface));
      this.options.setBaseMaterialId(matched?.id ?? this.ensureMaterialSlot(undefined, base.surface, 'Material 1').id);
    }

    this.options.getInstances().forEach((inst, idx) => {
      if (this.materialSlotById(inst.materialId)) return;
      const matched = this.slots.find(material => surfacesEqual(material.surface, inst.surface));
      inst.materialId = matched?.id ?? this.ensureMaterialSlot(undefined, inst.surface, `Material ${idx + 2}`).id;
    });

    const used = this.options.referencedMaterialIds();
    this.slots = this.slots.filter(material => used.has(material.id));
    if (!this.slots.length) {
      const material = this.createSceneMaterial(DEFAULT_SURFACE, 'Material 1');
      this.slots = [material];
      if (base.M > 0) this.options.setBaseMaterialId(material.id);
    }
    if (!this.materialSlotById(this.textureEditorMaterialId)) this.textureEditorMaterialId = this.slots[0]?.id ?? 'mat_1';
  }

  sceneMaterialEntriesForTexture() {
    this.reconcile();
    return this.slots.map(material => {
      const usage = this.options.materialUsageRows(material.id);
      return {
        id: material.id,
        name: material.name,
        surface: cloneSurface(material.surface),
        objectLabels: usage.map(row => row.label),
      };
    });
  }

  getTextureMaterialTarget(): SceneMaterialTextureTarget | null {
    this.reconcile();
    const selected = this.options.getSelectedIndex();
    const hasObjectTarget = this.options.isGeometrySelectionIndex(selected) && this.options.isSelectableObject(selected);
    const materialId = hasObjectTarget
      ? this.options.objectMaterialId(selected)
      : (this.materialSlotById(this.textureEditorMaterialId)?.id ?? this.defaultMaterialId());
    const material = this.ensureMaterialSlot(materialId);
    this.textureEditorMaterialId = material.id;
    const usage = this.options.materialUsageRows(material.id);
    return {
      materialId: material.id,
      material: {
        id: material.id,
        name: material.name,
        surface: cloneSurface(material.surface),
        objectLabels: usage.map(row => row.label),
      },
      materials: this.sceneMaterialEntriesForTexture(),
      canSplit: hasObjectTarget && usage.length > 1,
      hasObjectTarget,
    };
  }

  assignMaterialToSelection(materialId: string, recordUndo: boolean) {
    const material = this.materialSlotById(materialId);
    if (!material) return false;

    const selected = this.options.getSelectedIndex();
    if (!this.options.isGeometrySelectionIndex(selected) || !this.options.isSelectableObject(selected)) {
      this.textureEditorMaterialId = material.id;
      this.options.updateTexturePanel();
      return true;
    }

    if (this.options.objectMaterialId(selected) === material.id) return false;
    if (recordUndo) this.options.pushUndoSnapshot();
    const changed = this.setObjectMaterialId(selected, material.id);
    if (!changed) return false;
    this.textureEditorMaterialId = material.id;
    this.reconcile();
    this.options.updateObjectList();
    this.options.updateTexturePanel();
    this.options.requestSceneUrlUpdate();
    return true;
  }

  renameMaterial(materialId: string, name: string, recordUndo: boolean) {
    const material = this.materialSlotById(materialId);
    const clean = name.trim();
    if (!material || !clean || material.name === clean) {
      this.options.updateTexturePanel();
      return false;
    }
    if (recordUndo) this.options.pushUndoSnapshot();
    material.name = clean;
    this.options.updateTexturePanel();
    this.options.requestSceneUrlUpdate();
    return true;
  }

  splitSelectedMaterial(recordUndo: boolean) {
    const selected = this.options.getSelectedIndex();
    if (!this.options.isGeometrySelectionIndex(selected) || !this.options.isSelectableObject(selected)) return false;
    const current = this.materialSlotById(this.options.objectMaterialId(selected));
    if (!current) return false;
    const usage = this.options.materialUsageRows(current.id);
    if (usage.length <= 1) return false;
    if (recordUndo) this.options.pushUndoSnapshot();
    const label = this.options.objectLabel(selected);
    const material = this.createSceneMaterial(current.surface, `${label} material`);
    this.slots.push(material);
    const changed = this.setObjectMaterialId(selected, material.id);
    if (!changed) return false;
    this.reconcile();
    this.options.updateObjectList();
    this.options.updateTexturePanel();
    this.options.requestSceneUrlUpdate();
    return true;
  }

  applySurfaceToSelectionMaterial(surface: SurfaceState, recordUndo: boolean) {
    const selected = this.options.getSelectedIndex();
    const material = this.ensureMaterialSlot(
      this.options.isGeometrySelectionIndex(selected) && this.options.isSelectableObject(selected)
        ? this.options.objectMaterialId(selected)
        : this.textureEditorMaterialId,
    );
    this.textureEditorMaterialId = material.id;
    const nextSurface = normalizeSurface(surface);
    const changed = !surfacesEqual(material.surface, nextSurface);
    if (changed && recordUndo) this.options.pushUndoSnapshot();

    if (changed) {
      material.surface = cloneSurface(nextSurface);
      const base = this.options.getBase();
      if (base.M > 0 && base.materialId === material.id) this.setObjectMaterialId(this.options.baseSelection, material.id);
      this.options.getInstances().forEach((inst, idx) => {
        if (inst.materialId === material.id) this.setObjectMaterialId(idx, material.id);
      });
      this.options.requestSceneUrlUpdate();
    }
    return changed;
  }

  private createSceneMaterial(surface: SurfaceState, name?: string): SceneMaterialState {
    const materialNumber = this.slots.length + 1;
    return {
      id: this.createMaterialId(),
      name: name?.trim() || `Material ${materialNumber}`,
      surface: cloneSurface(normalizeSurface(surface)),
    };
  }

  private syncMaterialIdCounter() {
    let max = 0;
    for (const material of this.slots) {
      const match = /^mat_(\d+)$/.exec(material.id);
      if (match) max = Math.max(max, Number.parseInt(match[1], 10));
    }
    this.materialIdCounter = Math.max(this.materialIdCounter, max + 1);
  }
}

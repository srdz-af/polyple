import { MAX_N } from '../constants';
import { cellCount, type CellTopology } from '../geometry/cellTopology';
import type { EditOperationRequest } from '../interaction/ViewportInteractionController';

type EditToolbarControllerOptions = {
  getEditMode: () => boolean;
  getObjectVisible: () => boolean;
  getObjectDimension: () => number;
  getTopology: () => CellTopology | undefined;
  getActiveCellDimension: () => number;
  setCellDimension: (dimension: number) => void;
  canStartOperation: (request: EditOperationRequest) => boolean;
  startOperation: (request: EditOperationRequest) => void;
  getOperationLevelState: () => {
    label: string;
    value: number;
    min: number;
    max: number;
  } | null;
  changeOperationLevel: (delta: number) => void;
};

function editCellDimensionIcon(dimension: number) {
  if (dimension === 0) return 'line_end_circle';
  if (dimension === 1) return 'diagonal_line';
  if (dimension === 2) return 'square';
  if (dimension === 3) return 'deployed_code';
  return `filter_${Math.max(4, Math.min(8, dimension))}`;
}

function editCellDimensionTitle(dimension: number) {
  if (dimension === 0) return 'Vertex selection (1)';
  if (dimension === 1) return 'Edge selection (2)';
  if (dimension === 2) return 'Face selection (3)';
  if (dimension === 3) return 'Volume selection (4)';
  return `${dimension}-cell selection (${dimension + 1})`;
}

export class EditToolbarController {
  private readonly cellDimensionButtons = document.getElementById('edit-cell-dimension-buttons') as HTMLDivElement | null;
  private readonly operationButtons = document.getElementById('edit-operation-buttons') as HTMLDivElement | null;
  private readonly bevelButton = document.getElementById('edit-bevel-button') as HTMLButtonElement | null;
  private readonly insetButton = document.getElementById('edit-inset-button') as HTMLButtonElement | null;
  private readonly extrudeButton = document.getElementById('edit-extrude-button') as HTMLButtonElement | null;
  private readonly loopCutButton = document.getElementById('edit-loop-cut-button') as HTMLButtonElement | null;
  private readonly levelControls = document.getElementById('edit-operation-level-controls') as HTMLDivElement | null;
  private readonly levelDecreaseButton = document.getElementById('edit-level-decrease-button') as HTMLButtonElement | null;
  private readonly levelIncreaseButton = document.getElementById('edit-level-increase-button') as HTMLButtonElement | null;
  private readonly levelValue = document.getElementById('edit-operation-level-value') as HTMLSpanElement | null;
  private bound = false;

  constructor(private readonly options: EditToolbarControllerOptions) {}

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.bevelButton?.addEventListener('click', () => this.options.startOperation({ type: 'bevel', kind: 'edge' }));
    this.insetButton?.addEventListener('click', () => this.options.startOperation({ type: 'inset' }));
    this.extrudeButton?.addEventListener('click', () => this.options.startOperation({ type: 'extrude' }));
    this.loopCutButton?.addEventListener('click', () => this.options.startOperation({ type: 'loopCut' }));
    this.levelDecreaseButton?.addEventListener('click', () => {
      this.options.changeOperationLevel(-1);
      this.syncOperationButtons();
    });
    this.levelIncreaseButton?.addEventListener('click', () => {
      this.options.changeOperationLevel(1);
      this.syncOperationButtons();
    });
  }

  sync() {
    this.syncOperationButtons();
    this.syncCellDimensionButtons();
  }

  private syncOperationButtons() {
    if (!this.operationButtons) return;
    const visible = this.options.getEditMode();
    this.operationButtons.hidden = !visible;
    if (this.bevelButton) this.bevelButton.disabled = !this.options.canStartOperation({ type: 'bevel', kind: 'edge' });
    if (this.insetButton) this.insetButton.disabled = !this.options.canStartOperation({ type: 'inset' });
    if (this.extrudeButton) this.extrudeButton.disabled = !this.options.canStartOperation({ type: 'extrude' });
    if (this.loopCutButton) this.loopCutButton.disabled = !this.options.canStartOperation({ type: 'loopCut' });
    this.syncOperationLevelControls(visible);
  }

  private syncOperationLevelControls(visible: boolean) {
    const state = visible ? this.options.getOperationLevelState() : null;
    if (!this.levelControls) return;
    this.levelControls.hidden = !state;
    if (!state) return;

    this.levelControls.title = state.label;
    this.levelControls.setAttribute('aria-label', state.label);
    if (this.levelValue) this.levelValue.textContent = String(state.value);
    if (this.levelDecreaseButton) {
      this.levelDecreaseButton.disabled = state.value <= state.min;
      this.levelDecreaseButton.title = `Decrease ${state.label}`;
    }
    if (this.levelIncreaseButton) {
      this.levelIncreaseButton.disabled = state.value >= state.max;
      this.levelIncreaseButton.title = `Increase ${state.label}`;
    }
  }

  private syncCellDimensionButtons() {
    if (!this.cellDimensionButtons) return;

    const topology = this.options.getTopology();
    const count = this.options.getEditMode() && this.options.getObjectVisible()
      ? Math.max(0, Math.min(MAX_N, this.options.getObjectDimension()))
      : 0;

    if (!topology || count <= 0) {
      this.cellDimensionButtons.hidden = true;
      this.cellDimensionButtons.dataset.signature = '';
      this.cellDimensionButtons.replaceChildren();
      return;
    }

    const active = this.options.getActiveCellDimension();
    const availability = Array.from({ length: count }, (_entry, dimension) => cellCount(topology, dimension) > 0);
    const signature = `${count}:${active}:${availability.map(enabled => enabled ? '1' : '0').join('')}`;
    if (this.cellDimensionButtons.dataset.signature === signature) {
      this.cellDimensionButtons.hidden = false;
      return;
    }

    this.cellDimensionButtons.dataset.signature = signature;
    this.cellDimensionButtons.hidden = false;
    this.cellDimensionButtons.replaceChildren();

    for (let dimension = 0; dimension < count; dimension++) {
      const button = document.createElement('button');
      const icon = document.createElement('span');
      const enabled = availability[dimension];
      button.type = 'button';
      button.className = dimension === active ? 'active' : '';
      button.disabled = !enabled;
      button.title = editCellDimensionTitle(dimension);
      button.setAttribute('aria-label', button.title);
      button.setAttribute('aria-pressed', String(dimension === active));
      icon.className = 'material-symbols-rounded';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = editCellDimensionIcon(dimension);
      button.appendChild(icon);
      button.addEventListener('click', () => this.options.setCellDimension(dimension));
      this.cellDimensionButtons.appendChild(button);
    }
  }
}

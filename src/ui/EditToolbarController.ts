import { MAX_N } from '../constants';
import { cellCount, type CellTopology } from '../geometry/cellTopology';

type EditToolbarControllerOptions = {
  getEditMode: () => boolean;
  getObjectVisible: () => boolean;
  getObjectDimension: () => number;
  getTopology: () => CellTopology | undefined;
  getActiveCellDimension: () => number;
  setCellDimension: (dimension: number) => void;
  canStartBevel: () => boolean;
  canStartInset: () => boolean;
  canStartExtrude: () => boolean;
  startBevel: () => void;
  startInset: () => void;
  startExtrude: () => void;
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
  private bound = false;

  constructor(private readonly options: EditToolbarControllerOptions) {}

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.bevelButton?.addEventListener('click', this.options.startBevel);
    this.insetButton?.addEventListener('click', this.options.startInset);
    this.extrudeButton?.addEventListener('click', this.options.startExtrude);
  }

  sync() {
    this.syncOperationButtons();
    this.syncCellDimensionButtons();
  }

  private syncOperationButtons() {
    if (!this.operationButtons) return;
    const visible = this.options.getEditMode();
    this.operationButtons.hidden = !visible;
    if (this.bevelButton) this.bevelButton.disabled = !this.options.canStartBevel();
    if (this.insetButton) this.insetButton.disabled = !this.options.canStartInset();
    if (this.extrudeButton) this.extrudeButton.disabled = !this.options.canStartExtrude();
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

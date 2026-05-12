import { MAX_N } from '../constants';

type DimensionControlControllerOptions = {
  getDimension: () => number;
  setDimension: (dimension: number) => void;
};

export class DimensionControlController {
  private readonly value = document.getElementById('dimension-value') as HTMLOutputElement | null;
  private readonly downButton = document.getElementById('dimension-down') as HTMLButtonElement | null;
  private readonly upButton = document.getElementById('dimension-up') as HTMLButtonElement | null;
  private bound = false;

  constructor(private readonly options: DimensionControlControllerOptions) {}

  sync() {
    const dimension = this.options.getDimension();
    if (this.value) this.value.textContent = `${dimension}D`;
    if (this.downButton) this.downButton.disabled = dimension <= 3;
    if (this.upButton) this.upButton.disabled = dimension >= MAX_N;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.downButton?.addEventListener('click', () => this.options.setDimension(this.options.getDimension() - 1));
    this.upButton?.addEventListener('click', () => this.options.setDimension(this.options.getDimension() + 1));
  }
}

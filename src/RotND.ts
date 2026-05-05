export class RotND {
  readonly N: number;
  private R: Float32Array;

  constructor(N: number) {
    this.N = N;
    this.R = new Float32Array(N * N);
    for (let i = 0; i < N; i++) this.R[i * N + i] = 1;
  }

  reset(): void {
    this.R.fill(0);
    for (let i = 0; i < this.N; i++) this.R[i * this.N + i] = 1;
  }

  get matrix(): Float32Array {
    return this.R;
  }

  // Left-apply a Givens rotation: R := G(i, j, theta) * R.
  applyGivensLeft(i: number, j: number, theta: number): void {
    if (i === j) return;
    const N = this.N;
    const c = Math.cos(theta), s = Math.sin(theta);
    for (let k = 0; k < N; k++) {
      const Rik = this.R[i * N + k], Rjk = this.R[j * N + k];
      this.R[i * N + k] = c * Rik - s * Rjk;
      this.R[j * N + k] = s * Rik + c * Rjk;
    }
  }
}

export type Plane = {
  i: number;
  j: number;
  theta: number;
  auto: boolean;
  speed: number;
  _lastTheta?: number;
};

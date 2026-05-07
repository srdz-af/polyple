export const MAX_N = 8;

export const AXIS_PALETTE = [
  '#ff6b6b',
  '#4caf50',
  '#2196f3',
  '#9b59b6',
  '#f0c674',
  '#1abc9c',
  '#e67e22',
  '#ecf0f1',
] as const;

export type ViewMode = 'wireframe' | 'solid' | 'faceted';

export const VIEW_MODES: readonly ViewMode[] = ['wireframe', 'solid', 'faceted'];

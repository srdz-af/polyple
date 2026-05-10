import * as THREE from 'three';

type FadingGridOptions = {
  y?: number;
  radius?: number;
  step?: number;
  opacity?: number;
  fadeStart?: number;
  fadeBuckets?: number;
  color?: number;
};

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export function createFadingGrid(options: FadingGridOptions = {}) {
  const gridGroup = new THREE.Group();
  const gridRadius = options.radius ?? 30;
  const gridStep = options.step ?? 1;
  const gridOpacity = options.opacity ?? 0.4;
  const gridFadeStart = options.fadeStart ?? 0.62;
  const gridFadeBuckets = options.fadeBuckets ?? 36;
  const gridColor = options.color ?? 0x3a414f;
  const gridBuckets = Array.from({ length: gridFadeBuckets }, () => [] as number[]);
  gridGroup.position.y = options.y ?? 0;

  const gridFadeAt = (x: number, z: number) => {
    const radial = Math.hypot(x, z) / gridRadius;
    return 1 - smoothstep(gridFadeStart, 1, radial);
  };

  const addGridSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const fade = gridFadeAt((x1 + x2) * 0.5, (z1 + z2) * 0.5);
    if (fade <= 0.01) return;
    const bucket = Math.min(gridFadeBuckets - 1, Math.max(0, Math.floor(fade * gridFadeBuckets)));
    gridBuckets[bucket].push(x1, 0, z1, x2, 0, z2);
  };

  const addClippedGridLine = (fixed: number, alongX: boolean) => {
    const limit = Math.sqrt(Math.max(0, gridRadius * gridRadius - fixed * fixed));
    const stops = [-limit];
    const first = Math.ceil(-limit / gridStep) * gridStep;

    for (let v = first; v < limit; v += gridStep) {
      if (v > -limit) stops.push(v);
    }

    stops.push(limit);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (alongX) addGridSegment(a, fixed, b, fixed);
      else addGridSegment(fixed, a, fixed, b);
    }
  };

  for (let i = -gridRadius; i <= gridRadius; i += gridStep) {
    addClippedGridLine(i, true);
    addClippedGridLine(i, false);
  }

  for (let i = 0; i < gridBuckets.length; i++) {
    const positions = gridBuckets[i];
    if (!positions.length) continue;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: gridColor,
      opacity: gridOpacity * ((i + 0.5) / gridFadeBuckets),
      transparent: true,
      depthWrite: false,
    });
    gridGroup.add(new THREE.LineSegments(geometry, material));
  }

  return gridGroup;
}

export function createBidirectionalAxes(size = 1000) {
  const positions = new Float32Array([
    -size, 0, 0, size, 0, 0,
    0, -size, 0, 0, size, 0,
    0, 0, -size, 0, 0, size,
  ]);
  const colors = new Float32Array(18);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return new THREE.LineSegments(geometry, material);
}

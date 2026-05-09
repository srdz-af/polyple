import type { SurfaceMaterial } from '../rendering/HypercubeRenderer';

export type SurfaceState = SurfaceMaterial;

export const DEFAULT_SURFACE: SurfaceState = {
  materialType: 'standard',
  color: 0xbfc7d5,
  metalness: 0,
  roughness: 0.55,
  alpha: 1,
  transmission: 1,
  ior: 1.45,
  thickness: 0.75,
  attenuationDistance: 5,
  attenuationColor: 0xffffff,
  clearcoat: 0,
  clearcoatRoughness: 0.5,
  specularIntensity: 0.5,
  emissiveColor: 0x000000,
  emissiveIntensity: 0,
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const normalizeSurface = (surface: Partial<SurfaceState> | undefined): SurfaceState => ({
  materialType: surface?.materialType === 'glass' ? 'glass' : 'standard',
  color: Math.max(0, Math.min(0xffffff, (surface?.color ?? DEFAULT_SURFACE.color) >>> 0)),
  metalness: clamp01(surface?.metalness ?? DEFAULT_SURFACE.metalness),
  roughness: clamp01(surface?.roughness ?? DEFAULT_SURFACE.roughness),
  alpha: clamp01(surface?.alpha ?? DEFAULT_SURFACE.alpha),
  transmission: clamp01(surface?.transmission ?? DEFAULT_SURFACE.transmission),
  ior: clamp(surface?.ior ?? DEFAULT_SURFACE.ior, 1, 2.333),
  thickness: clamp(surface?.thickness ?? DEFAULT_SURFACE.thickness, 0, 20),
  attenuationDistance: clamp(surface?.attenuationDistance ?? DEFAULT_SURFACE.attenuationDistance, 0.001, 100),
  attenuationColor: Math.max(0, Math.min(0xffffff, (surface?.attenuationColor ?? DEFAULT_SURFACE.attenuationColor) >>> 0)),
  clearcoat: clamp01(surface?.clearcoat ?? DEFAULT_SURFACE.clearcoat),
  clearcoatRoughness: clamp01(surface?.clearcoatRoughness ?? DEFAULT_SURFACE.clearcoatRoughness),
  specularIntensity: clamp(surface?.specularIntensity ?? DEFAULT_SURFACE.specularIntensity, 0, 2),
  emissiveColor: Math.max(0, Math.min(0xffffff, (surface?.emissiveColor ?? DEFAULT_SURFACE.emissiveColor) >>> 0)),
  emissiveIntensity: clamp(surface?.emissiveIntensity ?? DEFAULT_SURFACE.emissiveIntensity, 0, 20),
});

export const cloneSurface = (surface: SurfaceState): SurfaceState => ({ ...surface });

export const surfacesEqual = (a: SurfaceState, b: SurfaceState) => (
  a.materialType === b.materialType
  && a.color === b.color
  && Math.abs(a.metalness - b.metalness) <= 1e-6
  && Math.abs(a.roughness - b.roughness) <= 1e-6
  && Math.abs(a.alpha - b.alpha) <= 1e-6
  && Math.abs(a.transmission - b.transmission) <= 1e-6
  && Math.abs(a.ior - b.ior) <= 1e-6
  && Math.abs(a.thickness - b.thickness) <= 1e-6
  && Math.abs(a.attenuationDistance - b.attenuationDistance) <= 1e-6
  && a.attenuationColor === b.attenuationColor
  && Math.abs(a.clearcoat - b.clearcoat) <= 1e-6
  && Math.abs(a.clearcoatRoughness - b.clearcoatRoughness) <= 1e-6
  && Math.abs(a.specularIntensity - b.specularIntensity) <= 1e-6
  && a.emissiveColor === b.emissiveColor
  && Math.abs(a.emissiveIntensity - b.emissiveIntensity) <= 1e-6
);

export function toColorHex(color: number) {
  return `#${Math.max(0, Math.min(0xffffff, color >>> 0)).toString(16).padStart(6, '0')}`;
}

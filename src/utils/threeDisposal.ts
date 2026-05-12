import * as THREE from 'three';

export function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) material.forEach(entry => entry.dispose());
  else material.dispose();
}

export function disposeRenderable(renderable: THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
}) {
  renderable.geometry?.dispose();
  if (renderable.material) disposeMaterial(renderable.material);
}

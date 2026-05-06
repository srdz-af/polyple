<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/logo_light.png">
  <img alt="BleND logo" src="public/logo_light.png">
</picture>

# BleND

BleND is an interactive N-dimensional geometry viewer built with **Three.js**.

It lets you create, inspect, transform, and edit high-dimensional objects, then project them into 3D.

![preview](public/preview.gif)

Live demo:
https://srdz-af.github.io/BleND/

## What It Supports

- N-dimensional primitives
- Canonical projection using selected axes
- Global N-D rotation with per-axis auto-rotation controls
- Object transforms (move/rotate/scale)
- Vertex edit mode (move vertex)
- Multiple objects, per-object visibility, rename, delete
- Per-object surface settings (base color, metallic, roughness, alpha)
- View modes: wireframe, transparent, solid
- JSON import/export
- Undo/redo

## Quick Start

Requirements:
- Node.js 18+ (recommended)

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Main Controls

Camera:

```text
Left mouse drag: orbit
Mouse wheel: zoom
Middle mouse drag: cycle projected axis triples
Axis gizmo drag: orbit camera
Axis gizmo endpoint click: snap view to axis
```

Global N-D rotation:

```text
W gizmo (purple dial): rotate global space on the active W plane (4D+)
Extra-axis gizmo mini play button: cycle auto-rotation through 1x, 2x, 3x, then stop
Extra-axis gizmo depth icon: include/exclude that axis from perspective depth
```

Object operations:

```text
Shift + A: add object menu
G: move selected object
R: rotate selected object
S: scale selected object
X: delete selected object (with confirm)
Right click: context menu (add/transform/delete depending selection)
```

Mobile transforms:

```text
Touch and drag the Move / Rotate / Scale toolbar buttons to transform the selected object
Release touch to confirm the transform
```

While a transform is active:

```text
X / Y / Z: lock transform axis
W (during rotate): toggle W-plane rotation mode
Left click: confirm
Right click: cancel
```

Edit mode:

```text
Tab: toggle edit mode
Left click vertex: select vertex
Right click selected vertex: open vertex move action
```

History:

```text
Ctrl+Z / Cmd+Z: undo
Ctrl+Y / Cmd+Y: redo
Ctrl+Shift+Z / Cmd+Shift+Z: redo
```

## UI Overview

- **View mode buttons**: Wireframe / Transparent / Solid / Faceted (shared colors per coplanar outer face region)
- **Scene actions**: Import JSON, Export JSON, Edit mode
- **Axis order panel**: drag to reorder active dimensions
- **Object list**: select, rename, hide/show objects
- **Dimension selector**: sets dimension for newly created primitives
- **Texture panel**: per-selected-object surface controls and preview cube
- **Extra-axis gizmos**: per-axis high-dimensional rotation dials with mini play, 2x, 3x, stop auto-rotate toggles

## JSON Import / Export

Accepted import format:

```json
{
  "points": [
    { "d0": 0.0, "d1": 0.5, "d2": -0.5 },
    { "d0": 1.0, "d1": 0.5, "d2": 0.0 }
  ],
  "edges": [[0, 1]],
  "adjacency": { "0": [1], "1": [0] }
}
```

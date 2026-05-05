# BleND

BleND is an interactive N-dimensional geometry viewer built with **Three.js**, **TypeScript**, and **Vite**.

It lets you create, inspect, transform, and edit high-dimensional objects, then project them into 3D.

![preview](preview.gif)

Live demo:
https://srdz-af.github.io/BleND/

Repository:
https://github.com/srdz-af/BleND

## What It Supports

- N-dimensional primitives (3D to 8D)
- Canonical projection using selected axes
- Global N-D rotation and auto-rotation
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

## Core Model

- Internal max dimension is **8** (`MAX_N`).
- Primitives are generated at the selected dimension and embedded into the internal 8D storage.
- Rendering projects current selected dimensions into 3D.
- Axis ordering determines which dimensions appear as X/Y/Z.

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
Bottom-right play button: toggle auto-rotation
W gizmo (purple dial): rotate global space on the active W plane (4D+)
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

- **View mode buttons**: Wireframe / Transparent / Solid
- **Scene actions**: Import JSON, Export JSON, Edit mode
- **Axis order panel**: drag to reorder active dimensions
- **Object list**: select, rename, hide/show objects
- **Dimension selector**: sets dimension for newly created primitives
- **Texture panel**: per-selected-object surface controls and preview cube
- **W gizmo**: global W-axis rotation dial (enabled in 4D+)

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

Notes:
- `points` are required and can be arrays or keyed objects (`d0`, `d1`, ...).
- `edges` and `adjacency` are optional.
- Imported datasets must be between **3 and 8 dimensions** to visualize in the app.
- Import replaces the base object and clears extra instances.
- Export writes geometry only (textures/material settings are not serialized).

## Current Scope Notes

- The current UI exposes **canonical axis projection workflow**.
- PCA projection code exists in the codebase but is not currently exposed as a direct UI mode toggle.
- No Tweakpane dependency is used in the current app.

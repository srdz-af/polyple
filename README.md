<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/logo_light.png">
  <img alt="BleND logo" src="public/logo_light.png">
</picture>

# BleND

BleND is an interactive N-dimensional geometry viewer built with **Three.js**.

It lets you create, inspect, transform, and edit high-dimensional objects, then project them into 3D.

<video src="public/preview.webm" controls autoplay loop muted playsinline width="100%"></video>

Live demo:
https://srdz-af.github.io/BleND/

## What It Supports

- N-dimensional primitive library: hypercube, cross polytope, simplex, simplex prism, demicube, 24-cell, and duoprism
- Canonical projection using selected axes
- Global N-D rotation with per-axis auto-rotation controls
- Object transforms (move/rotate/scale)
- Vertex edit mode (move vertex)
- Multiple objects, per-object visibility, rename, delete
- Per-object surface settings (base color, metallic, roughness, alpha)
- View modes: wireframe, transparent, solid, faceted
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

- Left mouse drag: orbit
- Mouse wheel: zoom
- Middle mouse drag: cycle projected axis triples
- Axis gizmo drag: orbit camera
- Axis gizmo endpoint click: snap view to axis

Global N-D rotation:

- Extra-axis gizmo drag: rotate global space on that extra dimension's projection plane (4D+)
- Extra-axis gizmo play button: cycle auto-rotation through 1x, 2x, 3x, then stop
- Extra-axis gizmo depth button: include/exclude that axis from perspective depth

Object operations:

- Shift + A: add object menu
- Add object menu: choose from the primitive library
- G: move selected object
- R: rotate selected object
- S: scale selected object
- X: delete selected object (with confirm)
- Right click: context menu (add/transform/delete depending selection)

Mobile transforms:

- Touch and drag the Move / Rotate / Scale Transformation Controls to transform the selected object
- Release touch to confirm the transform

While a transform is active:

- X / Y / Z: lock transform axis
- Extra-axis plane toggle: W during rotate switches to the active extra-dimension rotation plane
- Left click: confirm
- Right click: cancel

Edit mode:

- Tab: toggle edit mode
- Left click vertex: select vertex
- Right click selected vertex: open vertex move action

History:

- Ctrl+Z / Cmd+Z: undo
- Ctrl+Y / Cmd+Y: redo
- Ctrl+Shift+Z / Cmd+Shift+Z: redo

## UI Overview

Use these names when referring to the main UI groups:

- **Projection Controls**: the gizmo panel. It controls which dimensions are projected, how extra dimensions rotate, and how projection axes are arranged.
- **Scene Controls**: the right-side panel. It controls objects, background, and per-object texture/material settings.
- **Transformation Controls**: the circular bottom controls. They toggle edit mode and activate move, rotate, and scale.
- **Render Options**: the rectangular bottom toolbar. It controls viewport render mode, recording, and screenshots.

## Projection Controls

Projection Controls contain the XYZ gizmo, dimension stepper, and extra-axis gizmos.

- Dimension stepper: set the dimension used for newly created primitives
- XYZ gizmo drag: orbit the camera
- XYZ endpoint click: snap the camera to that axis direction
- Shift axes button: cycle which axes are projected into XYZ
- Reset rotations button: reset extra-axis rotations without stopping active auto-rotation
- Extra-axis gizmo drag: rotate that extra dimension's projection plane
- Extra-axis play button: cycle auto-rotation through 1x, 2x, 3x, then stop
- Extra-axis depth button: include/exclude that axis from perspective depth
- Extra-axis handle drag: reorder extra axes
- Drag extra-axis gizmo over XYZ tip: swap that extra axis with the highlighted projected axis

## Scene Controls

Scene Controls are the right-side panel.

- Object list: select, rename, hide/show, and manage scene objects
- Background: choose the plain background or a studio/HDRI background and tune its settings
- Texture: edit the selected object's base color, metallic, roughness, and alpha
- Saved texture: save the current texture settings and reapply saved presets from the dropdown

Texture controls are disabled/greyed out when no object is selected.

## Transformation Controls

Transformation Controls are the circular bottom controls.

- Edit button: toggle vertex edit mode
- Move button: activate move transform
- Rotate button: activate rotate transform
- Scale button: activate scale transform

On mobile, touch and drag a Transformation Control to transform the selected object, then release to confirm.

## Render Options

Render Options are the rectangular bottom toolbar.

- Wireframe / Transparent / Solid / Faceted: change viewport render mode
- Record: start/stop viewport recording
- Screenshot: download the current viewport frame

Shortcuts:

- 1 / 2 / 3 / 4: switch render mode
- Shift+R: start/stop recording
- Shift+S: download screenshot

# BleND Feature Checklist

Use this as a parking lot for larger ideas. Pick an item and it can be broken down into an implementation plan.

## Highest Impact

- [ ] Projection timeline and keyframes
  Save states for dimension count, axis order, rotations, perspective axes, background, texture, render mode, bloom, and motion blur, then interpolate between them.
  Initial implementation covers N-D rotation, projection order/offset, render mode, bloom, motion blur, camera position/target/FOV/zoom, and camera framing. Background, texture, and object-state interpolation are still open.

- [ ] Shareable scene URLs
  Encode the current scene state into the URL so interesting setups can be shared directly.

- [ ] Preset gallery
  Add curated one-click scenes such as classic tesseract fold, 8D ghost cube, metallic hypercube, wireframe collapse, and high-motion render presets.

- [ ] Projection choreography export
  Add one-click loop generation that animates projection controls, effects, and camera movement, then records the result.

## Geometry

- [x] Expanded object library
  Initial pass added demicube, 24-cell, and duoprism alongside the existing hypercube, cross-polytope, simplex, and simplex prism.

- [ ] Better slicing controls
  Make slicing feel physical with a draggable slab or plane, including ghosted discarded geometry.

- [ ] Visual trails per object
  Draw fading geometry trails for vertices and edges instead of relying only on screen-space motion blur.

## Explanation And Sharing

- [ ] Annotated projection mode
  Add optional labels that explain what is happening, such as active projected axes, depth perspective axes, and axis swaps.

- [ ] Guided demo mode
  Step through a curated sequence explaining 4D and higher-dimensional projection with controlled camera and gizmo states.

## Polish

- [ ] Render preset system
  Save and load combinations of background, texture, bloom, motion blur, render mode, and camera framing.

- [ ] Object material presets
  Bundle saved materials into named presets that can be reused across objects.

- [ ] Performance quality switch
  Add a compact quality control for bloom, motion blur, HDRI quality, antialiasing, and pixel ratio.

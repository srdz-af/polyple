import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';

export class SmoothAfterimagePass extends Pass {
  uniforms: {
    tOld: THREE.IUniform<THREE.Texture | null>;
    tNew: THREE.IUniform<THREE.Texture | null>;
    blend: THREE.IUniform<number>;
  };

  private textureComp: THREE.WebGLRenderTarget;
  private textureOld: THREE.WebGLRenderTarget;
  private readonly compFsMaterial: THREE.ShaderMaterial;
  private readonly compFsQuad: FullScreenQuad;
  private readonly copyFsMaterial: THREE.MeshBasicMaterial;
  private readonly copyFsQuad: FullScreenQuad;
  private initialized = false;

  constructor(blend = 0.74) {
    super();

    this.uniforms = {
      tOld: { value: null },
      tNew: { value: null },
      blend: { value: blend },
    };

    this.textureComp = this.createTarget(window.innerWidth, window.innerHeight);
    this.textureOld = this.createTarget(window.innerWidth, window.innerHeight);
    this.compFsMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tOld;
        uniform sampler2D tNew;
        uniform float blend;
        varying vec2 vUv;

        void main() {
          vec4 oldColor = texture2D(tOld, vUv);
          vec4 newColor = texture2D(tNew, vUv);
          gl_FragColor = mix(newColor, oldColor, blend);
        }
      `,
    });
    this.compFsQuad = new FullScreenQuad(this.compFsMaterial);
    this.copyFsMaterial = new THREE.MeshBasicMaterial();
    this.copyFsQuad = new FullScreenQuad(this.copyFsMaterial);
  }

  private createTarget(width: number, height: number) {
    return new THREE.WebGLRenderTarget(width, height, {
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    if (!this.initialized) {
      this.copy(readBuffer.texture, renderer, this.textureOld);
      this.output(readBuffer.texture, renderer, writeBuffer);
      this.initialized = true;
      return;
    }

    this.uniforms.tOld.value = this.textureOld.texture;
    this.uniforms.tNew.value = readBuffer.texture;

    renderer.setRenderTarget(this.textureComp);
    this.compFsQuad.render(renderer);

    this.output(this.textureComp.texture, renderer, writeBuffer);

    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
  }

  setSize(width: number, height: number) {
    this.textureComp.setSize(width, height);
    this.textureOld.setSize(width, height);
    this.reset();
  }

  reset() {
    this.initialized = false;
  }

  dispose() {
    this.textureComp.dispose();
    this.textureOld.dispose();
    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();
    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();
  }

  private copy(texture: THREE.Texture, renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
    this.copyFsMaterial.map = texture;
    renderer.setRenderTarget(target);
    this.copyFsQuad.render(renderer);
  }

  private output(texture: THREE.Texture, renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    this.copyFsMaterial.map = texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.copyFsQuad.render(renderer);
  }
}

export class CopyFramePass extends Pass {
  private readonly material = new THREE.MeshBasicMaterial();
  private readonly fsQuad = new FullScreenQuad(this.material);

  constructor() {
    super();
    this.needsSwap = true;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.material.map = readBuffer.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}

export class CachedGrainPass extends Pass {
  readonly uniforms = {
    tDiffuse: { value: null as THREE.Texture | null },
    tNoise: { value: null as THREE.Texture | null },
    intensity: { value: 0 },
  };

  private readonly noiseUniforms = {
    seed: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  };

  private readonly noiseMaterial = new THREE.ShaderMaterial({
    uniforms: this.noiseUniforms,
    vertexShader: /* glsl */`
      void main() {
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float seed;
      uniform vec2 resolution;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32 + seed);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 pixel = floor(gl_FragCoord.xy);
        float noise = hash(pixel / max(resolution, vec2(1.0)));
        gl_FragColor = vec4(vec3(noise), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  private readonly blendMaterial = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: /* glsl */`
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform sampler2D tNoise;
      uniform float intensity;

      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float grain = texture2D(tNoise, vUv).r - 0.5;
        color.rgb = clamp(color.rgb + grain * intensity * 0.36, 0.0, 1.0);
        gl_FragColor = color;
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  private readonly noiseFsQuad = new FullScreenQuad(this.noiseMaterial);
  private readonly blendFsQuad = new FullScreenQuad(this.blendMaterial);
  private readonly textureScale: number;
  private readonly updateIntervalFrames: number;
  private noiseTarget: THREE.WebGLRenderTarget;
  private frameIndex = 0;
  private needsNoiseUpdate = true;

  constructor(updateIntervalFrames = 3, textureScale = 0.5) {
    super();
    this.needsSwap = true;
    this.updateIntervalFrames = Math.max(1, Math.round(updateIntervalFrames));
    this.textureScale = Math.max(0.1, Math.min(1, textureScale));
    this.noiseTarget = this.createNoiseTarget(1, 1);
    this.uniforms.tNoise.value = this.noiseTarget.texture;
  }

  setIntensity(intensity: number) {
    this.uniforms.intensity.value = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0));
  }

  setSize(width: number, height: number) {
    const nextWidth = Math.max(1, Math.round(width * this.textureScale));
    const nextHeight = Math.max(1, Math.round(height * this.textureScale));
    this.noiseTarget.setSize(nextWidth, nextHeight);
    this.noiseUniforms.resolution.value.set(nextWidth, nextHeight);
    this.needsNoiseUpdate = true;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    if (this.needsNoiseUpdate || this.frameIndex % this.updateIntervalFrames === 0) {
      this.updateNoiseTexture(renderer);
      this.needsNoiseUpdate = false;
    }
    this.frameIndex = (this.frameIndex + 1) % this.updateIntervalFrames;

    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.tNoise.value = this.noiseTarget.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.blendFsQuad.render(renderer);
  }

  dispose() {
    this.noiseTarget.dispose();
    this.noiseMaterial.dispose();
    this.blendMaterial.dispose();
    this.noiseFsQuad.dispose();
    this.blendFsQuad.dispose();
  }

  private createNoiseTarget(width: number, height: number) {
    const target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    target.texture.name = 'CachedGrainPass.noise';
    return target;
  }

  private updateNoiseTexture(renderer: THREE.WebGLRenderer) {
    this.noiseUniforms.seed.value = Math.random() * 1000;
    renderer.setRenderTarget(this.noiseTarget);
    renderer.clear();
    this.noiseFsQuad.render(renderer);
  }
}

export const ColorGradeShader = {
  name: 'ColorGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    hue: { value: 0 },
    saturation: { value: 0 },
    brightness: { value: 0 },
    contrast: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float hue;
    uniform float saturation;
    uniform float brightness;
    uniform float contrast;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      float angle = hue * 3.14159265;
      float s = sin(angle);
      float c = cos(angle);
      vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
      color.rgb = vec3(
        dot(color.rgb, weights.xyz),
        dot(color.rgb, weights.zxy),
        dot(color.rgb, weights.yzx)
      );

      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luma), color.rgb, 1.0 + saturation);

      // Exposure-style brightness: negative always darkens, positive always brightens.
      color.rgb *= exp2(brightness);

      float contrastScale = contrast > 0.0 ? 1.0 / max(0.001, 1.0 - contrast) : 1.0 + contrast;
      color.rgb = (color.rgb - 0.5) * contrastScale + 0.5;

      gl_FragColor = color;
    }
  `,
};

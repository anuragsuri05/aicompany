import { BlurFilter, ColorMatrixFilter, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Sky } from '@shared/shift';

// 2.5D depth for the office floor — Companiez's "3D touch" on upstream's flat
// pixel-art scene. Three cheap layers, none of which touch hit-testing:
//
//   cast shadows    a darkened, offset, blurred copy of the wall and furniture
//                   tile layers, drawn just beneath them, as if lit from the
//                   top-left. The map is static, so each copy is blurred ONCE
//                   and cached as a texture (`cacheAsTexture`): zero per-frame cost.
//   contact shadows a soft ellipse under each avatar's feet, y-sorted with it,
//                   so people sit ON the floor instead of floating over it.
//   lighting        a screen-space key light from the top-left, a multiply tint
//                   and a vignette — all driven by the shift clock (shared/shift.ts),
//                   so the floor is lit like the real time of day. Desk lamps
//                   (world-space, additive) switch on after dusk.
//                   `eventMode: 'none'` everywhere — clicks pass straight through.
//   grade           a colour matrix that cools upstream's mint-and-cream tiles
//                   toward Companiez's concrete palette (characters untouched).
//
// Every constant lives here so the whole look can be tuned (or switched off with
// DEPTH.enabled) in one place.

export const DEPTH = {
  enabled: true,
  /** Light direction: shadows fall toward +x, +y (down-right), in tile units. */
  castOffset: { x: 0.14, y: 0.22 },
  castAlpha: { walls: 0.3, furniture: 0.26 },
  castBlur: 2.5,
  contact: { rx: 0.36, ry: 0.13, alpha: 0.32 },
  vignette: { color: '10, 14, 24' },
  lamp: { color: 0xffb066, radius: 1.6, alpha: 0.55 },
  grade: { saturate: -0.32, tint: 0xe6edff, contrast: 0.08 }
} as const;

/** Cools the tile art toward concrete: less saturation, a faint blue cast, a
 *  touch more contrast. Apply to the tile group only, never to characters. */
export function createFloorGrade(): ColorMatrixFilter {
  const f = new ColorMatrixFilter();
  f.saturate(DEPTH.grade.saturate, false);
  f.tint(DEPTH.grade.tint, true);
  f.contrast(DEPTH.grade.contrast, true);
  return f;
}

/** A shadow copy of one tile layer: every sprite cloned onto the same texture
 *  frame and transform, tinted black, offset down-right, blurred, and cached. */
export function buildCastShadow(source: Container, tileSize: number, alpha: number): Container {
  const shadow = new Container();
  shadow.label = `${source.label ?? 'layer'}-shadow`;
  shadow.eventMode = 'none';
  for (const child of source.children) {
    if (!(child instanceof Sprite)) continue;
    const s = new Sprite(child.texture);
    s.anchor.copyFrom(child.anchor);
    s.position.copyFrom(child.position);
    s.scale.copyFrom(child.scale);
    s.rotation = child.rotation;
    s.tint = 0x000000;
    shadow.addChild(s);
  }
  shadow.x = Math.round(DEPTH.castOffset.x * tileSize);
  shadow.y = Math.round(DEPTH.castOffset.y * tileSize);
  shadow.alpha = alpha;
  if (shadow.children.length > 0) {
    shadow.filters = [new BlurFilter({ strength: DEPTH.castBlur, quality: 3 })];
    // Static geometry: render the blur once into a texture instead of every frame.
    shadow.cacheAsTexture(true);
  }
  return shadow;
}

/** Soft contact shadow, centred on (0,0) — position it at an avatar's feet.
 *  Three stacked ellipses fake a feathered edge without a filter per avatar. */
export function createContactShadow(tileSize: number): Graphics {
  const g = new Graphics();
  const rx = DEPTH.contact.rx * tileSize;
  const ry = DEPTH.contact.ry * tileSize;
  const layers: [number, number][] = [[1.25, 0.25], [1, 0.45], [0.7, 0.6]];
  for (const [k, a] of layers) {
    g.ellipse(0, 0, rx * k, ry * k);
    g.fill({ color: 0x000000, alpha: a * DEPTH.contact.alpha });
  }
  g.eventMode = 'none';
  return g;
}

/** A gradient painted on a small canvas and stretched — the gradients are
 *  smooth, so 256px is plenty and costs a single texture upload. */
function gradientTexture(paint: (ctx: CanvasRenderingContext2D, size: number) => void): Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx, size);
  return Texture.from(canvas);
}

/** Screen-space lighting: add it to `app.stage` ABOVE the world, call `resize`
 *  with the renderer size and `applySky` with the current shift-clock sky.
 *  Purely visual; never intercepts input. */
export class LightingOverlay {
  readonly container = new Container();
  private readonly tint: Sprite;
  private readonly light: Sprite;
  private readonly vignette: Sprite;

  constructor() {
    this.container.label = 'lighting';
    this.container.eventMode = 'none';

    // Multiply wash — the whole floor takes the colour of the hour.
    this.tint = new Sprite(Texture.WHITE);
    this.tint.blendMode = 'multiply';

    // White gradient, coloured per hour through `tint`.
    this.light = new Sprite(gradientTexture((ctx, n) => {
      const g = ctx.createRadialGradient(n * 0.12, n * 0.05, 0, n * 0.12, n * 0.05, n * 0.95);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, n, n);
    }));
    this.light.blendMode = 'add';

    this.vignette = new Sprite(gradientTexture((ctx, n) => {
      const g = ctx.createRadialGradient(n / 2, n / 2, n * 0.3, n / 2, n / 2, n * 0.72);
      g.addColorStop(0, `rgba(${DEPTH.vignette.color}, 0)`);
      g.addColorStop(1, `rgba(${DEPTH.vignette.color}, 1)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, n, n);
    }));

    this.container.addChild(this.tint, this.light, this.vignette);
  }

  applySky(sky: Sky): void {
    // Multiply by white is a no-op, so blend the tint toward white by its alpha
    // rather than fading the sprite — keeps the wash a true multiply.
    this.tint.tint = mixToWhite(sky.tint, sky.tintAlpha);
    this.light.tint = sky.light;
    this.light.alpha = sky.lightAlpha;
    this.vignette.alpha = sky.vignetteAlpha;
  }

  resize(width: number, height: number): void {
    for (const s of [this.tint, this.light, this.vignette]) {
      s.width = width;
      s.height = height;
    }
  }
}

function mixToWhite(color: number, amount: number): number {
  const ch = (s: number) => {
    const c = (color >> s) & 0xff;
    return Math.round(255 + (c - 255) * Math.max(0, Math.min(1, amount)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Warm pools of light over desks (world-space, additive). `points` are the
 *  desk tiles' top-left pixel corners; `setLevel(0..1)` dims them all. */
export function createDeskLamps(points: readonly { x: number; y: number }[], tileSize: number): {
  container: Container;
  setLevel: (level: number) => void;
} {
  const container = new Container();
  container.label = 'desk-lamps';
  container.eventMode = 'none';
  const tex = gradientTexture((ctx, n) => {
    const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    g.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, n, n);
  });
  const size = DEPTH.lamp.radius * 2 * tileSize;
  for (const p of points) {
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.width = size;
    s.height = size;
    s.x = p.x + tileSize / 2;
    s.y = p.y + tileSize / 2;
    s.tint = DEPTH.lamp.color;
    s.blendMode = 'add';
    container.addChild(s);
  }
  const setLevel = (level: number) => {
    container.alpha = DEPTH.lamp.alpha * level;
    container.visible = level > 0.01;
  };
  setLevel(0);
  return { container, setLevel };
}

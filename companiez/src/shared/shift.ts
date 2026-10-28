/**
 * The shift clock — Companiez's signature.
 *
 * The office never closes, so the floor's light follows the real local time:
 * rosy at dawn, bright through the day, amber at golden hour, blue after dusk
 * with desk lamps on through the night shift. The office floor (depth.ts) and
 * the top-bar shift clock (ShiftClock.tsx) both read `skyAt`, so the sky in the
 * chrome is always the sky over the floor.
 *
 * Pure and dependency-free: keyframes on a 24h wheel, linearly blended by the
 * minute, so the light drifts instead of snapping at the hour.
 */

export type ShiftPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface Sky {
  phase: ShiftPhase;
  /** Key light from the top-left: colour and additive strength. */
  light: number;
  lightAlpha: number;
  /** Multiply tint over the whole floor (white = none). */
  tint: number;
  tintAlpha: number;
  vignetteAlpha: number;
  /** 0..1 — how lit the desk lamps are. */
  lamps: number;
  /** Top and bottom of the sky gradient shown in the shift clock. */
  skyTop: number;
  skyBottom: number;
}

interface Key extends Omit<Sky, 'phase'> { at: number } // minutes after midnight

const H = 60;
const NIGHT: Omit<Key, 'at'> = {
  light: 0x8fa8ff, lightAlpha: 0.05, tint: 0x1a2a5c, tintAlpha: 0.42,
  vignetteAlpha: 0.5, lamps: 1, skyTop: 0x0b1230, skyBottom: 0x26305e
};

/** The day, as a wheel of keyframes. Order matters; the wheel wraps at 24h. */
const KEYS: readonly Key[] = [
  { at: 0, ...NIGHT },
  { at: 5 * H + 30, ...NIGHT },
  { at: 6 * H + 30, light: 0xffb38a, lightAlpha: 0.22, tint: 0x7a4466, tintAlpha: 0.2,
    vignetteAlpha: 0.38, lamps: 0.45, skyTop: 0x5b6fb3, skyBottom: 0xffb59a },
  { at: 8 * H, light: 0xfff1d6, lightAlpha: 0.15, tint: 0xffffff, tintAlpha: 0,
    vignetteAlpha: 0.3, lamps: 0, skyTop: 0x7fb2ff, skyBottom: 0xd8ecff },
  { at: 13 * H, light: 0xffffff, lightAlpha: 0.1, tint: 0xffffff, tintAlpha: 0,
    vignetteAlpha: 0.26, lamps: 0, skyTop: 0x4f95ff, skyBottom: 0xbfe0ff },
  { at: 17 * H + 30, light: 0xffb35c, lightAlpha: 0.22, tint: 0x8a5524, tintAlpha: 0.14,
    vignetteAlpha: 0.34, lamps: 0.2, skyTop: 0x6d7fd6, skyBottom: 0xffb066 },
  { at: 19 * H + 30, light: 0xff8a5c, lightAlpha: 0.12, tint: 0x2e2756, tintAlpha: 0.32,
    vignetteAlpha: 0.44, lamps: 0.8, skyTop: 0x2a2d6b, skyBottom: 0xd9706a },
  { at: 21 * H, ...NIGHT }
];

const DAY_MIN = 24 * H;

/** Which shift is on at a given minute of the day. */
export function phaseAt(minute: number): ShiftPhase {
  const m = ((minute % DAY_MIN) + DAY_MIN) % DAY_MIN;
  if (m >= 5 * H && m < 8 * H) return 'dawn';
  if (m >= 8 * H && m < 17 * H) return 'day';
  if (m >= 17 * H && m < 21 * H) return 'dusk';
  return 'night';
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

/** Blend two 0xRRGGBB colours channel by channel. */
export function mixColor(a: number, b: number, t: number): number {
  const ch = (c: number, s: number) => (c >> s) & 0xff;
  const r = Math.round(lerp(ch(a, 16), ch(b, 16), t));
  const g = Math.round(lerp(ch(a, 8), ch(b, 8), t));
  const bl = Math.round(lerp(ch(a, 0), ch(b, 0), t));
  return (r << 16) | (g << 8) | bl;
}

/** The sky at a given minute of the day (0..1439; wraps). */
export function skyAtMinute(minute: number): Sky {
  const m = ((minute % DAY_MIN) + DAY_MIN) % DAY_MIN;
  let i = KEYS.length - 1;
  while (i > 0 && KEYS[i].at > m) i--;
  const a = KEYS[i];
  const b = KEYS[(i + 1) % KEYS.length];
  const span = ((b.at - a.at) + DAY_MIN) % DAY_MIN || DAY_MIN;
  const t = (((m - a.at) + DAY_MIN) % DAY_MIN) / span;
  return {
    phase: phaseAt(m),
    light: mixColor(a.light, b.light, t),
    lightAlpha: lerp(a.lightAlpha, b.lightAlpha, t),
    tint: mixColor(a.tint, b.tint, t),
    tintAlpha: lerp(a.tintAlpha, b.tintAlpha, t),
    vignetteAlpha: lerp(a.vignetteAlpha, b.vignetteAlpha, t),
    lamps: lerp(a.lamps, b.lamps, t),
    skyTop: mixColor(a.skyTop, b.skyTop, t),
    skyBottom: mixColor(a.skyBottom, b.skyBottom, t)
  };
}

export function skyAt(date: Date): Sky {
  return skyAtMinute(date.getHours() * H + date.getMinutes());
}

/** `#rrggbb` for CSS. */
export function cssHex(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

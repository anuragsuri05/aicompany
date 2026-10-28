// Design tokens — single source of truth. Mirrors tokens.css for non-styled consumers (Pixi).
// Any change here must also update tokens.css.

export const colors = {
  // Companiez "concrete & signal light" (mirrors tokens.css light theme).
  cream: {
    50: 0xe8ebef,
    100: 0xf3f5f7,
    200: 0xe1e5eb,
    300: 0xcdd3dc
  },
  paper: {
    100: 0xfafbfc,
    200: 0xebeef2
  },
  ink: {
    900: 0x131a24,
    700: 0x2e3a4b,
    500: 0x5b6779,
    300: 0x7d889b,
    100: 0xd2d8e1
  },
  brand: 0x3366ff,
  // `lemon` is SIGNAL ORANGE in Companiez (the "lamp on" accent).
  accent: {
    coral: 0xee5a5f,
    coralLight: 0xfbdadb,
    mint: 0x2fa37a,
    mintLight: 0xd0eee1,
    sky: 0x2f8fd8,
    skyLight: 0xd4e7f8,
    lemon: 0xff6b2c,
    lemonLight: 0xffe1d2,
    lilac: 0x8b7df6,
    lilacLight: 0xe3dffd,
    peach: 0xe8a33d,
    peachLight: 0xf9e6c5
  },
  status: {
    idle: 0x8d97a8,
    thinking: 0x2f8fd8,
    working: 0xff6b2c,
    blocked: 0xee5a5f,
    success: 0x2fa37a,
    ghost: 0xd2d8e1
  },
  world: {
    grassLight: 0xd4eab0,
    grassDark: 0xb5d589,
    woodLight: 0xe5c896,
    woodDark: 0xc9a66b,
    path: 0xe8d8b0,
    wall: 0x8b6f47
  }
} as const;

export const space = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64
} as const;

export const type = {
  display: '"Big Shoulders Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", sans-serif',
  ui: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, "PingFang SC", "Microsoft YaHei", "Noto Sans Mono CJK SC", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", monospace'
} as const;

export const tileSize = 32; // px — the world is built from 32×32 tiles

export type AccentColorName =
  | 'coral' | 'mint' | 'sky' | 'lemon' | 'lilac' | 'peach';

export const accentByName: Record<AccentColorName, number> = {
  coral: colors.accent.coral,
  mint:  colors.accent.mint,
  sky:   colors.accent.sky,
  lemon: colors.accent.lemon,
  lilac: colors.accent.lilac,
  peach: colors.accent.peach
};

export const accentLightByName: Record<AccentColorName, number> = {
  coral: colors.accent.coralLight,
  mint:  colors.accent.mintLight,
  sky:   colors.accent.skyLight,
  lemon: colors.accent.lemonLight,
  lilac: colors.accent.lilacLight,
  peach: colors.accent.peachLight
};

// Convert 0xRRGGBB to "#RRGGBB"
export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0').toUpperCase();
}

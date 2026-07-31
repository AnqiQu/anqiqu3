import * as THREE from "three";

// Single source of truth for the solarpunk palette, sampled from the painted
// 2D scene. Authored in sRGB — the renderer keeps NoToneMapping so these hexes
// reach the screen as-is.
export const P = {
  skyTop: 0x1a96f2,
  skyHorizon: 0x8fd3fd,
  fog: 0xbbe4ff,
  cloud: 0xfffdf7,
  // Sun: a near-white disc, plus the pale warm wash it lays over the sky
  // around it (see buildSky) so that stretch of sky reads as sunlit.
  sun: 0xfffdf0,
  sunGlow: 0xfff2d8,

  meadow: 0x86d462,
  meadowDark: 0x52a842,
  meadowLight: 0xace77a,
  moss: 0x64b44c,
  canopy: 0x6cca5e,
  canopyLight: 0x9ee36c,
  canopyDark: 0x40a452,

  earth: 0x8a6a4a,
  cliff: 0x7d5f43,
  rock: 0x9c8468,
  stone: 0xe8d9b8,
  // Pale masonry for the observatory so it reads bright against the hill.
  stonePale: 0xf6efdf,
  path: 0xd9c39a,

  wood: 0xa9744a,
  woodDark: 0x7d4f2e,
  plank: 0xc98f5e,
  glassTeal: 0x9fd8d2,
  brass: 0xc9a24b,
  brassBright: 0xe3c06b,
  doorGreen: 0x4e8f4c,

  water: 0x6fc7c2,
  waterDeep: 0x3e8f96,
  waterSpark: 0x9fe0da,
  lily: 0x67b06b,
  blossomPink: 0xf7a8c2,
  blossomOrange: 0xf5b06a,
  blossomYellow: 0xffd98a,

  koi: 0xf08a3c,
  koiWhite: 0xfff4e4,
  dogGolden: 0xd9a45b,
  dogCream: 0xf2e2c4,
  dogBlack: 0x3b3b3f,
  dogWhite: 0xf5f1e8,
  bird: 0x3b4a52,

  blimpCream: 0xfffcf6,
  blimpTeal: 0x7fc9c0,
  panelNavy: 0x2f5d8a,
  panelLine: 0x7ea6c9,
  turbineWhite: 0xffffff,
  lanternGlow: 0xffd98a,
} as const;

type MatOpts = {
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
  side?: THREE.Side;
  emissive?: number;
};

const cache = new Map<string, THREE.MeshLambertMaterial>();

// Cached Lambert factory: identical color+options share one material instance,
// which keeps the renderer's program/uniform switching cheap.
export function mat(color: number, opts: MatOpts = {}): THREE.MeshLambertMaterial {
  const key = `${color}|${opts.flat ? 1 : 0}|${opts.transparent ? 1 : 0}|${opts.opacity ?? 1}|${
    opts.depthWrite === false ? 0 : 1
  }|${opts.side ?? THREE.FrontSide}|${opts.emissive ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      flatShading: opts.flat ?? false,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.depthWrite ?? true,
      side: opts.side ?? THREE.FrontSide,
    });
    if (opts.emissive) m.emissive.setHex(opts.emissive);
    cache.set(key, m);
  }
  return m;
}

export function disposeMaterialCache() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
}

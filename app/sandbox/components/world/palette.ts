import * as THREE from "three";

// Single source of truth for the solarpunk palette, sampled from the painted
// 2D scene. Authored in sRGB — the renderer keeps NoToneMapping so these hexes
// reach the screen as-is.
export const P = {
  skyTop: 0x7bcdf8,
  skyHorizon: 0xd9f2ff,
  fog: 0xcfeeff,
  cloud: 0xfff7df,
  sun: 0xfff3c4,

  meadow: 0x8fce6f,
  meadowDark: 0x5da24f,
  meadowLight: 0xb6e388,
  moss: 0x6fae5a,
  canopy: 0x77c46d,
  canopyLight: 0xa8dd7c,
  canopyDark: 0x4d9e5f,

  earth: 0x8a6a4a,
  cliff: 0x7d5f43,
  rock: 0x9c8468,
  stone: 0xe8d9b8,
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

  blimpCream: 0xfff2d0,
  blimpTeal: 0x7fc9c0,
  panelNavy: 0x2f5d8a,
  panelLine: 0x7ea6c9,
  turbineWhite: 0xf7f4ec,
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

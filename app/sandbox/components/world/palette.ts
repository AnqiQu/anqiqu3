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

  // Pastel yellow for the sky title. Pitched bright because Lambert shading
  // knocks roughly a third off before it reaches the screen.
  titleYellow: 0xffee9e,

  wood: 0xa9744a,
  woodDark: 0x7d4f2e,
  plank: 0xc98f5e,
  glassTeal: 0x9fd8d2,
  brass: 0xc9a24b,
  brassBright: 0xe3c06b,
  gold: 0xecc25e,
  doorGreen: 0x4e8f4c,
  // The burrow's mouth: near-black, so a closed door still reads as depth.
  caveDark: 0x0f0e0c,

  water: 0x6fc7c2,
  waterDeep: 0x3e8f96,
  waterSpark: 0x9fe0da,
  lily: 0x67b06b,
  blossomPink: 0xf7a8c2,
  blossomOrange: 0xf5b06a,
  blossomYellow: 0xffd98a,

  koi: 0xf08a3c,
  koiWhite: 0xfff4e4,
  dogBlack: 0x3b3b3f,
  dogWhite: 0xf5f1e8,
  // The three pomeranians. Each pairs a coat with a paler tone for the chest
  // ruff, snout, and tail plume — the way a pom's undercoat actually reads.
  pomCream: 0xf3d6a4,
  pomCreamPale: 0xfdf0d8,
  pomBrown: 0x9d6a44,
  pomBrownPale: 0xd8b189,
  pomOrange: 0xf8a962,
  pomOrangePale: 0xffd9ab,
  // The ginger tabby: coat, the darker bands ringing it, and the pale
  // muzzle/chest/paws.
  catGinger: 0xf0a85c,
  catStripe: 0xc9803a,
  catCream: 0xf8e8ce,
  // Birds, so the flock isn't three identical silhouettes.
  birdSlate: 0x4a5c6b,
  birdCoral: 0xe8865a,
  birdCream: 0xfdf1dc,

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

import type { CSSProperties } from "react";
import Link from "next/link";

// Pixel art: every drawing is a list of rows, one character per pixel, looked
// up in this palette ("." is empty). Keys that share a colour merge into one
// path when drawn.
const PALETTE: Record<string, string> = {
  // Wood
  W: "#b08657",
  w: "#8f6843",
  v: "#6c4c30",
  i: "#2c1f14",
  F: "#7a5737",
  f: "#5d4129",
  g: "#45301e",
  k: "#24180f",
  z: "#050a07",
  // Sand, darkest to lightest
  a: "#2c8a5e",
  b: "#45b27b",
  c: "#5fd18a",
  d: "#80ed99",
  e: "#c7f9cc",
  p: "#a6f5b8",
  // Castle
  C: "#a6f5b8",
  D: "#5fd18a",
  O: "#1f6e4a",
  P: "#d9e3dd",
  Y: "#f0d59a",
  // Shovel
  H: "#f2c879",
  h: "#c28f40",
  M: "#eef3f0",
  m: "#b9c6bf",
  n: "#7d8e85",
  X: "#ffffff",
  K: "#231a12",
};

const WIDTH = 80;
const HEIGHT = 44;
const BACK = 14;
const FRONT = 30;

const CASTLE = [
  "..PYY..........",
  "..PYYY.........",
  "..PYY..........",
  "..P............",
  "C.C.D.....C.C.D",
  "CCCCD.....CCCCD",
  "COCCD.....COCCD",
  "CCCCDC.C.DCCCCD",
  "CCCCDCCCCDCCCCD",
  "CCCCDCCCCDCCCCD",
  "CCCCDCCOCDCCCCD",
  "CCCCDCOOODCCCCD",
  "CCCCDCOOODCCCCD",
];

const SHOVEL = [
  ".....KKKKKKK",
  ".....KHHHHHK",
  ".....KKhHhKK",
  ".......KHhK.",
  ".......KHhK.",
  "......KHhK..",
  "......KHhK..",
  "......KHhK..",
  ".....KHhK...",
  ".....KHhK...",
  ".....KHhK...",
  "....KHhK....",
  "....KHhK....",
  "...KnmmnK...",
  "..KMMMMmnK..",
  "..KMXMMmnK..",
  "..KMXMMmnK..",
  "..KMMMMmnK..",
  "..KMMMMmnK..",
  "...KMMmnK...",
  "....KMnK....",
  ".....KK.....",
];

// The heap in front of the blade, which makes the shovel look stuck in.
const PILE = [
  "....eepppppc....",
  "..eepppppppppc..",
  ".epppppppppppccc",
  "..aaaaaaaaaaaaa.",
];

const SPARKLE = [".X.", "XXX", ".X."];

const SHOVEL_AT = { x: 48, y: 5 };
const PILE_AT = { x: 46, y: 24 };
const SPARKLE_AT = { x: 59, y: 16 };

// Sand kicked up while digging; offsets are whole pixels so the steps land on
// the grid.
const GRAINS = [
  { x: 51, y: 23, dx: -4, dy: -8, delay: 0 },
  { x: 53, y: 23, dx: 0, dy: -12, delay: 0.1 },
  { x: 55, y: 23, dx: 4, dy: -8, delay: 0.05 },
  { x: 57, y: 24, dx: 8, dy: -4, delay: 0.15 },
  { x: 49, y: 24, dx: -8, dy: -4, delay: 0.2 },
];

// Stable per-pixel noise, so the grain lands in the same place every render.
function noise(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 100;
}

const SAND_BANDS = ["a", "a/b", "b", "b", "b/c", "c", "c", "c/d", "d", "d", "d"];
const DARKER: Record<string, string> = { a: "a", b: "a", c: "b", d: "c" };

// The box: a wooden frame drawn in perspective (narrower at the back), banded
// sand inside it, and the castle sat on the sand.
function drawSandbox(): string[] {
  const grid = Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill("."));
  const left = (y: number) => Math.round(BACK - (y - BACK) * 0.75);
  const right = (y: number) => WIDTH - 1 - left(y);

  for (let y = BACK; y <= FRONT; y++) {
    for (let x = left(y); x <= right(y); x++) {
      const n = noise(x, y);
      const side = x - left(y) < 3 || right(y) - x < 3;

      if (y === BACK || y === FRONT) grid[y][x] = "W";
      else if (y === BACK + 1 || y >= FRONT - 2) grid[y][x] = n < 22 ? "v" : "w";
      else if (side) grid[y][x] = x === left(y) ? "W" : x === right(y) ? "v" : n < 15 ? "v" : "w";
      else if (y === BACK + 2) grid[y][x] = "i";
      else {
        const [upper, lower = upper] = SAND_BANDS[y - BACK - 3].split("/");
        const band = (x + y) % 2 === 0 ? upper : lower;
        grid[y][x] = n < 5 ? "e" : n < 10 ? DARKER[band] : band;
      }
    }
  }

  // Front boards: two planks with a seam, nails at each end.
  for (let y = FRONT + 1; y <= FRONT + 8; y++) {
    const row = ["g", "F", "f", "k", "F", "f", "g", "k"][y - FRONT - 1];
    for (let x = left(FRONT); x <= right(FRONT); x++) {
      const edge = x === left(FRONT) || x === right(FRONT);
      grid[y][x] = edge && row !== "k" ? "g" : row === "f" && noise(x, y) < 12 ? "g" : row;
    }
  }
  for (const x of [4, WIDTH - 5]) {
    grid[FRONT + 3][x] = "k";
    grid[FRONT + 6][x] = "k";
  }

  // Shadow on the ground, and a few strays kicked out of the box.
  for (let x = 3; x <= WIDTH - 4; x++) grid[FRONT + 9][x] = "z";
  for (let x = 8; x <= WIDTH - 9; x++) grid[FRONT + 10][x] = "z";
  for (const [x, y] of [[20, 41], [24, 42], [56, 41], [61, 42], [52, 42]]) grid[y][x] = "c";

  // The castle, with a little shadow at its base.
  for (let x = 16; x <= 32; x++) grid[22][x] = "a";
  CASTLE.forEach((row, dy) =>
    [...row].forEach((key, dx) => {
      if (key !== ".") grid[9 + dy][17 + dx] = key;
    }),
  );

  return grid.map((row) => row.join(""));
}

const SANDBOX = drawSandbox();

// Merges each row's runs of one colour into a single path per colour.
function pixelPaths(rows: readonly string[], x0 = 0, y0 = 0) {
  const byColor = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = PALETTE[row[x]];
      let end = x + 1;
      while (end < row.length && PALETTE[row[end]] === color) end++;
      if (color) {
        byColor.set(color, `${byColor.get(color) ?? ""}M${x0 + x} ${y0 + y}h${end - x}v1h${x - end}z`);
      }
      x = end;
    }
  });
  return [...byColor];
}

function Pixels({
  rows,
  at = { x: 0, y: 0 },
  className,
}: {
  rows: readonly string[];
  at?: { x: number; y: number };
  className?: string;
}) {
  return (
    <g className={className}>
      {pixelPaths(rows, at.x, at.y).map(([fill, d]) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </g>
  );
}

export function SandboxInvite() {
  return (
    <section className="section final-section reveal" id="visit-sandbox">
      <div className="container">
        <div className="final-cta sandbox-invite">
          <div className="final-cta-copy">
            <h2>Visit the Sandbox</h2>
            <p className="sandbox-invite-promise">(you won&apos;t regret it, I promise)</p>
          </div>
          <Link href="/sandbox" className="sandbox-pit" aria-label="Visit the Sandbox">
            <svg
              className="sandbox-pit-art"
              viewBox="0 4 80 39"
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <Pixels rows={SANDBOX} />
              <Pixels rows={SHOVEL} at={SHOVEL_AT} className="sandbox-pit-shovel" />
              <Pixels rows={PILE} at={PILE_AT} />
              <Pixels rows={SPARKLE} at={SPARKLE_AT} className="sandbox-pit-sparkle" />
              {GRAINS.map((grain) => (
                <rect
                  key={`${grain.x}-${grain.y}`}
                  className="sandbox-pit-grain"
                  x={grain.x}
                  y={grain.y}
                  width="1"
                  height="1"
                  style={
                    {
                      "--dx": `${grain.dx}px`,
                      "--dy": `${grain.dy}px`,
                      animationDelay: `${grain.delay}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

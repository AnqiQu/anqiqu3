import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sheets = {
  landmarks: path.join(root, "design/sandbox/source-sheets/landmarks-and-environment.png"),
  creatures: path.join(root, "design/sandbox/source-sheets/creatures-and-blimps.png"),
  animation: path.join(root, "design/sandbox/source-sheets/animation-parts.png"),
};

// Crop coordinates are deliberately kept in source control. Re-running this file
// regenerates every production asset without altering the supplied source sheets.
const assets = [
  { name: "observatory", category: "landmarks", sheet: "landmarks", crop: [18, 20, 610, 392], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "archive-closed", category: "landmarks", sheet: "landmarks", crop: [646, 34, 385, 352], anchor: "bottom-center", alternates: ["archive-open"], status: "READY", issue: "" },
  { name: "archive-open", category: "landmarks", sheet: "landmarks", crop: [1052, 38, 374, 348], anchor: "bottom-center", alternates: ["archive-closed"], status: "READY", issue: "" },
  { name: "garden", category: "landmarks", sheet: "landmarks", crop: [28, 442, 437, 290], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "pond", category: "landmarks", sheet: "landmarks", crop: [492, 435, 475, 300], anchor: "center", alternates: ["pond-ripple"], status: "READY", issue: "" },
  { name: "unfinished-bridge", category: "landmarks", sheet: "landmarks", crop: [978, 420, 455, 335], anchor: "bottom-left", alternates: ["bridge-rope", "loose-bridge-plank"], status: "READY", issue: "" },
  { name: "return-sign", category: "navigation", sheet: "landmarks", crop: [224, 748, 296, 324], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "lantern", category: "environment", sheet: "landmarks", crop: [558, 742, 157, 325], anchor: "bottom-center", alternates: ["lantern-glow"], status: "READY", issue: "" },
  { name: "wind-turbine", category: "environment", sheet: "landmarks", crop: [820, 687, 292, 380], anchor: "bottom-center", alternates: ["turbine-blades"], status: "READY", issue: "" },
  { name: "golden-dog-idle", category: "creatures", sheet: "creatures", crop: [76, 42, 348, 238], anchor: "bottom-center", alternates: ["golden-dog-sitting", "golden-dog-running"], status: "READY", issue: "" },
  { name: "golden-dog-sitting", category: "creatures", sheet: "creatures", crop: [454, 45, 244, 242], anchor: "bottom-center", alternates: ["golden-dog-idle", "golden-dog-running"], status: "READY", issue: "" },
  { name: "golden-dog-running", category: "creatures", sheet: "creatures", crop: [702, 47, 390, 232], anchor: "bottom-center", alternates: ["golden-dog-idle", "golden-dog-sitting"], status: "READY", issue: "" },
  { name: "black-white-dog-idle", category: "creatures", sheet: "creatures", crop: [74, 291, 338, 239], anchor: "bottom-center", alternates: ["black-white-dog-sitting", "black-white-dog-running"], status: "READY", issue: "" },
  { name: "black-white-dog-sitting", category: "creatures", sheet: "creatures", crop: [454, 291, 245, 244], anchor: "bottom-center", alternates: ["black-white-dog-idle", "black-white-dog-running"], status: "READY", issue: "" },
  { name: "black-white-dog-running", category: "creatures", sheet: "creatures", crop: [730, 302, 355, 220], anchor: "bottom-center", alternates: ["black-white-dog-idle", "black-white-dog-sitting"], status: "READY", issue: "" },
  { name: "butterfly", category: "creatures", sheet: "creatures", crop: [1128, 54, 244, 190], anchor: "center", alternates: [], status: "READY", issue: "" },
  { name: "blue-bird", category: "creatures", sheet: "creatures", crop: [1154, 289, 201, 128], anchor: "center", alternates: ["yellow-bird"], status: "READY", issue: "" },
  { name: "yellow-bird", category: "creatures", sheet: "creatures", crop: [1155, 415, 200, 126], anchor: "center", alternates: ["blue-bird"], status: "READY", issue: "" },
  { name: "koi-orange", category: "creatures", sheet: "creatures", crop: [88, 553, 209, 184], anchor: "center", alternates: ["koi-calico"], status: "READY", issue: "" },
  { name: "koi-calico", category: "creatures", sheet: "creatures", crop: [307, 555, 237, 184], anchor: "center", alternates: ["koi-orange"], status: "READY", issue: "" },
  { name: "lily-pads", category: "environment", sheet: "creatures", crop: [611, 566, 268, 151], anchor: "center", alternates: ["water-lilies"], status: "READY", issue: "" },
  { name: "water-lilies", category: "environment", sheet: "creatures", crop: [924, 545, 296, 202], anchor: "center", alternates: ["lily-pads"], status: "READY", issue: "" },
  { name: "flower-cluster", category: "environment", sheet: "creatures", crop: [50, 749, 350, 297], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "hanging-vines", category: "environment", sheet: "creatures", crop: [425, 755, 266, 285], anchor: "top-center", alternates: [], status: "READY", issue: "" },
  { name: "solar-blimp-large", category: "environment", sheet: "creatures", crop: [692, 736, 412, 257], anchor: "center", alternates: ["solar-blimp-medium", "solar-blimp-small"], status: "READY", issue: "" },
  { name: "solar-blimp-medium", category: "environment", sheet: "creatures", crop: [1111, 766, 263, 161], anchor: "center", alternates: ["solar-blimp-large", "solar-blimp-small"], status: "READY", issue: "" },
  { name: "solar-blimp-small", category: "environment", sheet: "creatures", crop: [983, 947, 148, 79], anchor: "center", alternates: ["solar-blimp-large", "solar-blimp-medium"], status: "READY", issue: "" },
  { name: "telescope", category: "animation", sheet: "animation", crop: [480, 64, 188, 295], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "solar-panels", category: "environment", sheet: "animation", crop: [664, 118, 358, 255], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
  { name: "turbine-blades", category: "animation", sheet: "animation", crop: [1037, 23, 300, 345], anchor: "center", alternates: ["wind-turbine"], status: "READY", issue: "" },
  { name: "archive-door-closed", category: "animation", sheet: "animation", crop: [45, 434, 365, 286], anchor: "bottom-center", alternates: ["archive-door-open"], status: "READY", issue: "" },
  { name: "archive-door-open", category: "animation", sheet: "animation", crop: [422, 430, 330, 290], anchor: "bottom-center", alternates: ["archive-door-closed"], status: "READY", issue: "" },
  { name: "lantern-glow", category: "effects", sheet: "animation", crop: [867, 554, 145, 136], anchor: "center", alternates: ["lantern"], status: "READY", issue: "" },
  { name: "bridge-rope", category: "animation", sheet: "animation", crop: [340, 774, 325, 223], anchor: "bottom-center", alternates: ["unfinished-bridge"], status: "READY", issue: "Thin rope retained; verify at dark-background review." },
  { name: "loose-bridge-plank", category: "animation", sheet: "animation", crop: [48, 763, 282, 246], anchor: "bottom-left", alternates: ["unfinished-bridge"], status: "READY", issue: "" },
  { name: "pond-ripple", category: "effects", sheet: "animation", crop: [878, 810, 316, 220], anchor: "center", alternates: ["pond"], status: "READY", issue: "Soft pale edge; intended for water-only compositing." },
  { name: "foreground-plants", category: "environment", sheet: "animation", crop: [1184, 793, 240, 259], anchor: "bottom-center", alternates: [], status: "READY", issue: "" },
];

function colorDistance(r, g, b, bg) {
  return Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
}

function median(values) {
  const sorted = values.sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function removeConnectedBackground(input, crop) {
  const { data, info } = await sharp(input)
    .extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const border = [];
  const sample = (x, y) => {
    const i = (y * width + x) * channels;
    border.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < width; x += 4) { sample(x, 0); sample(x, height - 1); }
  for (let y = 0; y < height; y += 4) { sample(0, y); sample(width - 1, y); }
  const bg = [0, 1, 2].map((channel) => median(border.map((pixel) => pixel[channel])));

  const connected = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (connected[p]) return;
    const i = p * channels;
    if (colorDistance(data[i], data[i + 1], data[i + 2], bg) > 38) return;
    connected[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = Math.floor(p / width);
    enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
  }

  let minX = width; let minY = height; let maxX = 0; let maxY = 0;
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (connected[p]) {
      const distance = colorDistance(data[i], data[i + 1], data[i + 2], bg);
      data[i + 3] = Math.max(0, Math.min(255, Math.round(((distance - 3) / 20) * 255)));
    } else {
      data[i + 3] = 255;
    }
    if (data[i + 3] > 10) {
      const x = p % width; const y = Math.floor(p / width);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  const objectWidth = maxX - minX + 1;
  const objectHeight = maxY - minY + 1;
  const padding = Math.max(10, Math.round(Math.max(objectWidth, objectHeight) * 0.1));
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const right = Math.min(width - 1, maxX + padding);
  const bottom = Math.min(height - 1, maxY + padding);
  const outputWidth = right - left + 1;
  const outputHeight = bottom - top + 1;

  return sharp(data, { raw: { width, height, channels } })
    .extract({ left, top, width: outputWidth, height: outputHeight });
}

const manifest = [];
for (const asset of assets) {
  const outputDir = path.join(root, "public/sandbox/assets", asset.category);
  await mkdir(outputDir, { recursive: true });
  const pngPath = path.join(outputDir, `${asset.name}.png`);
  const webpPath = path.join(outputDir, `${asset.name}.webp`);
  const extracted = await removeConnectedBackground(sheets[asset.sheet], asset.crop);
  const png = await extracted.clone().png({ compressionLevel: 9 }).toBuffer();
  const webp = await extracted.clone().webp({ quality: 86, alphaQuality: 95, effort: 6 }).toBuffer();
  await writeFile(pngPath, png);
  await writeFile(webpPath, webp);
  const metadata = await sharp(png).metadata();
  const pngStats = await stat(pngPath);
  const webpStats = await stat(webpPath);
  manifest.push({
    filename: asset.name,
    category: asset.category,
    width: metadata.width,
    height: metadata.height,
    pngBytes: pngStats.size,
    webpBytes: webpStats.size,
    pngPath: `/sandbox/assets/${asset.category}/${asset.name}.png`,
    webpPath: `/sandbox/assets/${asset.category}/${asset.name}.webp`,
    status: asset.status,
    relatedAlternates: asset.alternates,
    anchor: asset.anchor,
    issue: asset.issue,
    sourceSheet: path.basename(sheets[asset.sheet]),
  });
}

const regeneration = [
  {
    filename: "fog",
    category: "effects",
    status: "NEEDS_REGENERATION",
    issue: "No isolated fog element is present in the supplied source sheets.",
  },
  {
    filename: "drifting-petals",
    category: "effects",
    status: "NEEDS_REGENERATION",
    issue: "Available petals are fused to running-dog ground shadows.",
  },
  {
    filename: "blimp-propeller",
    category: "animation",
    status: "NEEDS_REGENERATION",
    issue: "No clean standalone propeller state is present in the supplied source sheets.",
  },
].map((asset) => ({
  ...asset,
  width: null,
  height: null,
  pngBytes: null,
  webpBytes: null,
  pngPath: null,
  webpPath: null,
  relatedAlternates: [],
  anchor: "center",
  sourceSheet: null,
}));

await writeFile(
  path.join(root, "public/sandbox/asset-manifest.json"),
  `${JSON.stringify([...manifest, ...regeneration], null, 2)}\n`,
);
console.log(`Extracted ${manifest.length} assets; ${regeneration.length} marked NEEDS_REGENERATION.`);

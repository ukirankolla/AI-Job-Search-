// Generates the Noventra icons as PNGs with zero dependencies.
// Run: node scripts/generate-icons.mjs  (or npm run icons)
//
// Outputs into public/icons/ (PWA):
//   icon-32.png               browser favicon
//   icon-192.png              install icon (Chrome/Android)
//   icon-512.png              install icon
//   icon-512-maskable.png     maskable install icon (full-bleed background)
//   apple-touch-icon.png      iOS home-screen icon
//
// Outputs into mobile/assets/ (native app):
//   icon.png                    1024x1024 store/app icon (opaque, full square)
//   android-icon-foreground.png  432x432 adaptive foreground (transparent)
//   android-icon-monochrome.png  432x432 adaptive monochrome (transparent)
//   splash-icon.png              512x512 splash logo (transparent)
//
// Design: slate-900 (#0f172a) square with a white "N".
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_OUT = join(ROOT, "public", "icons");
const MOBILE_OUT = join(ROOT, "mobile", "assets");

const BG = [15, 23, 42]; // slate-900
const FG = [255, 255, 255]; // white

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

class Canvas {
  constructor(size) {
    this.size = size;
    this.pixels = Buffer.alloc(size * size * 4);
  }

  set(x, y, [r, g, b], a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const i = (y * this.size + x) * 4;
    this.pixels[i] = r;
    this.pixels[i + 1] = g;
    this.pixels[i + 2] = b;
    this.pixels[i + 3] = a;
  }

  disk(cx, cy, radius, color) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.set(x, y, color);
      }
    }
  }

  line(x0, y0, x1, y1, thickness, color) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const radius = thickness / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.disk(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, color);
    }
  }

  roundedRect(x0, y0, x1, y1, radius, color) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nearTop = y < y0 + radius;
        const nearBottom = y > y1 - radius;
        const nearLeft = x < x0 + radius;
        const nearRight = x > x1 - radius;
        if (nearTop || nearBottom) {
          const cy = nearTop ? y0 + radius : y1 - radius;
          const cx = nearLeft ? x0 + radius : x1 - radius;
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) this.set(x, y, color);
        } else if (nearLeft || nearRight) {
          this.set(x, y, color);
        } else {
          this.set(x, y, color);
        }
      }
    }
  }

  drawN(margin, thickness) {
    const s = this.size;
    const m = s * margin;
    const t = s * thickness;
    this.line(m, m, m, s - m, t, FG); // left stem
    this.line(s - m, m, s - m, s - m, t, FG); // right stem
    this.line(m, m, s - m, s - m, t, FG); // diagonal
  }
}

function makeIcon(
  size,
  { rounded = true, radiusRatio = 0.22, margin = 0.3, thickness = 0.14, background = true } = {},
) {
  const c = new Canvas(size);
  if (background) {
    c.roundedRect(0, 0, size - 1, size - 1, rounded ? size * radiusRatio : 0, BG);
  }
  c.drawN(margin, thickness);
  return c.pixels;
}

mkdirSync(WEB_OUT, { recursive: true });
mkdirSync(MOBILE_OUT, { recursive: true });

const webTargets = [
  ["public/icons/icon-32.png", 32, {}],
  ["public/icons/icon-192.png", 192, {}],
  ["public/icons/icon-512.png", 512, {}],
  ["public/icons/icon-512-maskable.png", 512, { rounded: false, margin: 0.32, thickness: 0.13 }],
  ["public/icons/apple-touch-icon.png", 180, { rounded: false, margin: 0.28, thickness: 0.14 }],
];

const mobileTargets = [
  ["mobile/assets/icon.png", 1024, { rounded: false, margin: 0.3, thickness: 0.14 }],
  [
    "mobile/assets/android-icon-foreground.png",
    432,
    { rounded: false, margin: 0.34, thickness: 0.13, background: false },
  ],
  [
    "mobile/assets/android-icon-monochrome.png",
    432,
    { rounded: false, margin: 0.34, thickness: 0.13, background: false },
  ],
  [
    "mobile/assets/splash-icon.png",
    512,
    { rounded: false, margin: 0.3, thickness: 0.13, background: false },
  ],
];

for (const [rel, size, opts] of [...webTargets, ...mobileTargets]) {
  const out = join(ROOT, rel);
  writeFileSync(out, encodePng(size, makeIcon(size, opts)));
  console.log(`wrote ${rel} (${size}x${size})`);
}

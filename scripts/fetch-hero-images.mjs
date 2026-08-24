// Downloads real photographs (Unsplash CDN — free license, commercial use OK,
// attribution not required) into public/hero/. Each slot lists candidate
// photo IDs in priority order; the first one that downloads successfully wins.
//
// Usage:
//   node scripts/fetch-hero-images.mjs            # fill missing files
//   FORCE=1 node scripts/fetch-hero-images.mjs    # redownload everything

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/hero");

const IMAGES = [
  {
    file: "hero-professional.png",
    width: 1024,
    height: 1280,
    crop: "entropy",
    // Professional working at a sunlit desk
    candidates: [
      "photo-1573497019940-1c28c88b4f3e",
      "photo-1522202176988-66273c2fd55f",
      "photo-1486312338219-ce68d2c6f44d",
    ],
  },
  {
    file: "desk.png",
    width: 1600,
    height: 900,
    crop: "entropy",
    // Bright modern office / workspace
    candidates: [
      "photo-1497366216548-37526070297c",
      "photo-1524758631624-e2822e304c36",
      "photo-1497215728101-856f4ea42174",
    ],
  },
  {
    file: "interview.png",
    width: 1600,
    height: 900,
    crop: "entropy",
    // Business handshake / hiring moment
    candidates: [
      "photo-1521791136064-7986c2920216",
      "photo-1560264280-88b68371db39",
      "photo-1556761175-b413da4baf72",
    ],
  },
  {
    file: "avatar-priya.png",
    width: 512,
    height: 512,
    crop: "faces",
    candidates: [
      "photo-1580489944761-15a19d654956",
      "photo-1494790108377-be9c29b29330",
    ],
  },
  {
    file: "avatar-marcus.png",
    width: 512,
    height: 512,
    crop: "faces",
    candidates: [
      "photo-1507003211169-0a1dd7228f2d",
      "photo-1500648767791-00dcc994a43e",
    ],
  },
  {
    file: "avatar-elena.png",
    width: 512,
    height: 512,
    crop: "faces",
    candidates: [
      "photo-1573496359142-b8d87734a5a2",
      "photo-1438761681033-6461ffad8d80",
    ],
  },
  {
    file: "avatar-daniel.png",
    width: 512,
    height: 512,
    crop: "faces",
    candidates: [
      "photo-1560250097-0b93528c311a",
      "photo-1472099645785-5658abf4ff4e",
    ],
  },
];

function cdnUrl(id, img) {
  const url = new URL(`https://images.unsplash.com/${id}`);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("crop", img.crop);
  url.searchParams.set("w", String(img.width));
  url.searchParams.set("h", String(img.height));
  url.searchParams.set("q", "85");
  return url.toString();
}

let sharp;

async function fetchOne(img) {
  let lastErr;
  for (const id of img.candidates) {
    process.stdout.write(`Fetching ${img.file} (${id}) ... `);
    try {
      const res = await fetch(cdnUrl(id, img));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) throw new Error(`not an image: ${type}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20_000) throw new Error(`too small (${buf.length} B)`);
      const png = await sharp(buf)
        .resize(img.width, img.height, { fit: "cover" })
        .png()
        .toBuffer();
      writeFileSync(resolve(outDir, img.file), png);
      console.log(
        `done (${(png.length / 1024).toFixed(0)} KB, ${Math.round(buf.length / 1024)} KB downloaded)`,
      );
      return;
    } catch (err) {
      lastErr = err;
      console.log(`failed (${err.message})`);
    }
  }
  throw new Error(`All candidates failed for ${img.file}: ${lastErr?.message}`);
}

async function main() {
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error("sharp is required: npm install");
  }

  mkdirSync(outDir, { recursive: true });

  const force = process.env.FORCE === "1";
  const pending = IMAGES.filter(
    (img) => force || !existsSync(resolve(outDir, img.file)),
  );
  if (pending.length === 0) {
    console.log("All images already exist (use FORCE=1 to redownload).");
    return;
  }

  const used = new Set();
  for (const img of pending) {
    await fetchOne({
      ...img,
      candidates: img.candidates.filter((id) => !used.has(id)),
    });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

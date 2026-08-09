// Generates the photoreal hero boy image with Pollinations.ai (free, no API
// key required), normalizes it to a PNG, and writes it to public/hero/boy.png.
//
// Usage: npm run generate:hero

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/hero");
const outFile = resolve(outDir, "boy.png");

const PROMPT =
  "photorealistic full body photograph of a cheerful 10 year old boy with short dark hair, wearing a light blue button-up shirt, dark jeans and white sneakers, holding a closed brown leather briefcase in his right hand down at his side, standing upright facing the camera, full body visible from head to toe, natural soft studio lighting, plain light gray seamless background, sharp focus, high quality";

function buildUrl(model) {
  const url = new URL("https://image.pollinations.ai/prompt/" + encodeURIComponent(PROMPT));
  url.searchParams.set("width", "1024");
  url.searchParams.set("height", "1024");
  url.searchParams.set("seed", "11");
  url.searchParams.set("nologo", "true");
  url.searchParams.set("model", model);
  return url.toString();
}

async function generate() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error("sharp is required: npm install");
  }

  let lastErr;
  for (const model of ["flux", "turbo", "sana"]) {
    process.stdout.write(`Generating hero boy image (${model}) ... `);
    try {
      const res = await fetch(buildUrl(model));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 10_000) throw new Error("response too small");
      const meta = await sharp(buf).metadata();
      const png = await sharp(buf)
        .resize(1024, 1024, { fit: "contain", background: "#f1f5f9" })
        .png()
        .toBuffer();
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, png);
      console.log(
        `done (${meta.width}x${meta.height} -> 1024x1024 PNG, ${(png.length / 1024).toFixed(0)} KB)`,
      );
      return;
    } catch (err) {
      lastErr = err;
      console.log(`failed (${err.message})`);
    }
  }
  throw new Error(`All Pollinations models failed: ${lastErr?.message}`);
}

generate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

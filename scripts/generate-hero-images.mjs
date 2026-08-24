// Generates the photoreal imagery used across the landing page with
// Pollinations.ai (free, no API key required), normalizes each to PNG, and
// writes it under public/hero/.
//
// Files that already exist are skipped unless FORCE=1 is set.
//
// Usage:
//   npm run generate:hero            # generate any missing images
//   FORCE=1 npm run generate:hero    # regenerate everything

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/hero");

const HEADSHOT_STYLE =
  "photorealistic professional corporate headshot portrait, face and shoulders framing, looking at the camera with a warm confident smile, softly blurred neutral light-gray studio background, shallow depth of field, soft natural lighting, sharp focus on the eyes, high quality";

const IMAGES = [
  {
    file: "boy.png",
    width: 1024,
    height: 1024,
    seed: "11",
    prompt:
      "photorealistic full body photograph of a cheerful 10 year old boy with short dark hair, wearing a light blue button-up shirt, dark jeans and white sneakers, holding a closed brown leather briefcase in his right hand down at his side, standing upright facing the camera, full body visible from head to toe, natural soft studio lighting, plain light gray seamless background, sharp focus, high quality",
  },
  {
    file: "avatar-priya.png",
    width: 512,
    height: 512,
    seed: "21",
    prompt: `${HEADSHOT_STYLE}, subject is a South Asian woman in her early 30s with shoulder-length dark hair, wearing a navy blazer over a white blouse, small gold earrings`,
  },
  {
    file: "avatar-marcus.png",
    width: 512,
    height: 512,
    seed: "32",
    prompt: `${HEADSHOT_STYLE}, subject is a Black man in his late 20s with short hair and thin round glasses, wearing a charcoal crew-neck sweater over an oxford shirt`,
  },
  {
    file: "avatar-elena.png",
    width: 512,
    height: 512,
    seed: "43",
    prompt: `${HEADSHOT_STYLE}, subject is a Latina woman in her mid 40s with hair tied back, wearing a burgundy blouse and a delicate necklace`,
  },
  {
    file: "avatar-daniel.png",
    width: 512,
    height: 512,
    seed: "54",
    prompt: `${HEADSHOT_STYLE}, subject is an East Asian man in his mid 30s with neatly combed black hair, wearing a light-blue dress shirt with the top button open`,
  },
  {
    file: "desk.png",
    width: 1600,
    height: 900,
    seed: "65",
    prompt:
      "photorealistic wide photograph of a tidy modern home-office desk at golden hour, an open laptop with a softly blurred glowing screen (no readable text), ceramic coffee mug, closed notebook, small potted plant, warm sunlight streaming through a window casting long soft shadows, shallow depth of field, cinematic warm tones, high quality",
  },
  {
    file: "interview.png",
    width: 1600,
    height: 900,
    seed: "76",
    prompt:
      "photorealistic photograph of two professionals shaking hands in a bright modern office lobby, glass walls and warm wood accents blurred in the background, one holding a slim folder, genuine smiles, natural window light, shallow depth of field, cinematic tones, high quality",
  },
];

function buildUrl({ prompt, width, height, seed }, model) {
  const url = new URL(
    "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt),
  );
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("seed", seed);
  url.searchParams.set("nologo", "true");
  url.searchParams.set("model", model);
  return url.toString();
}

let sharp;

async function generateOne(image) {
  let lastErr;
  for (const model of ["flux", "turbo", "sana"]) {
    process.stdout.write(`Generating ${image.file} (${model}) ... `);
    try {
      const res = await fetch(buildUrl(image, model));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 10_000) throw new Error("response too small");
      const png = await sharp(buf)
        .resize(image.width, image.height, { fit: "cover", background: "#f1f5f9" })
        .png()
        .toBuffer();
      writeFileSync(resolve(outDir, image.file), png);
      console.log(`done (${(png.length / 1024).toFixed(0)} KB)`);
      return;
    } catch (err) {
      lastErr = err;
      console.log(`failed (${err.message})`);
    }
  }
  throw new Error(`All models failed for ${image.file}: ${lastErr?.message}`);
}

async function generate() {
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
    console.log("All images already exist (use FORCE=1 to regenerate).");
    return;
  }

  for (const img of pending) {
    await generateOne(img);
  }
}

generate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

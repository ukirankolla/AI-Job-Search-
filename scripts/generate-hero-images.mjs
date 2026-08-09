// Generates the photorealistic hero images (boy, closed briefcase, open
// briefcase) with OpenAI gpt-image-1 and writes them to public/hero/.
//
// Requires OPENAI_API_KEY (from the environment or a local .env.local file).
//
// Usage: npm run generate:hero

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/hero");

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envFile = resolve(root, ".env.local");
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("OPENAI_API_KEY="));
    if (line) return line.slice("OPENAI_API_KEY=".length).trim();
  }
  throw new Error(
    "OPENAI_API_KEY not found. Add it to .env.local or the environment.",
  );
}

const COMMON = {
  n: 1,
  size: "1024x1024",
  quality: "high",
  background: "transparent",
  output_format: "png",
};

const JOBS = [
  {
    file: "boy.png",
    prompt:
      "Photorealistic full-body photograph of a cheerful young boy around 10 years old, short dark hair, warm smile, wearing a light blue button-up shirt and dark jeans and white sneakers, standing upright facing the camera, both arms relaxed at his sides with empty hands, looking straight at the viewer, full body visible from head to toe, natural soft lighting, isolated on a transparent background, high detail, professional photography",
  },
  {
    file: "briefcase-closed.png",
    prompt:
      "Photorealistic product photograph of a closed brown leather briefcase with a black top handle and two gold metal clasps, centered, front view, isolated on a transparent background, soft studio lighting, sharp detail",
  },
  {
    file: "briefcase-open.png",
    prompt:
      "Photorealistic product photograph of an open brown leather briefcase, lid flipped fully open showing a warm glowing golden light coming from inside, centered, front view, isolated on a transparent background, soft studio lighting, sharp detail",
  },
];

async function generate() {
  const apiKey = loadApiKey();
  mkdirSync(outDir, { recursive: true });

  for (const job of JOBS) {
    process.stdout.write(`Generating ${job.file} ... `);
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "gpt-image-1", ...COMMON, prompt: job.prompt }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`gpt-image-1 failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error(`No image returned for ${job.file}`);

    const file = resolve(outDir, job.file);
    writeFileSync(file, Buffer.from(b64, "base64"));
    console.log("done");
  }

  console.log(`\nSaved to ${outDir}`);
}

generate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

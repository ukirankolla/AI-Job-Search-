import type { ProfileChunk } from "@/lib/types";

const SECTION_HEADINGS: Record<string, RegExp> = {
  summary: /\b(summary|objective|profile)\b/i,
  experience: /\b(experience|employment|work history|professional history)\b/i,
  skills: /\b(skills|technologies|technical skills|core competencies)\b/i,
  education: /\b(education|academic|degrees?)\b/i,
  project: /\b(projects?|side projects|portfolio)\b/i,
};

function detectSection(text: string): string {
  for (const [type, re] of Object.entries(SECTION_HEADINGS)) {
    if (re.test(text)) return type;
  }
  return "experience";
}

export function chunkResume(resumeText: string): ProfileChunk[] {
  const text = resumeText.trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const chunks: ProfileChunk[] = [];
  let current: string[] = [];
  let currentLabel = "";
  const MAX_CHUNK = 1500;

  const flush = () => {
    const content = current.join("\n").trim();
    if (!content) return;
    chunks.push({
      id: crypto.randomUUID(),
      profile_id: "",
      content_type: detectSection(content),
      content,
      source_label: currentLabel,
      metadata: {},
    });
    current = [];
    currentLabel = "";
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (/^[A-Z][A-Za-z &+/]+:?\s*$/.test(trimmed) && trimmed.length < 60) {
      flush();
      currentLabel = trimmed.replace(/:$/, "");
    }
    current.push(trimmed);
    if (current.join("\n").length >= MAX_CHUNK) {
      flush();
    }
  }
  flush();

  return chunks;
}

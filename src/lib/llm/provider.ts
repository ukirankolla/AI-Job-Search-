import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Embeddings } from "@langchain/core/embeddings";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
}

export interface ChatProvider {
  complete(system: string, user: string): Promise<ChatResult>;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

const MOCK_EMBEDDING_DIM = 1536;

class MockEmbeddings extends Embeddings {
  readonly model: string = "mock";

  constructor() {
    super({});
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.hashVector(t));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.hashVector(text);
  }

  private hashVector(text: string): number[] {
    const vec = new Array<number>(MOCK_EMBEDDING_DIM).fill(0);
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
      const idx = seed % MOCK_EMBEDDING_DIM;
      vec[idx] = ((vec[idx] ?? 0) + 1) % 11 - 5;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

const MOCK_SKILL_TERMS = [
  "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "Python",
  "Django", "Flask", "Java", "Spring", "C#", "Go", "Rust", "Ruby",
  "PHP", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL",
  "REST", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "Linux", "HTML", "CSS", "Tailwind CSS", "Redux", "Vue.js",
  "Angular", "Git", "Agile", "Scrum", "Jest", "Cypress", "Playwright",
  "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
  "Kafka", "Spark", "Elasticsearch", "Firebase", "Supabase", "Prisma",
  "Microservices", "Figma", "Product Management", "Analytics", "Tableau",
  "Power BI", "Excel", "gRPC", "WebSockets",
];

function mockUniqueSkills(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mockExtractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return mockUniqueSkills(
    MOCK_SKILL_TERMS.filter((s) => lower.includes(s.toLowerCase())),
  );
}

function mockJobInfo(user: string): {
  title: string;
  company: string;
  description: string;
} {
  const jobBlock =
    /JOB:\s*\n([\s\S]*?)(?=\n\n(?:PROFILE|TAILORED RESUME):)/i.exec(user)?.[1] ??
    "";
  return {
    title: /Title:\s*(.+)/i.exec(jobBlock)?.[1]?.trim() ?? "",
    company: /Company:\s*(.+)/i.exec(jobBlock)?.[1]?.trim() ?? "",
    description: /Description:\s*\n?([\s\S]*)/i.exec(jobBlock)?.[1]?.trim() ?? "",
  };
}

function mockProfileInfo(user: string): {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  chunks: string[];
} {
  const profileBlock =
    /PROFILE:\s*\n([\s\S]*?)(?=\n\n(?:JOB|TAILORED RESUME):|$)/i.exec(user)?.[1] ??
    "";
  const skills = (/Skills:\s*(.+)/i.exec(profileBlock)?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rag = user.split("--- Relevant resume excerpts (RAG) ---")[1] ?? "";
  const chunks = rag
    .split(/\[[^\]]+\]\n/)
    .slice(1)
    .map((c) => c.trim())
    .filter(Boolean);
  return {
    name: /Name:\s*(.+)/i.exec(profileBlock)?.[1]?.trim() ?? "",
    headline: /Headline:\s*(.+)/i.exec(profileBlock)?.[1]?.trim() ?? "",
    summary: /Summary:\s*(.+)/i.exec(profileBlock)?.[1]?.trim() ?? "",
    skills,
    chunks,
  };
}

class MockChatProvider implements ChatProvider {
  async complete(system: string, user: string): Promise<ChatResult> {
    return {
      content: this.buildMockReply(system, user),
    };
  }

  private buildMockReply(system: string, user: string): string {
    const agent =
      /you are the ([a-z][a-z\s-]*) agent/i.exec(system)?.[1]?.toLowerCase().trim() ??
      "";

    if (agent.startsWith("resume parser")) {
      const body = user.replace(/^RESUME:[\s\S]*?\n/, "");
      const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
      const knownSkills = [
        "TypeScript", "React", "Node.js", "Python", "PostgreSQL", "AWS",
        "Docker", "Kubernetes", "GraphQL", "Java", "Go",
      ];
      const skills = knownSkills.filter((s) =>
        body.toLowerCase().includes(s.toLowerCase()),
      );
      const name =
        /^([A-Z][a-z]+ )?[A-Z][a-z]+ [A-Z][a-z]+/m.exec(body)?.[0] ??
        "Jane Smith";
      const title =
        lines.find((l) =>
          /engineer|developer|designer|analyst|manager|architect/i.test(l),
        ) ?? "Software Engineer";
      return JSON.stringify({
        full_name: name,
        title,
        summary: "Full-stack software engineer who ships web products end to end.",
        skills,
      });
    }

    if (agent === "rematch" || agent === "re-matcher") {
      const { title, description } = mockJobInfo(user);
      const resumeText =
        /TAILORED RESUME:\s*\n([\s\S]*)/i.exec(user)?.[1]?.trim() ?? "";
      const jobSkills = mockExtractSkills(`${title} ${description}`);
      const matched = jobSkills.filter((s) =>
        resumeText.toLowerCase().includes(s.toLowerCase()),
      );
      const missing = jobSkills.filter((s) => !matched.includes(s));
      const score =
        jobSkills.length === 0
          ? 60
          : Math.round((100 * matched.length) / jobSkills.length);
      return JSON.stringify({
        score,
        summary: `Resume rewritten to match ${title || "the role"}; now at ${score}/100.`,
        matched_skills: matched,
        missing_skills: missing,
        strengths: ["Resume tailored to this posting"],
        concerns: missing.length ? [`Still missing: ${missing.join(", ")}`] : [],
      });
    }

    if (agent === "matcher") {
      const { title, company, description } = mockJobInfo(user);
      const profile = mockProfileInfo(user);
      const jobSkills = mockExtractSkills(`${title} ${description}`);
      const profileText = [...profile.skills, profile.headline, profile.summary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matched = jobSkills.filter((s) =>
        profileText.includes(s.toLowerCase()),
      );
      const missing = jobSkills.filter((s) => !matched.includes(s));
      const score =
        jobSkills.length === 0
          ? 60
          : Math.round((100 * matched.length) / jobSkills.length);
      return JSON.stringify({
        score,
        summary: `Candidate background covers ${matched.length} of ${jobSkills.length} key skills for ${title || "the role"}${company ? ` at ${company}` : ""}.`,
        matched_skills: matched,
        missing_skills: missing,
        strengths: [profile.headline || "Full-stack product ownership"],
        concerns: missing.length ? [`Missing: ${missing.join(", ")}`] : [],
      });
    }

    if (agent === "tailor") {
      const { title, company } = mockJobInfo(user);
      const profile = mockProfileInfo(user);
      const jobSkills = mockExtractSkills(`${title} ${mockJobInfo(user).description}`);
      const allSkills = mockUniqueSkills([...profile.skills, ...jobSkills]);
      const expBullets = profile.chunks.slice(0, 3).map((c) => {
        const first = c.split("\n").map((l) => l.trim()).filter(Boolean)[0];
        return `- ${first ?? c}`;
      });
      const resume = [
        "### SUMMARY",
        `${profile.summary || `${profile.headline || "Software professional"} with a strong product background.`} Tailored for the ${title || "role"}${company ? ` at ${company}` : ""}.`,
        "",
        "### EXPERIENCE",
        expBullets.length
          ? expBullets.join("\n")
          : "- Built and shipped web products end to end.",
        "",
        "### SKILLS",
        allSkills.join(", "),
      ].join("\n");
      const cover_letter = `Dear Hiring Team,\n\nI am excited to apply for the ${title || "role"}${company ? ` at ${company}` : ""}. My background includes ${allSkills.slice(0, 6).join(", ") || "product engineering"} and I have shipped features end to end. I look forward to discussing how I can contribute to your team.\n\nBest regards,\n${profile.name || "[Your Name]"}`;
      return JSON.stringify({
        resume,
        cover_letter,
        highlights: [
          `Resume rewritten for ${title || "the role"}`,
          "Skills aligned to the posting",
        ],
      });
    }

    if (agent === "prep") {
      const { title } = mockJobInfo(user);
      return JSON.stringify({
        summary: `Preparation plan for ${title || "the role"}.`,
        questions: [
          {
            question: "Walk me through a project you shipped end to end.",
            answer:
              "I describe the problem, my approach, trade-offs, and measurable outcome.",
            tip: "Use STAR format.",
          },
          {
            question: "How do you prioritise competing deadlines?",
            answer:
              "I triage by impact and urgency, communicate trade-offs, and re-scope.",
            tip: "Give a concrete example.",
          },
        ],
        tips: ["Research the company's product", "Prepare questions to ask"],
      });
    }

    if (agent === "tracker") {
      return JSON.stringify([
        {
          title: "Follow up on your interview",
          priority: "high",
          reason: "An interview was scheduled recently.",
        },
        {
          title: "Application deadline approaching",
          priority: "medium",
          reason: "A posting may close soon.",
        },
      ]);
    }

    return "Acknowledged.";
  }
}

class OpenAIProvider implements ChatProvider {
  private model: BaseChatModel;

  constructor(modelName: string) {
    this.model = new ChatOpenAI({
      model: modelName,
      temperature: 0.3,
    });
  }

  async complete(system: string, user: string): Promise<ChatResult> {
    const res = await this.model.invoke([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    return { content: res.content as string };
  }
}

export function getChatProvider(): ChatProvider {
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  if (!process.env.OPENAI_API_KEY) {
    return new MockChatProvider();
  }
  return new OpenAIProvider(model);
}

export function getEmbeddings(): Embeddings {
  if (!process.env.OPENAI_API_KEY) {
    return new MockEmbeddings();
  }
  return new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    dimensions: 1536,
  });
}

export const isMockProvider = () => !process.env.OPENAI_API_KEY;

function tryJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extracts the first top-level JSON value (object or array) from a string,
 * walking brackets while respecting quoted strings and escapes. Handles LLM
 * output that wraps JSON in prose or code fences.
 */
function extractJsonValue(text: string): string | null {
  const start = text.search(/[[{]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseJsonObject<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();

  const direct = tryJsonParse(cleaned);
  if (direct !== null) return direct as T;

  const extracted = extractJsonValue(cleaned);
  if (extracted === null) return null;

  const parsed = tryJsonParse(extracted);
  if (parsed !== null) return parsed as T;

  const repaired = tryJsonParse(extracted.replace(/,\s*([}\]])/g, "$1"));
  return repaired !== null ? (repaired as T) : null;
}

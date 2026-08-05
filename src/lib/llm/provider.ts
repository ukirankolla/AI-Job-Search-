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

class MockChatProvider implements ChatProvider {
  async complete(system: string, user: string): Promise<ChatResult> {
    return {
      content: this.buildMockReply(system, user),
    };
  }

  private buildMockReply(system: string, user: string): string {
    const userLower = user.toLowerCase();
    const jobTitle =
      /title[":\s]*([^\n,]{2,60})/i.exec(user)?.[1]?.trim() || "the role";

    if (system.toLowerCase().includes("resume parser")) {
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

    if (system.includes("matcher")) {
      const skills = ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"];
      const missing = userLower.includes("python")
        ? ["Python"]
        : ["Kubernetes"];
      return JSON.stringify({
        score: 78,
        summary: `Candidate background aligns reasonably well with ${jobTitle}.`,
        matched_skills: skills,
        missing_skills: missing,
        strengths: ["Full-stack product ownership", "Ship experience"],
        concerns: ["Missing direct senior title"],
      });
    }

    if (system.includes("tailor")) {
      return JSON.stringify({
        resume:
          "### SUMMARY\nFull-stack engineer delivering end-to-end product features with React, Node.js and PostgreSQL.\n\n### EXPERIENCE\n- Shipped user-facing features for web products.\n\n### SKILLS\nTypeScript, React, Node.js, PostgreSQL, AWS",
        cover_letter: `Dear Hiring Team,\n\nI am excited to apply for ${jobTitle}. My background in full-stack product development and shipping features end-to-end maps well to this role.\n\nBest regards,\n[Your Name]`,
        highlights: ["Repositioned experience bullets for " + jobTitle],
      });
    }

    if (system.includes("prep")) {
      return JSON.stringify({
        summary: `Preparation plan for ${jobTitle}.`,
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

    if (system.includes("tracker")) {
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

export function parseJsonObject<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

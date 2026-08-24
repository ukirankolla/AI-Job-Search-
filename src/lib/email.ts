import { Resend } from "resend";

export interface DigestItem {
  title: string;
  company: string;
  url: string;
  score: number;
  outcome: "submitted" | "ready";
}

export interface AutoApplyDigestEmail {
  to: string;
  name: string;
  items: DigestItem[];
}

/**
 * Sends the user a morning digest after a scheduled auto-apply run: which
 * applications were submitted on their behalf and which are one click away
 * ("ready"). Returns false when no RESEND_API_KEY is configured or the send
 * fails, mirroring sendApplicationEmail.
 */
export async function sendAutoApplyDigestEmail(
  email: AutoApplyDigestEmail,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || email.items.length === 0) return false;

  const from = process.env.EMAIL_FROM ?? "Noventra <onboarding@resend.dev>";

  const submitted = email.items.filter((i) => i.outcome === "submitted");
  const ready = email.items.filter((i) => i.outcome === "ready");

  const lines: string[] = [
    `Hi ${email.name || "there"},`,
    ``,
    `Your Noventra auto-pilot just ran. Here's what it did:`,
    ``,
  ];

  if (submitted.length > 0) {
    lines.push(`Submitted for you (${submitted.length}):`);
    for (const item of submitted) {
      lines.push(
        `  - ${item.title} at ${item.company} (match ${item.score}%)`,
      );
    }
    lines.push(``);
  }

  if (ready.length > 0) {
    lines.push(
      `Ready to send — tailored resume and cover letter are attached to each application, you just need to click submit (${ready.length}):`,
    );
    for (const item of ready) {
      lines.push(
        `  - ${item.title} at ${item.company} (match ${item.score}%): ${item.url}`,
      );
    }
    lines.push(``);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  lines.push(
    `Open your pipeline to review everything: ${siteUrl}/applications`,
    ``,
    `— Noventra auto-pilot`,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [email.to],
    subject:
      submitted.length > 0
        ? `Auto-pilot: ${submitted.length} applied, ${ready.length} ready to send`
        : `Auto-pilot: ${ready.length} jobs matched, ready to apply`,
    text: lines.join("\n"),
  });

  return !error;
}

export interface ApplicationEmail {
  to: string;
  applicantName: string;
  applicantEmail: string;
  subject: string;
  coverLetter: string;
  resume: string;
  resumeFilename: string;
}

/**
 * Sends an application email (tailored cover letter + resume) via Resend.
 * Returns false when no RESEND_API_KEY is configured or the send fails, so
 * callers can fall back to marking the application "ready" instead of
 * silently claiming it was submitted.
 */
export async function sendApplicationEmail(
  email: ApplicationEmail,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.EMAIL_FROM ?? "Noventra <onboarding@resend.dev>";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [email.to],
    subject: email.subject,
    text: [
      `Dear Hiring Team,`,
      ``,
      email.coverLetter,
      ``,
      `---`,
      `Applied via Noventra on behalf of ${email.applicantName}`,
      `Applicant contact: ${email.applicantEmail}`,
      ``,
      `Attached: tailored resume (${email.resumeFilename})`,
    ].join("\n"),
    attachments: [
      {
        filename: email.resumeFilename,
        content: Buffer.from(email.resume).toString("base64"),
      },
    ],
  });

  return !error;
}

/**
 * Parses a mailto: apply URL into a recipient address (and optional subject),
 * or returns null when the URL is not a valid mailto link.
 */
export function parseMailtoUrl(
  url: string | null | undefined,
): { to: string; subject: string } | null {
  if (!url || !url.trim().toLowerCase().startsWith("mailto:")) return null;
  try {
    const parsed = new URL(url);
    const to = decodeURIComponent(
      parsed.pathname || parsed.href.replace(/^mailto:/i, ""),
    ).trim();
    if (!to) return null;
    const subject = decodeURIComponent(
      parsed.searchParams.get("subject") ?? "",
    );
    return { to, subject };
  } catch {
    const raw = url.replace(/^mailto:/i, "").trim();
    if (!raw) return null;
    return { to: raw, subject: "" };
  }
}

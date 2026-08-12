import { Resend } from "resend";

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

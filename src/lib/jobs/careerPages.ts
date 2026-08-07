/**
 * Career pages the company index crawls for structured JobPosting data.
 *
 * These are the *company's own* career sites — the ones that publish
 * schema.org JobPosting markup that Google Jobs also reads. The indexer parses
 * that markup, so only pages that render it will yield jobs.
 *
 * Override or extend via the CAREER_PAGES env var (comma-separated URLs).
 */
export const SEED_CAREER_PAGES: string[] = [
  "https://www.amazon.jobs/",
  "https://jobs.apple.com/en-us/",
  "https://careers.microsoft.com/us/en/",
  "https://www.metacareers.com/jobs",
  "https://careers.google.com/",
  "https://www.netflix.com/jobs",
  "https://stripe.com/jobs",
  "https://www.shopify.com/careers",
  "https://openai.com/careers",
  "https://careers.airbnb.com/",
  "https://www.nvidia.com/en-us/about-nvidia/careers/",
  "https://careers.ibm.com/",
  "https://www.uber.com/careers/",
  "https://www.databricks.com/company/careers/open-positions",
  "https://careers.snowflake.com/",
  "https://about.gitlab.com/jobs/",
  "https://www.roblox.com/careers",
  "https://www.coinbase.com/careers/positions",
  "https://www.dropbox.com/jobs",
  "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site",
];

export function getCareerPages(): string[] {
  const env = process.env.CAREER_PAGES?.trim();
  if (env) {
    return env.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return SEED_CAREER_PAGES;
}

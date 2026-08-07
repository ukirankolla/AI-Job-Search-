import { describe, expect, it } from "vitest";
import {
  buildLinkedInSearchUrl,
  hoursToTPR,
  parseLinkedInJobs,
  parseRelativeTime,
  typesToJT,
} from "@/lib/jobs/linkedin";

const now = new Date("2026-08-05T12:00:00Z");

const SAMPLE_HTML = `
<main>
  <ul class="jobs-search__results-list">
    <li class="base-card relative w-full hover:no-underline focus:no-underline base-card--link base-search-card base-search-card--link job-search-card">
      <a class="base-card__full-link absolute z-10 h-full w-full" href="https://www.linkedin.com/jobs/view/4065342521"></a>
      <div class="base-card__wrapper">
        <h3 class="base-card__title base-search-card--title">
          <span class="sr-only">Software Engineer</span>
          Software Engineer
        </h3>
        <h4 class="base-card__subtitle">
          <span class="sr-only">Acme Inc</span>
          Acme Inc
        </h4>
        <div class="base-search-card__metadata">
          <p class="job-search-card__location">
            <span class="sr-only">Austin, TX</span>
            Austin, TX
          </p>
          <time class="job-search-card__listdate">3 hours ago</time>
          <p class="job-search-card__snippet">Build React &amp; TypeScript products with a great team.</p>
        </div>
      </div>
    </li>
    <li class="base-card relative w-full hover:no-underline focus:no-underline base-card--link base-search-card base-search-card--link job-search-card">
      <a class="base-card__full-link absolute z-10 h-full w-full" href="https://www.linkedin.com/jobs/view/4065342522"></a>
      <div class="base-card__wrapper">
        <h3 class="base-card__title base-search-card--title">
          <span class="sr-only">Frontend Developer</span>
          Frontend Developer
        </h3>
        <h4 class="base-card__subtitle">
          <span class="sr-only">Northwind Labs</span>
          Northwind Labs
        </h4>
        <div class="base-search-card__metadata">
          <p class="job-search-card__location">
            <span class="sr-only">Remote</span>
            Remote
          </p>
          <time class="job-search-card__listdate">Just now</time>
          <p class="job-search-card__snippet">Full-stack work on the core product.</p>
        </div>
      </div>
    </li>
  </ul>
</main>
`;

describe("hoursToTPR", () => {
  it("maps hours to LinkedIn time filters", () => {
    expect(hoursToTPR(4)).toBe("r14400");
    expect(hoursToTPR(8)).toBe("r28800");
    expect(hoursToTPR(12)).toBe("r43200");
  });

  it("returns undefined for no window", () => {
    expect(hoursToTPR(null)).toBeUndefined();
    expect(hoursToTPR(undefined)).toBeUndefined();
  });
});

describe("typesToJT", () => {
  it("maps employment types to LinkedIn job-type codes", () => {
    expect(typesToJT(["full_time", "c2c"])).toBe("F,C");
    expect(typesToJT(["internship"])).toBe("I");
  });

  it("omits unsupported and empty types", () => {
    expect(typesToJT(["w2"])).toBeUndefined();
    expect(typesToJT([])).toBeUndefined();
  });
});

describe("buildLinkedInSearchUrl", () => {
  it("includes keywords, location, and time/type filters", () => {
    const url = buildLinkedInSearchUrl({
      query: "software engineer",
      hours: 8,
      employmentTypes: ["full_time"],
      location: "United States",
    });
    expect(url).toContain("keywords=software+engineer");
    expect(url).toContain("location=United+States");
    expect(url).toContain("f_TPR=r28800");
    expect(url).toContain("f_JT=F");
  });

  it("omits filters that are absent", () => {
    const url = buildLinkedInSearchUrl({ query: "react" });
    expect(url).toContain("keywords=react");
    expect(url).not.toContain("location=");
    expect(url).not.toContain("f_TPR");
    expect(url).not.toContain("f_JT");
  });
});

describe("parseLinkedInJobs", () => {
  it("maps guest search cards into postings", () => {
    const jobs = parseLinkedInJobs(SAMPLE_HTML, now);
    expect(jobs).toHaveLength(2);

    expect(jobs[0]).toMatchObject({
      source: "linkedin",
      external_id: "4065342521",
      title: "Software Engineer",
      company: "Acme Inc",
      location: "Austin, TX",
      url: "https://www.linkedin.com/jobs/view/4065342521",
      description: "Build React & TypeScript products with a great team.",
    });
    expect(jobs[0].posted_at).toBe(
      new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("falls back to now for unparseable listing times", () => {
    const jobs = parseLinkedInJobs(
      SAMPLE_HTML.replace("Just now", "Posted 3 days ago"),
      now,
    );
    expect(jobs[1].posted_at).toBe(
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("drops cards without a valid jobs/view link or title", () => {
    const html = `
      <li class="base-card job-search-card">
        <a href="https://www.linkedin.com/jobs/view/1"></a>
        <h3 class="base-card__title">Real Job</h3>
      </li>
      <li class="base-card job-search-card">
        <a href="https://www.example.com/not-linkedin"></a>
        <h3 class="base-card__title">Bad Link</h3>
      </li>
      <li class="base-card job-search-card">
        <a href="https://www.linkedin.com/jobs/view/2"></a>
      </li>
    `;
    const jobs = parseLinkedInJobs(html, now);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Real Job");
  });
});

describe("parseRelativeTime", () => {
  it("parses common relative strings", () => {
    expect(parseRelativeTime("Just now", now)).toBe(now.toISOString());
    expect(parseRelativeTime("5 minutes ago", now)).toBe(
      new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    );
    expect(parseRelativeTime("2 days ago", now)).toBe(
      new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    );
    expect(parseRelativeTime("1 week ago", now)).toBe(
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("defaults to now for unknown input", () => {
    expect(parseRelativeTime("", now)).toBe(now.toISOString());
    expect(parseRelativeTime("gibberish", now)).toBe(now.toISOString());
  });
});

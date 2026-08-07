import { describe, expect, it } from "vitest";
import {
  composeLocation,
  isUsLocation,
  parseJobPostingLdJson,
  parseSchemaSalary,
  schemaEmploymentType,
} from "@/lib/jobs/careerIndexer";

const now = new Date("2026-08-05T12:00:00Z");

const PAGE_HTML = `
<!doctype html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@graph": [
      {
        "@type": "JobPosting",
        "title": "Senior Software Engineer",
        "datePosted": "2026-08-05T10:00:00Z",
        "description": "<p>Build <strong>great</strong> products.</p>",
        "url": "/jobs/senior-software-engineer",
        "hiringOrganization": { "name": "Acme Inc" },
        "jobLocation": {
          "@type": "Place",
          "address": { "addressLocality": "Austin", "addressRegion": "TX", "addressCountry": "US" }
        },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "value": { "minValue": 120000, "maxValue": 150000 }
        },
        "employmentType": "FULL_TIME"
      },
      {
        "@type": "JobPosting",
        "title": "Product Manager",
        "datePosted": "2026-08-05T09:00:00Z",
        "description": "Own the roadmap.",
        "url": "/jobs/product-manager",
        "hiringOrganization": { "name": "Acme Inc" },
        "jobLocation": { "address": { "addressLocality": "London", "addressRegion": "UK" } },
        "employmentType": "FULL_TIME"
      },
      {
        "@type": "JobPosting",
        "title": "Old Role",
        "datePosted": "2026-07-01T00:00:00Z",
        "description": "Too old.",
        "url": "/jobs/old-role",
        "hiringOrganization": { "name": "Acme Inc" },
        "jobLocation": { "address": { "addressLocality": "Austin", "addressRegion": "TX", "addressCountry": "US" } }
      }
    ]
  }
  </script>
</head>
<body></body>
</html>
`;

describe("parseJobPostingLdJson", () => {
  it("maps fresh US JobPosting markup into postings", () => {
    const jobs = parseJobPostingLdJson(
      PAGE_HTML,
      "https://careers.acme.com/",
      24,
      now,
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "career",
      external_id: "https://careers.acme.com/jobs/senior-software-engineer",
      title: "Senior Software Engineer",
      company: "Acme Inc",
      location: "Austin, TX",
      url: "https://careers.acme.com/jobs/senior-software-engineer",
      description: "Build great products.",
      salary_min: 120000,
      salary_max: 150000,
      employment_type: "full_time",
      posted_at: "2026-08-05T10:00:00.000Z",
    });
  });

  it("excludes non-US locations and postings outside the window", () => {
    const jobs = parseJobPostingLdJson(
      PAGE_HTML,
      "https://careers.acme.com/",
      24,
      now,
    );
    expect(jobs.some((j) => j.title === "Product Manager")).toBe(false);
    expect(jobs.some((j) => j.title === "Old Role")).toBe(false);
  });

  it("skips broken JSON blocks without throwing", () => {
    const html = `<script type="application/ld+json">{not json}</script>`;
    expect(parseJobPostingLdJson(html, "https://x.com", 24, now)).toHaveLength(0);
  });
});

describe("isUsLocation", () => {
  it("accepts US, remote, and unknown locations", () => {
    expect(isUsLocation("Austin, TX")).toBe(true);
    expect(isUsLocation("Remote")).toBe(true);
    expect(isUsLocation("United States")).toBe(true);
    expect(isUsLocation("")).toBe(true);
    expect(isUsLocation(null)).toBe(true);
  });

  it("rejects clearly non-US locations", () => {
    expect(isUsLocation("London, UK")).toBe(false);
    expect(isUsLocation("Toronto, Canada")).toBe(false);
    expect(isUsLocation("Berlin, Germany")).toBe(false);
  });
});

describe("composeLocation", () => {
  it("joins address parts", () => {
    expect(
      composeLocation({
        address: {
          addressLocality: "Seattle",
          addressRegion: "WA",
          addressCountry: "US",
        },
      }),
    ).toBe("Seattle, WA");
  });

  it("handles strings and arrays", () => {
    expect(composeLocation("Remote")).toBe("Remote");
    expect(
      composeLocation([
        { address: { addressLocality: "New York", addressRegion: "NY" } },
        { address: { addressLocality: "Austin", addressRegion: "TX" } },
      ]),
    ).toBe("New York, NY; Austin, TX");
  });
});

describe("parseSchemaSalary", () => {
  it("parses min/max objects and plain numbers", () => {
    expect(
      parseSchemaSalary({
        value: { minValue: 100000, maxValue: 140000 },
      }),
    ).toEqual({ min: 100000, max: 140000 });
    expect(parseSchemaSalary({ value: 90000 })).toEqual({
      min: 90000,
      max: 90000,
    });
    expect(parseSchemaSalary(undefined)).toEqual({ min: null, max: null });
  });
});

describe("schemaEmploymentType", () => {
  it("maps schema employment types", () => {
    expect(schemaEmploymentType("FULL_TIME")).toBe("full_time");
    expect(schemaEmploymentType("CONTRACTOR")).toBe("c2c");
    expect(schemaEmploymentType(["FULL_TIME", "CONTRACTOR"])).toBe("c2c");
    expect(schemaEmploymentType("INTERN")).toBe("internship");
    expect(schemaEmploymentType(undefined)).toBeNull();
  });
});

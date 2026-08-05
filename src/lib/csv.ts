export interface CsvJob {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
  posted_at?: string;
  external_id?: string;
  source?: string;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function toInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function csvToJobs(csv: string): CsvJob[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = row[idx]?.trim() ?? "";
    });

    return {
      title: raw.title ?? "",
      company: raw.company || undefined,
      location: raw.location || undefined,
      description: raw.description || undefined,
      url: raw.url || undefined,
      salary_min: toInt(raw.salary_min),
      salary_max: toInt(raw.salary_max),
      posted_at: raw.posted_at || undefined,
      external_id: raw.external_id || undefined,
      source: raw.source || undefined,
    };
  });
}

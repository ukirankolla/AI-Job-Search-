export interface SearchableJob {
  title: string;
  company: string;
  location: string;
  description: string;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function fuzzyMatches(token: string, word: string): boolean {
  if (token.length < 4 || word.length < 4) return false;
  if (Math.abs(token.length - word.length) > 1) return false;
  return levenshtein(token, word) <= 1;
}

export function filterJobs<T extends SearchableJob>(
  jobs: T[],
  query: string,
): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return jobs;

  return jobs.filter((job) => {
    const fields = [job.title, job.company, job.location, job.description];
    const haystack = fields.join(" ").toLowerCase();
    const words = tokenize(haystack);

    return tokens.every((token) => {
      if (haystack.includes(token)) return true;
      return words.some((word) => fuzzyMatches(token, word));
    });
  });
}

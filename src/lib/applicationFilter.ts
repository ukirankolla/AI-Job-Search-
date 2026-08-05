export interface SearchableApplication {
  title: string;
  company: string;
  status: string;
  match_score: number | null;
}

export function filterApplications<T extends SearchableApplication>(
  applications: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return applications;

  return applications.filter((app) => {
    const text = [app.title, app.company, app.status].join(" ").toLowerCase();
    if (text.includes(q)) return true;

    const numeric = Number(q);
    if (
      !Number.isNaN(numeric) &&
      app.match_score !== null &&
      app.match_score !== undefined
    ) {
      return app.match_score >= numeric;
    }
    return false;
  });
}

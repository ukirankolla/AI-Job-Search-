export interface SearchableJob {
  title: string;
  company: string;
  location: string;
  description: string;
}

export function filterJobs<T extends SearchableJob>(
  jobs: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;
  return jobs.filter((job) =>
    [job.title, job.company, job.location, job.description].some((field) =>
      field.toLowerCase().includes(q),
    ),
  );
}

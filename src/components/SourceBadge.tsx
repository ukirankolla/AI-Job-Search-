interface SourceBadgeProps {
  source?: string | null;
}

const BRANDS: Record<
  string,
  { label: string; mark: string; tile: string; pill: string }
> = {
  greenhouse: {
    label: "Greenhouse",
    mark: "G",
    tile: "bg-emerald-500 text-white",
    pill: "bg-emerald-50 text-emerald-700",
  },
  lever: {
    label: "Lever",
    mark: "L",
    tile: "bg-slate-900 text-white",
    pill: "bg-slate-100 text-slate-700",
  },
  workable: {
    label: "Workable",
    mark: "W",
    tile: "bg-sky-600 text-white",
    pill: "bg-sky-50 text-sky-700",
  },
  ashby: {
    label: "Ashby",
    mark: "A",
    tile: "bg-indigo-600 text-white",
    pill: "bg-indigo-50 text-indigo-700",
  },
  linkedin: {
    label: "LinkedIn",
    mark: "in",
    tile: "bg-[#0A66C2] text-white",
    pill: "bg-blue-50 text-[#0A66C2]",
  },
  company: {
    label: "Company site",
    mark: "C",
    tile: "bg-teal-600 text-white",
    pill: "bg-teal-50 text-teal-700",
  },
  manual: {
    label: "Manual",
    mark: "+",
    tile: "bg-slate-400 text-white",
    pill: "bg-slate-100 text-slate-600",
  },
  search: {
    label: "Search",
    mark: "S",
    tile: "bg-slate-400 text-white",
    pill: "bg-slate-100 text-slate-600",
  },
};

const FALLBACK = BRANDS.search;

/**
 * Brand-colored badge for where a job came from — Greenhouse, Lever, LinkedIn,
 * etc. Renders a small brand tile + label so the feed reads like a premium
 * aggregator instead of plain text.
 */
export function SourceBadge({ source }: SourceBadgeProps) {
  const key = (source ?? "search").toLowerCase();
  const brand =
    BRANDS[key] ??
    FALLBACK;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 font-medium ${brand.pill}`}
    >
      <span
        className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold leading-none ${brand.tile}`}
      >
        {brand.mark}
      </span>
      {brand.label}
    </span>
  );
}

import Link from "next/link";

export const metadata = { title: "Sign in failed | Noventra" };

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ description?: string }>;
}) {
  const { description } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="mx-auto mt-24 max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-xl font-semibold text-rose-600">
          !
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Sign-in failed</h1>
        <p className="mt-2 text-sm text-slate-500">
          {description
            ? description
            : "We couldn't complete your sign-in. Please try again."}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

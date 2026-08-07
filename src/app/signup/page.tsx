import { SignupForm } from "@/components/SignupForm";

export const metadata = { title: "Get started free | Noventra" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <SignupForm next={next} />
    </main>
  );
}

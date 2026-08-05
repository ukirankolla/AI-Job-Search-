import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in | Noventra" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <LoginForm next={next} />
    </main>
  );
}

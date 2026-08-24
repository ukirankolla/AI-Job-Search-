import { LoginForm } from "@/components/LoginForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Sign in | Noventra" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell photoAlt="Two professionals shaking hands in a modern office lobby">
      <LoginForm next={next} />
    </AuthShell>
  );
}

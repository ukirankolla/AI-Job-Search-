import { SignupForm } from "@/components/SignupForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Get started free | Noventra" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell photoAlt="Two professionals shaking hands in a modern office lobby">
      <SignupForm next={next} />
    </AuthShell>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser, isOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/OnboardingForm";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Complete your profile | Noventra" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/onboarding");
  if (await isOnboarded(user.id)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: stored } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    id: user.id,
    full_name: stored?.full_name ?? user.name ?? "",
    title: stored?.title ?? "",
    summary: stored?.summary ?? "",
    skills: stored?.skills ?? [],
    resume_text: stored?.resume_text ?? "",
    resume_embedding_status: stored?.resume_embedding_status ?? "none",
    email: stored?.email ?? "",
    phone: stored?.phone ?? "",
    country: stored?.country ?? "",
    city: stored?.city ?? "",
    linkedin_url: stored?.linkedin_url ?? "",
    github_url: stored?.github_url ?? "",
    website_url: stored?.website_url ?? "",
    onboarding_completed: stored?.onboarding_completed ?? false,
    created_at: stored?.created_at ?? new Date().toISOString(),
    updated_at: stored?.updated_at ?? new Date().toISOString(),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <OnboardingForm profile={profile} email={user.email} next={next} />
    </main>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata = { title: "Profile | AI Job Search" };

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-rose-600">
          Profile not found. Re-authenticate to create it.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your profile powers the matcher, tailor, and prep agents.
      </p>
      <div className="mt-6">
        <ProfileForm profile={profile} />
      </div>
    </main>
  );
}

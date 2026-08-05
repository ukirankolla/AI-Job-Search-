import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.email,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return data?.onboarding_completed === true;
}

export async function requireOnboarded(): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await isOnboarded(user.id))) {
    redirect("/onboarding");
  }
  return user;
}

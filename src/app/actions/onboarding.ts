"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const urlField = z
  .string()
  .max(300)
  .refine((v) => v === "" || z.string().url().safeParse(v).success, {
    message: "Must be a valid URL or empty.",
  });

const onboardingSchema = z.object({
  email: z.string().email().max(200),
  full_name: z.string().min(1).max(200),
  phone: z.string().max(40),
  country: z.string().max(100),
  city: z.string().max(100),
  linkedin_url: urlField,
  github_url: urlField,
  website_url: urlField,
  next: z.string().max(200),
});

export type OnboardingFormState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function completeOnboarding(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = onboardingSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    city: formData.get("city"),
    linkedin_url: formData.get("linkedin_url"),
    github_url: formData.get("github_url"),
    website_url: formData.get("website_url"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the fields and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      country: parsed.data.country,
      city: parsed.data.city,
      linkedin_url: parsed.data.linkedin_url,
      github_url: parsed.data.github_url,
      website_url: parsed.data.website_url,
      onboarding_completed: true,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding");
  const next = parsed.data.next.startsWith("/") ? parsed.data.next : "/dashboard";
  redirect(next);
}

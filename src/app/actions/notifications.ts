"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: string): Promise<void> {
  const userId = (await requireUser()).id;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/dashboard");
}

export async function deleteNotification(id: string): Promise<void> {
  const userId = (await requireUser()).id;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = (await requireUser()).id;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  revalidatePath("/dashboard");
}

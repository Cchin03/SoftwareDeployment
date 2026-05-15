"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout"); //clear the cached layout

  const headersList = await headers();
  const referer = headersList.get("referer") || "";

  // If already on homepage, don't redirect (avoids loop)
  if (referer.endsWith("/")) {
    return;
  }

  redirect("/");
}
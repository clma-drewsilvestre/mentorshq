import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { isManagement } from "@/lib/constants";

/**
 * Returns the signed-in user's profile, or null. Verifies the token via getUser().
 * Wrapped in React cache() so multiple calls within one request (layout + page
 * both need the profile) dedupe to a single Supabase round trip.
 */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
});

/** Guard for authenticated pages. Redirects to /login if not signed in. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Guard for founder/ops-only pages (can create/edit team-wide data). */
export async function requireManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isManagement(profile.role)) redirect("/home");
  return profile;
}

/** Guard for founder-only pages. */
export async function requireFounder(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "founder") redirect("/home");
  return profile;
}


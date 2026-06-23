import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await getSessionProfile();
  redirect(profile ? "/home" : "/login");
}

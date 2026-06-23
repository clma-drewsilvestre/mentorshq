import { SetPasswordForm } from "./set-password-form";
import { getSessionProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Set your password" };

export default async function SetPasswordPage() {
  // Must be reached with a valid session (from the invite link callback).
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-gold">Welcome to Mentors HQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile.full_name ? `${profile.full_name}, set` : "Set"} a password to finish setting up
            your account.
          </p>
        </div>
        <SetPasswordForm />
      </div>
    </main>
  );
}

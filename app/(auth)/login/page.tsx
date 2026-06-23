import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-copper/40 bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-12 w-12" />
          </div>
          <h1 className="font-display text-4xl leading-none text-gold">Mentors HQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One team, three brands.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}

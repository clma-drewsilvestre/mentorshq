export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
      <h1 className="font-display text-4xl text-gold">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Mentors HQ needs a connection for live data. Reconnect and we&apos;ll pick up right where you
        left off.
      </p>
    </main>
  );
}

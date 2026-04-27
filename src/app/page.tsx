import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">LedgerIQ</h1>
      <Link
        href="/auth/signup"
        className="rounded-md bg-primary px-6 py-2 text-primary-foreground transition hover:opacity-90"
      >
        Get Started
      </Link>
    </main>
  );
}

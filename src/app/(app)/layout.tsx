/**
 * @file layout.tsx — Protected (app) route group layout.
 * @module app/(app)
 *
 * RSC gate: requires both authenticated user AND completed onboarding. The
 * middleware already enforces auth across the protected root paths, so this layer is the
 * onboarded-state check — users who skipped or abandoned onboarding get sent
 * back to /onboarding rather than seeing an empty shell.
 *
 * Renders the Sidebar + Header + children.
 *
 * @related lib/auth/getCurrentBusiness.ts, components/shell/*
 */

import { redirect } from "next/navigation";

import { ChatWidget } from "@/components/chat";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { getCurrentBusiness } from "@/lib/auth/getCurrentBusiness";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentBusiness();

  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar businessName={result.business.name} userEmail={result.user.email} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          businessName={result.business.name}
          userEmail={result.user.email}
        />
        <main className="flex-1 overflow-auto bg-background p-8">{children}</main>
      </div>
      <ChatWidget />
    </div>
  );
}

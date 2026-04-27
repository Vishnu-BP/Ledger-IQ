"use client";

/**
 * @file SignOutButton.tsx — Sidebar sign-out action.
 * @module components/shell
 *
 * Calls supabase.auth.signOut on the browser client which clears the auth
 * cookie. Then routes to / and triggers router.refresh() so RSCs re-render
 * with the cleared session.
 *
 * @dependencies @/lib/supabase/client, next/navigation
 * @related components/shell/Sidebar.tsx
 */

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      toast.error(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={signingOut}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

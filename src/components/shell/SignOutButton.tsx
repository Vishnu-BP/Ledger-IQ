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
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/50 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 group"
    >
      <LogOut className="h-5 w-5 text-white/30 transition-colors group-hover:text-red-400" />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

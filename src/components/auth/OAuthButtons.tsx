"use client";

/**
 * @file OAuthButtons.tsx — Google + GitHub social sign-in buttons.
 * @module components/auth
 *
 * Calls supabase.auth.signInWithOAuth which redirects the browser to the
 * provider. After the user authorizes, the provider redirects to our
 * /auth/callback route which exchanges the code for a session.
 *
 * The redirectTo URL is built from window.location.origin so it works in
 * both local dev and production deploys without extra env wiring.
 *
 * @dependencies @/lib/supabase/client, sonner
 * @related app/auth/callback/route.ts
 */

import { Github } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "github" | null>(null);

  async function signInWith(provider: "google" | "github") {
    setLoading(provider);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(null);
      toast.error(error.message);
    }
    // On success the browser is navigating to the provider; nothing more to do.
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full border-slate-200 bg-white font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98]"
        disabled={loading !== null}
        onClick={() => signInWith("google")}
      >
        <GoogleIcon className="mr-3 h-5 w-5" />
        {loading === "google" ? "Connecting…" : "Continue with Google"}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full border-slate-200 bg-white font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98]"
        disabled={loading !== null}
        onClick={() => signInWith("github")}
      >
        <Github className="mr-3 h-5 w-5" />
        {loading === "github" ? "Connecting…" : "Continue with GitHub"}
      </Button>
    </div>
  );
}

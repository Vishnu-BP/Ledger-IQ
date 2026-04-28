"use client";

/**
 * @file EmailOtpForm.tsx — Passwordless email-OTP auth (signup + login unified).
 * @module components/auth
 *
 * Two-stage flow:
 *   Stage 1 — user enters email; we call signInWithOtp which Supabase routes
 *             to either the "Confirm sign up" or "Magic Link" email template
 *             depending on whether the address has registered before.
 *             shouldCreateUser=true means new emails auto-create an account.
 *   Stage 2 — user enters the 6-digit code from email; verifyOtp({type:'email'})
 *             exchanges it for a session. router.push then routes by callback
 *             logic (no business → /onboarding, business → /dashboard).
 *
 * The same component is used at /auth/login and /auth/signup — Supabase
 * handles the new-vs-returning distinction transparently.
 *
 * @dependencies @/lib/supabase/client, react-hook-form, zod, sonner
 * @related app/auth/login/page.tsx, app/auth/signup/page.tsx
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, SendHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export function EmailOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [stage, setStage] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: "" },
  });

  async function sendCode(values: EmailValues) {
    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { shouldCreateUser: true },
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEmail(values.email);
    setStage("otp");
    toast.success(`We emailed a 6-digit code to ${values.email}`);
  }

  async function verifyCode(values: OtpValues) {
    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: values.token,
      type: "email",
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    toast.success("Signed in");
    // Honor explicit ?redirect= (e.g. middleware bounce-back) when present.
    // Default to /onboarding which itself routes to /dashboard if a
    // business already exists — handles both new and returning users.
    router.push(redirectTo ?? "/onboarding");
    router.refresh();
  }

  function backToEmail() {
    setStage("email");
    otpForm.reset();
  }

  if (stage === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(sendCode)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className="h-12 pl-12 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              {...emailForm.register("email")}
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-sm font-medium text-red-500">
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="h-12 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending code…
            </>
          ) : (
            <>
              Send me a code
              <SendHorizontal className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(verifyCode)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">6-digit code</Label>
        <Input
          id="token"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="••••••"
          className="tracking-[0.5em] text-center text-lg"
          {...otpForm.register("token")}
        />
        <p className="text-xs text-muted-foreground">
          Sent to <span className="font-medium">{email}</span>. Check spam if
          it doesn&apos;t arrive within a minute.
        </p>
        {otpForm.formState.errors.token && (
          <p className="text-sm text-destructive">
            {otpForm.formState.errors.token.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
          </>
        ) : (
          "Verify and continue"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={backToEmail}
        disabled={submitting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Use a different email
      </Button>
    </form>
  );
}

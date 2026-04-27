"use client";

import Link from "next/link";
import { Suspense } from "react";
import { BarChart3, Quote } from "lucide-react";

import { EmailOtpForm } from "@/components/auth/EmailOtpForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Brand (Hidden on mobile) */}
      <div className="hidden flex-col justify-between bg-brand-navy p-10 lg:flex">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2 text-indigo-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-medium tracking-tight">LedgerIQ</span>
          </Link>
          <div className="space-y-2">
            <h2 className="max-w-[220px] text-2xl font-medium leading-tight text-white">
              Stop worrying about accounting, start growing.
            </h2>
            <p className="text-sm text-indigo-300">
              The only financial autopilot built specifically for Indian SMBs.
            </p>
          </div>
        </div>

        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-indigo/20">
            <Quote className="h-3 w-3 text-brand-indigo" />
          </div>
          <p className="mb-4 text-sm leading-relaxed text-indigo-100">
            "We used to spend days on GST filing. With LedgerIQ, it's literally three clicks. Truly a game-changer for our business."
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-indigo text-xs font-medium text-white">
              RP
            </div>
            <div>
              <p className="text-xs font-medium text-white">Rajesh Patel</p>
              <p className="text-[10px] text-indigo-400">MD, Patel Logistics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex flex-col justify-center bg-white p-8 dark:bg-zinc-950 lg:p-16">
        <div className="mx-auto w-full max-w-[360px] space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-medium tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500">Start automating your business finances today</p>
          </div>

          <div className="space-y-4">
            <OAuthButtons />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 dark:bg-zinc-950">
                  Or with email
                </span>
              </div>
            </div>

            <Suspense fallback={<div className="h-20 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-900" />}>
              <EmailOtpForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-brand-indigo hover:underline underline-offset-4"
            >
              Sign in &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

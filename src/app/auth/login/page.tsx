"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { BarChart3, Quote, ShieldCheck, Globe, Heart } from "lucide-react";

import { EmailOtpForm } from "@/components/auth/EmailOtpForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full bg-[#030113] overflow-hidden">
      {/* Left Panel - Hero Section */}
      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex h-full">
        {/* ... (background elements same as before) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] h-[30%] w-[30%] rounded-full bg-purple-600/20 blur-[100px]" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">LedgerIQ</span>
          </Link>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="max-w-lg text-4xl xl:text-5xl font-bold leading-[1.1] text-white">
              The smartest way to <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                manage business finances.
              </span>
            </h1>
            <p className="max-w-sm text-base xl:text-lg text-indigo-100/60 leading-relaxed">
              Join 500+ Indian SMBs automating their growth with AI-powered bookkeeping.
            </p>
          </div>

          {/* Dashboard Mockup - Compact for one-screen */}
          <div className="relative mt-4 group transition-transform duration-500 hover:scale-[1.01]">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-2xl opacity-40" />
            <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/dashboard-mockup.png" 
                alt="Dashboard Mockup" 
                width={800} 
                height={500}
                className="w-full h-auto opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Testimonial - Compact */}
        <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 xl:p-6 backdrop-blur-md">
          <p className="mb-4 text-sm xl:text-base leading-relaxed text-indigo-50/90 italic">
            "LedgerIQ has saved us over 20 hours a month on bookkeeping. The GST integration is a lifesaver for our agency."
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 xl:h-10 xl:w-10 items-center justify-center rounded-full bg-indigo-600 text-xs xl:text-sm font-semibold text-white">
              AS
            </div>
            <div>
              <p className="text-xs xl:text-sm font-semibold text-white">Anand Sharma</p>
              <p className="text-[10px] xl:text-xs text-indigo-300/70 font-medium">Founder, ScaleUp Media</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Floating Card Section */}
      <div className="relative flex w-full items-center justify-center lg:w-1/2 p-4 sm:p-8 lg:p-12 z-20">
        <div className="relative w-full max-w-[500px] h-full max-h-[850px] flex flex-col justify-center bg-white dark:bg-zinc-950 rounded-[40px] sm:rounded-[56px] shadow-[0_20px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
          {/* Mobile Header - Integrated into card */}
          <div className="absolute top-0 left-0 right-0 p-8 lg:hidden flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold dark:text-white text-slate-900">LedgerIQ</span>
            </Link>
          </div>

          <div className="mx-auto flex w-full flex-col justify-center px-8 sm:px-14 py-12">
            <div className="mb-8 sm:mb-10 flex flex-col items-center text-center">
              {/* Icon Header */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome back 👋</h2>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400 font-medium">Sign in to your account</p>
            </div>

            <div className="space-y-6">
              <OAuthButtons />
              
              <div className="relative flex items-center justify-center py-1">
                <span className="w-full border-t border-slate-100 dark:border-zinc-800" />
                <span className="absolute bg-white dark:bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">
                  OR
                </span>
              </div>

              <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-3xl bg-slate-50 dark:bg-zinc-900" />}>
                <EmailOtpForm />
              </Suspense>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors inline-flex items-center gap-1 group"
              >
                Sign up 
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </p>

            {/* Footer Features - Integrated and Clean */}
            <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-zinc-800 pt-8">
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-slate-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Security</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-x border-slate-100 dark:border-zinc-800 px-1">
                <Globe className="h-5 w-5 text-slate-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SMB Focus</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Heart className="h-5 w-5 text-slate-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">500+ SMBs</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}


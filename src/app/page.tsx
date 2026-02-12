
"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Wallet, BookOpen, Sparkles } from "lucide-react";

export default function RootPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-black animate-pulse">Syncing...</div>;
  }

  // PUBLIC LANDING PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="h-20 flex items-center justify-between px-10 border-b">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-black tracking-tight">Mindful Tracker</h1>
          </div>
          <Button asChild variant="ghost" className="font-bold">
            <Link href="/login">Sign In</Link>
          </Button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 py-20 max-w-4xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none text-slate-900">
              Track your journey <br/> with <span className="text-primary italic">clarity.</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              The professional-grade companion for the SO Program. Manage session logs and financials with automated AI insights.
            </p>
          </div>

          <Button asChild size="lg" className="rounded-full px-12 h-20 text-xl font-black shadow-2xl hover:scale-105 transition-all">
            <Link href="/login" className="flex items-center gap-4">
              Get Started <ArrowRight className="h-6 w-6" />
            </Link>
          </Button>

          <div className="grid gap-8 sm:grid-cols-3 w-full pt-10">
            {[
              { title: "Logging", icon: BookOpen },
              { title: "Ledger", icon: Wallet },
              { title: "Insights", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                   <f.icon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-black text-xs uppercase tracking-widest text-slate-400">{f.title}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50 p-10 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4">
         <h1 className="text-5xl font-black tracking-tight">Authenticated!</h1>
         <p className="text-xl font-medium text-slate-500">Welcome back, <span className="text-primary">{user.email}</span></p>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={logout} variant="outline" className="h-14 px-8 rounded-2xl font-black border-2">Sign Out</Button>
        <Button asChild className="h-14 px-8 rounded-2xl font-black shadow-lg">
           <Link href="/sessions">View Ledger</Link>
        </Button>
      </div>
    </div>
  );
}

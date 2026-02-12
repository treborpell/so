
"use client"

import { useAuth } from "@/firebase/provider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Wallet, Heart, Sparkles, Plus, AlertCircle, History, CheckCircle2, BrainCircuit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

export default function RootPage() {
  const { user, db, loading } = useAuth();
  
  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "so_entries"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: logs } = useCollection(entriesQuery);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">Mindful...</div>;
  }

  // PUBLIC LANDING PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="h-20 flex items-center justify-between px-6 sm:px-12 bg-white border-b sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-headline font-black text-2xl tracking-tighter">Mindful Tracker</h1>
          </div>
          <Button asChild className="rounded-full px-8 h-12 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
            <Link href="/login">Dashboard Login</Link>
          </Button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto space-y-16 py-20">
          <div className="space-y-8">
            <Badge className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">Industry Standard SO Support</Badge>
            <h2 className="text-5xl sm:text-8xl font-black tracking-tighter text-slate-950 leading-[0.9]">
              Track Your Journey. <br/> <span className="text-primary">Unlock Your Growth.</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              The premier digital companion for the SO Program. Manage logs, track financials, and gain AI-driven insights with absolute clarity and privacy.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 w-full">
            {[
              { title: "Clinical Logging", desc: "Detailed session tracking and breakthrough documentation.", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
              { title: "Financial Ledger", desc: "Real-time balance tracking and payment history.", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "AI Analytics", desc: "Automated insight extraction from session notes.", icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50" }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 text-left hover:translate-y-[-8px] transition-all duration-300">
                <div className={`h-16 w-16 rounded-[1.25rem] ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>

          <div className="pt-10">
            <Button asChild size="lg" className="rounded-full px-12 h-20 text-xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:scale-105 transition-all">
              <Link href="/login" className="flex items-center gap-4">
                Start Your Tracker <ArrowRight className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </main>

        <footer className="py-12 border-t text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Mindful Tracker • Secure Therapeutic Management
        </footer>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  const totals = logs?.reduce((acc, log) => ({
    cost: acc.cost + (Number(log.cost) || 0),
    paid: acc.paid + (Number(log.paidAmount) || 0)
  }), { cost: 0, paid: 0 }) || { cost: 0, paid: 0 };

  const balance = totals.paid - totals.cost;

  const stats = [
    { name: "Financial Ledger", value: balance === 0 ? "$0.00" : (balance > 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`), icon: Wallet, color: balance < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600" },
    { name: "Logged Sessions", value: logs?.length || "0", icon: BookOpen, color: "bg-purple-50 text-purple-600" },
    { name: "Latest Session", value: logs?.[0]?.date || "None", icon: Heart, color: "bg-blue-50 text-blue-600" },
    { name: "Growth Insights", value: logs?.filter(l => !!l.aiInsight).length || "0", icon: Sparkles, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-20 shrink-0 items-center justify-between gap-2 border-b bg-white/80 px-8 sticky top-0 z-40 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-10 w-10 rounded-xl" />
              <h2 className="text-2xl font-black tracking-tight">Dashboard Overview</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold hidden sm:flex border-2">
                <Link href="/sessions?tab=history"><History className="h-4 w-4 mr-2" /> History</Link>
              </Button>
              <Button asChild className="rounded-xl shadow-lg h-11 px-6 font-black">
                <Link href="/sessions?tab=new-entry"><Plus className="h-5 w-5 mr-2" /> New Entry</Link>
              </Button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.name} className="border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className={`p-3 rounded-2xl w-fit ${stat.color} mb-4`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{stat.name}</p>
                      <h3 className="text-2xl font-black">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">Recent Activity</CardTitle>
                    <CardDescription className="font-medium">Your latest program milestones.</CardDescription>
                  </div>
                  <Button asChild variant="ghost" className="h-10 rounded-xl font-bold text-primary">
                    <Link href="/sessions?tab=history">View Ledger</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {logs?.slice(0, 4).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                        <div className="space-y-1">
                          <p className="text-sm font-black">WK {log.week}: {log.presentationTopic || 'General Session'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{log.date}</p>
                        </div>
                        <Badge className={`rounded-full px-3 py-1 font-black text-[9px] ${Number(log.paidAmount) >= Number(log.cost) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}>
                          {Number(log.paidAmount) >= Number(log.cost) ? 'PAID' : 'DUE'}
                        </Badge>
                      </div>
                    ))}
                    {(!logs || logs.length === 0) && (
                      <div className="text-center py-12 text-slate-400 font-bold italic border-2 border-dashed rounded-3xl">No sessions logged yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden border-t-8 border-primary">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black">Ledger Health</CardTitle>
                  <CardDescription className="font-medium">Total program financial status.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-blue-50/50 space-y-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Total Liability</p>
                      <p className="text-3xl font-black text-blue-900">${totals.cost.toFixed(2)}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-50/50 space-y-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Payments</p>
                      <p className="text-3xl font-black text-emerald-900">${totals.paid.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-3xl border-2 flex items-center gap-4 ${balance < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className={`p-3 rounded-xl ${balance < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {balance < 0 ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${balance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {balance < 0 ? `Outstanding Balance: $${Math.abs(balance).toFixed(2)}` : 'Financial standing is currently clear.'}
                      </p>
                      <p className="text-xs font-medium text-slate-500">Last updated today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

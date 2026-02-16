
"use client"

import { useAuth } from "@/firebase/provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Wallet, Plus, BrainCircuit, ArrowRight, ShieldCheck, Users, ScrollText, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { SyllabusProgressCard } from "@/components/SyllabusProgressCard";
import { ComplianceOverviewCard } from "@/components/ComplianceOverviewCard";

export default function RootPage() {
  const { user, db, loading } = useAuth();
  
  const entriesQuery = useMemoFirebase(() => !db || !user ? null : query(collection(db, "users", user.uid, "so_entries"), orderBy("date", "desc")), [db, user]);
  const polygraphQuery = useMemoFirebase(() => !db || !user ? null : query(collection(db, "users", user.uid, "polygraphs"), orderBy("date", "desc")), [db, user]);
  const socialQuery = useMemoFirebase(() => !db || !user ? null : query(collection(db, "users", user.uid, "pro_social_logs"), orderBy("date", "desc")), [db, user]);

  const { data: logs } = useCollection(entriesQuery);
  const { data: polygraphs } = useCollection(polygraphQuery);
  const { data: socialLogs } = useCollection(socialQuery);

  // Calculate totals and balance
  const totals = logs?.reduce((acc, log) => ({ 
    cost: acc.cost + (Number(log.cost) || 0), 
    paid: acc.paid + (Number(log.paidAmount) || 0) 
  }), { cost: 0, paid: 0 }) || { cost: 0, paid: 0 };
  const totalBalance = totals.paid - totals.cost;

  // Calculate running balance for each log
  const logsWithRunningBalance = useMemoFirebase(() => {
    if (!logs) return [];
    let runningBalance = totalBalance;
    return logs.map(log => {
      const logBalance = runningBalance;
      const cost = Number(log.cost) || 0;
      const paid = Number(log.paidAmount) || 0;
      runningBalance -= (paid - cost);
      return { ...log, runningBalance: logBalance };
    });
  }, [logs, totalBalance]);


  if (loading) {
    return <div className="h-full flex items-center justify-center font-black animate-pulse">Mindful...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col -m-4 sm:-m-8">
        <header className="h-20 flex items-center justify-between px-6 sm:px-12 bg-white border-b sticky top-0 z-50">
            <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"><BrainCircuit className="h-6 w-6 text-primary-foreground" /></div><h1 className="font-headline font-black text-2xl tracking-tighter">Mindful Tracker</h1></div>
            <Button asChild className="rounded-full px-8 h-12 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"><Link href="/login">Dashboard Login</Link></Button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto space-y-16 py-20">
            <div className="space-y-8"><Badge className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">Industry Standard SO Support</Badge><h2 className="text-5xl sm:text-8xl font-black tracking-tighter text-slate-950 leading-[0.9]">Track Your Journey. <br/> <span className="text-primary">Unlock Your Growth.</span></h2><p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">The premier digital companion for the SO Program. Manage logs, track financials, and gain AI-driven insights with absolute clarity and privacy.</p></div>
            <div className="grid gap-8 sm:grid-cols-3 w-full">
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 text-left hover:translate-y-[-8px] transition-all duration-300"><div className="h-16 w-16 rounded-[1.25rem] bg-purple-50 flex items-center justify-center mb-6"><BookOpen className="h-8 w-8 text-purple-600" /></div><h3 className="text-xl font-black mb-3">Clinical Logging</h3><p className="text-slate-500 font-medium leading-relaxed">Detailed session tracking and breakthrough documentation.</p></Card>
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 text-left hover:translate-y-[-8px] transition-all duration-300"><div className="h-16 w-16 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center mb-6"><Wallet className="h-8 w-8 text-emerald-600" /></div><h3 className="text-xl font-black mb-3">Financial Ledger</h3><p className="text-slate-500 font-medium leading-relaxed">Real-time balance tracking and payment history.</p></Card>
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 text-left hover:translate-y-[-8px] transition-all duration-300"><div className="h-16 w-16 rounded-[1.25rem] bg-amber-50 flex items-center justify-center mb-6"><Users className="h-8 w-8 text-amber-600" /></div><h3 className="text-xl font-black mb-3">Compliance Tracking</h3><p className="text-slate-500 font-medium leading-relaxed">Monitor polygraphs, pro-social activities, and assignments.</p></Card>
            </div>
            <div className="pt-10"><Button asChild size="lg" className="rounded-full px-12 h-20 text-xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:scale-105 transition-all"><Link href="/login" className="flex items-center gap-4">Start Your Tracker <ArrowRight className="h-6 w-6" /></Link></Button></div>
        </main>
        <footer className="py-12 border-t text-center text-xs text-slate-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} Mindful Tracker • Secure Therapeutic Management</footer>
      </div>
    );
  }

  const stats = [
    { name: "Financial Ledger", value: totalBalance === 0 ? "$0.00" : (totalBalance > 0 ? `+$${totalBalance.toFixed(2)}` : `-$${Math.abs(totalBalance).toFixed(2)}`), icon: Wallet, color: totalBalance < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600", href: "/sessions?tab=history" },
    { name: "Logged Sessions", value: logs?.length || "0", icon: BookOpen, color: "bg-purple-50 text-purple-600", href: "/sessions?tab=history" },
    { name: "Polygraphs Taken", value: polygraphs?.length || "0", icon: ShieldCheck, color: "bg-blue-50 text-blue-600", href: "/polygraphs?tab=history" },
    { name: "Pro-Social Events", value: socialLogs?.length || "0", icon: Users, color: "bg-amber-50 text-amber-600", href: "/social?tab=history" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-20 shrink-0 items-center justify-between gap-2 border-b bg-white/80 px-8 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-4"><SidebarTrigger className="h-10 w-10 rounded-xl" /><h2 className="text-2xl font-black tracking-tight">Dashboard</h2></div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold hidden sm:flex border-2 transition-all hover:bg-primary/5 hover:border-primary/20"><Link href="/journal"><NotebookPen className="h-4 w-4 mr-2" /> + Journal Entry</Link></Button>
          <Button asChild className="rounded-xl shadow-lg h-11 px-6 font-black transition-all hover:scale-105"><Link href="/sessions?tab=new-entry"><ScrollText className="h-4 w-4 mr-2" /> + Program Log</Link></Button>
        </div>
      </header>

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden hover:scale-105 transition-transform">
                <CardContent className="p-6">
                    <div className={`p-3 rounded-2xl w-fit ${stat.color} mb-4`}><stat.icon className="h-6 w-6" /></div>
                    <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{stat.name}</p><h3 className="text-2xl font-black">{stat.value}</h3></div>
                </CardContent>
                </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SyllabusProgressCard />
            <ComplianceOverviewCard polygraphs={polygraphs} socialLogs={socialLogs} />
            <div className="lg:col-span-2">
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between"><div><CardTitle className="text-xl font-black">Recent Activity</CardTitle><CardDescription className="font-medium">Your latest program milestones.</CardDescription></div><Button asChild variant="ghost" className="h-10 rounded-xl font-bold text-primary"><Link href="/sessions?tab=history">View Ledger</Link></Button></CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-4">
                            {logsWithRunningBalance?.slice(0, 4).map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black">WK {log.week}: {log.presentationTopic || 'General Session'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{log.date}</p>
                                    </div>
                                    <Badge className={`rounded-full px-3 py-1 font-black text-[9px] ${log.runningBalance > 0 ? 'bg-emerald-100 text-emerald-700' : log.runningBalance < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {log.runningBalance > 0 ? `+` : ''}${log.runningBalance.toFixed(2)}
                                    </Badge>
                                </div>
                            ))}
                            {(!logs || logs.length === 0) && (<div className="text-center py-12 text-slate-400 font-bold italic border-2 border-dashed rounded-3xl">No sessions logged yet.</div>)}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}

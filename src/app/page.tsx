
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Wallet, Heart, Sparkles, Plus, AlertCircle, History, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "so_entries"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: logs } = useCollection(entriesQuery);

  const totals = logs?.reduce((acc, log) => {
    return {
      cost: acc.cost + (Number(log.cost) || 0),
      paid: acc.paid + (Number(log.paidAmount) || 0)
    }
  }, { cost: 0, paid: 0 }) || { cost: 0, paid: 0 };

  const balance = totals.paid - totals.cost;

  const stats = [
    { 
      name: "Financial Balance", 
      value: balance === 0 ? "$0.00" : (balance > 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`), 
      icon: Wallet, 
      color: balance < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600" 
    },
    { name: "Total Sessions", value: logs?.length || "0", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
    { name: "Last Session", value: logs?.[0]?.date || "N/A", icon: Heart, color: "bg-blue-100 text-blue-600" },
    { name: "Growth Insights", value: logs?.filter(l => !!l.aiInsight).length || "0", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset className="bg-background/50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-bold">My Journey</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full h-10 px-4 hidden sm:flex">
              <Link href="/sessions?tab=history"><History className="h-4 w-4 mr-2" /> History</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full shadow-lg h-10 px-4">
              <Link href="/sessions?tab=new-entry"><Plus className="h-4 w-4 mr-2" /> New Log</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 space-y-6">
          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className={`p-2 rounded-lg w-fit ${stat.color} mb-2`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-bold">{stat.value}</h3>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription className="text-xs">Your latest sessions and topics.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                  <Link href="/sessions?tab=history">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs?.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold truncate max-w-[200px]">WK {log.week}: {log.presentationTopic || 'General Session'}</p>
                        <p className="text-[10px] text-muted-foreground">{log.date}</p>
                      </div>
                      <Badge variant={Number(log.paidAmount) >= Number(log.cost) ? "secondary" : "destructive"} className="text-[9px]">
                        {Number(log.paidAmount) >= Number(log.cost) ? 'Covered' : 'Balance Due'}
                      </Badge>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">No logs found.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ledger Summary</CardTitle>
                <CardDescription className="text-xs">Lifetime cost vs lifetime payments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-blue-50/50">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Total Cost</p>
                    <p className="text-lg font-bold">${totals.cost.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid</p>
                    <p className="text-lg font-bold">${totals.paid.toFixed(2)}</p>
                  </div>
                </div>
                {balance < 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs font-bold text-red-700">You have a remaining balance of ${Math.abs(balance).toFixed(2)}</p>
                  </div>
                )}
                {balance >= 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-700">Account is current.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </div>
  );
}

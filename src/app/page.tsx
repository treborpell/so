
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckSquare, Heart, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  // Use the specific path for SO Program entries for the dashboard preview
  const recentLogsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "so_entries"), 
      orderBy("date", "desc"), 
      limit(5)
    );
  }, [db, user]);
  
  const { data: logs } = useCollection(recentLogsQuery);

  const stats = [
    { name: "Total Sessions", value: logs?.length || "0", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
    { name: "Last Session", value: logs?.[0]?.date || "N/A", icon: Heart, color: "bg-red-100 text-red-600" },
    { name: "Growth Insights", value: logs?.filter(l => !!l.aiInsight).length || "0", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
    { name: "WK Progress", value: logs?.[0]?.week || "0", icon: CheckSquare, color: "bg-blue-100 text-blue-600" },
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
             <Button asChild size="sm" className="rounded-full shadow-lg h-10 px-4">
                <Link href="/sessions">
                  <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">New Log</span>
                </Link>
             </Button>
          </div>
        </header>

        <main className="flex-1 p-4 space-y-6">
          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="border-none shadow-sm touch-manipulation">
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent SO Ledger Entries</CardTitle>
                <CardDescription className="text-xs">Your latest program sessions and attendance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs?.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold truncate max-w-[200px]">WK {log.week}: {log.presentationTopic || 'No topic recorded'}</p>
                        <p className="text-[10px] text-muted-foreground">{log.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px]" asChild>
                        <Link href="/sessions">View</Link>
                      </Button>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No logs found. Start your first session entry or import your data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Financial Status</CardTitle>
                <CardDescription className="text-xs">Recent payments and check tracking.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                  {logs?.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className={`h-2 w-2 rounded-full ${log.paid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-bold">${log.cost?.toFixed(2)} - {log.paid ? 'Paid' : 'Unpaid'}</p>
                        <p className="text-[10px] text-muted-foreground">Check: {log.checkNumber || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No financial data recorded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </div>
  );
}

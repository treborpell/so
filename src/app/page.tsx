
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, BrainCircuit, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";

export default function DashboardPage() {
  const db = useFirestore();
  
  const patientsQuery = query(collection(db, "patients"), limit(10));
  const { data: patients } = useCollection(patientsQuery);
  
  const sessionsQuery = query(collection(db, "sessions"), limit(5));
  const { data: sessions } = useCollection(sessionsQuery);

  const stats = [
    { name: "Total Patients", value: patients?.length || "0", icon: Users, color: "bg-blue-100 text-blue-600" },
    { name: "Active Sessions", value: sessions?.length || "0", icon: CalendarDays, color: "bg-purple-100 text-purple-600" },
    { name: "Clinical Logs", value: "Locked", icon: BrainCircuit, color: "bg-emerald-100 text-emerald-600" },
    { name: "Growth Rate", value: "82%", icon: Activity, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset className="bg-background/50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-bold">Clinical Log</h2>
          </div>
          <div className="flex items-center gap-2">
             <Button asChild size="sm" className="rounded-full shadow-lg h-10 px-4">
                <Link href="/sessions/new">
                  <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">New Session</span>
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
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Quick view of your clinical spreadsheet logs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions?.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">{session.title}</p>
                        <p className="text-[10px] text-muted-foreground">{session.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px]" asChild>
                        <Link href={`/sessions/${session.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No logs found. Start by adding a session.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Patient Overview</CardTitle>
                <CardDescription className="text-xs">Aggregate data from your imported logs.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[160px]">
                  <Activity className="h-12 w-12 text-primary/20 mb-2" />
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Visualize your group progress scores here after syncing with your spreadsheet.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 rounded-full" asChild>
                    <Link href="/import">Sync Logs</Link>
                  </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </div>
  );
}

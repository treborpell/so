import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, BrainCircuit, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    { name: "Active Patients", value: "24", icon: Users, change: "+2 from last week", color: "bg-blue-100 text-blue-600" },
    { name: "Weekly Sessions", value: "12", icon: CalendarDays, change: "On track", color: "bg-purple-100 text-purple-600" },
    { name: "AI Summaries", value: "86", icon: BrainCircuit, change: "100% complete", color: "bg-emerald-100 text-emerald-600" },
    { name: "Group Progress", value: "78%", icon: Activity, change: "+5% avg growth", color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset className="bg-background/50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
             <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/import">Import Spreadsheet</Link>
             </Button>
             <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
                New Session
             </Button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-8">
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            ))}Section
          </section>

          <section className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white/50 border-b">
                <CardTitle>Recent Group Progress</CardTitle>
                <CardDescription>Aggregate emotional well-being scores across all active groups.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex items-center justify-center min-h-[300px] bg-slate-50/50">
                <div className="text-center p-8">
                   <div className="w-64 h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
                     <div className="w-3/4 h-full bg-primary" />
                   </div>
                   <p className="text-muted-foreground text-sm">Visualize your session data here after importing your spreadsheet.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Sessions scheduled for the next 48 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Anxiety Management A", time: "Today, 2:00 PM", status: "Ready" },
                  { title: "Social Integration Group", time: "Today, 4:30 PM", status: "Needs Prep" },
                  { title: "PTSD Support Round", time: "Tomorrow, 10:00 AM", status: "Ready" },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{session.title}</p>
                      <p className="text-xs text-muted-foreground">{session.time}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${session.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {session.status}
                    </span>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-xs font-semibold text-primary" asChild>
                  <Link href="/sessions">View Calendar</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </div>
  );
}
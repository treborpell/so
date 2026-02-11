
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckSquare, Heart, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  // Simulated paths - in a real app, these would use user.uid
  const reflectionsQuery = query(collection(db, "reflections"), limit(3), orderBy("date", "desc"));
  const { data: reflections } = useCollection(reflectionsQuery);
  
  const assignmentsQuery = query(collection(db, "assignments"), limit(5));
  const { data: assignments } = useCollection(assignmentsQuery);

  const stats = [
    { name: "Mood Score", value: "8/10", icon: Heart, color: "bg-red-100 text-red-600" },
    { name: "Assignments", value: assignments?.filter(a => a.status === 'pending').length || "0", icon: CheckSquare, color: "bg-blue-100 text-blue-600" },
    { name: "Journal Streak", value: "5 Days", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
    { name: "Insights", value: "4 New", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
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
                <CardTitle className="text-base">Recent Reflections</CardTitle>
                <CardDescription className="text-xs">Your latest journal entries and mood logs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reflections?.map((reflection: any) => (
                    <div key={reflection.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold truncate max-w-[200px]">{reflection.notes}</p>
                        <p className="text-[10px] text-muted-foreground">{reflection.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px]" asChild>
                        <Link href="/sessions">View</Link>
                      </Button>
                    </div>
                  ))}
                  {(!reflections || reflections.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No logs found. Start your first reflection.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open Assignments</CardTitle>
                <CardDescription className="text-xs">Tasks to focus on this week.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                  {assignments?.filter(a => a.status === 'pending').map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{assignment.title}</p>
                        <p className="text-[10px] text-muted-foreground">Due: {assignment.dueDate}</p>
                      </div>
                    </div>
                  ))}
                  {(!assignments || assignments.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      All caught up! No pending assignments.
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

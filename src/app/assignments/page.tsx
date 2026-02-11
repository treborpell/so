
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore } from "@/firebase/provider"

export default function AssignmentsPage() {
  const db = useFirestore();
  
  const assignmentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "assignments"), orderBy("dueDate", "desc"));
  }, [db]);
  
  const { data: assignments, loading } = useCollection(assignmentsQuery);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-bold">Assignments</h2>
          </div>
          <Button size="sm" className="rounded-full shadow-lg h-10">
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </header>

        <main className="p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">Loading tasks...</div>
            ) : (
              <div className="grid gap-3">
                {assignments?.map((assignment: any) => (
                  <Card key={assignment.id} className="border-none shadow-sm active:scale-[0.98] transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-full ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {assignment.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm ${assignment.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {assignment.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">{assignment.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="rounded-full h-6 text-[10px] bg-slate-50">
                          <Clock className="h-3 w-3 mr-1" /> {assignment.dueDate}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!assignments || assignments.length === 0) && (
                   <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-500">No assignments tracked yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add tasks from your therapy sessions here.</p>
                    <Button variant="outline" size="sm" className="mt-4 rounded-full">Add First Assignment</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

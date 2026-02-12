"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/firebase/provider"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function AISummariesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
        <SidebarTrigger />
        <h2 className="text-xl font-headline font-bold">AI Summaries</h2>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Clinical Assistant</h1>
              <p className="text-muted-foreground">Manage and review GenAI session summaries and action items.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="border-none shadow-sm bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.4%</div>
                <p className="text-xs text-muted-foreground mt-1">Valid clinical summaries generated</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-accent-foreground">
                  <Clock className="h-4 w-4" />
                  Average Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground mt-1">Processing time per session</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
             <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-base">Recent Insights Engine Logs</CardTitle>
              <CardDescription className="text-xs">Track the reasoning process of the session summarizer tool.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[
                  { status: "valid", text: "Successfully extracted 3 action items from Anxiety Group B", time: "2 mins ago" },
                  { status: "valid", text: "Structured discussion points for Youth Support Group", time: "1 hour ago" },
                  { status: "invalid", text: "Insufficient details for Summary: Session notes were less than 10 words", time: "3 hours ago", warning: true },
                  { status: "valid", text: "Cross-referenced patient progress in CBT Round 4", time: "5 hours ago" },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`mt-0.5 ${log.warning ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {log.warning ? <AlertTriangle className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm ${log.warning ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{log.text}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
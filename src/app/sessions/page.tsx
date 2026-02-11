"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Search, Plus, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession, SummarizeSessionOutput } from "@/ai/flows/summarize-session"

const INITIAL_SESSIONS = [
  { 
    id: "1", 
    title: "Grief & Loss Workshop", 
    date: "2024-05-15", 
    participants: 6, 
    notes: "Discussion focused on coping strategies for anniversary dates. Participants shared personal rituals.",
    summary: null as SummarizeSessionOutput | null
  },
  { 
    id: "2", 
    title: "CBT Fundamentals Group", 
    date: "2024-05-14", 
    participants: 8, 
    notes: "Reviewed automatic thought patterns. Group practiced identifying distortions in real-time scenarios.",
    summary: null as SummarizeSessionOutput | null
  },
  { 
    id: "3", 
    title: "Youth Anxiety Support", 
    date: "2024-05-12", 
    participants: 5, 
    notes: "Focus on school-related stress. Several members expressed concerns about upcoming exams.",
    summary: null as SummarizeSessionOutput | null
  },
]

export default function SessionsPage() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)
  const [summarizingId, setSummarizingId] = useState<string | null>(null)

  const handleSummarize = async (id: string, notes: string) => {
    setSummarizingId(id)
    try {
      const result = await summarizeSession({ sessionDetails: notes })
      setSessions(prev => prev.map(s => s.id === id ? { ...s, summary: result } : s))
    } catch (error) {
      console.error("AI summarization failed", error)
    } finally {
      setSummarizingId(null)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">Sessions</h2>
          </div>
          <Button size="sm" className="rounded-full">
            <Plus className="h-4 w-4 mr-2" /> New Session Entry
          </Button>
        </header>

        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search sessions, topics, or participants..." className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent" />
              </div>
            </div>

            <div className="grid gap-6">
              {sessions.map((session) => (
                <Card key={session.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 border-none">{session.date}</Badge>
                        </div>
                        <CardDescription>{session.participants} participants attended</CardDescription>
                      </div>
                      {!session.summary ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full border-accent/30 hover:bg-accent/5 text-accent-foreground"
                          onClick={() => handleSummarize(session.id, session.notes)}
                          disabled={summarizingId === session.id}
                        >
                          {summarizingId === session.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          AI Summarize
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100">
                          <BrainCircuit className="h-3 w-3 mr-1" /> AI Summary Generated
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Clinical Notes</h4>
                        <p className="text-sm leading-relaxed text-slate-700 italic border-l-2 border-slate-200 pl-4 py-1 bg-slate-50/50 rounded-r-md">
                          "{session.notes}"
                        </p>
                      </div>
                      
                      {session.summary && (
                        <div className="space-y-4 bg-accent/5 p-4 rounded-2xl border border-accent/10">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-accent-foreground">AI Key Discussion Points</h4>
                            <p className="text-sm leading-relaxed text-slate-800">{session.summary.summary}</p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-accent-foreground">Action Items</h4>
                            <p className="text-sm leading-relaxed text-slate-800">{session.summary.actionItems}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}
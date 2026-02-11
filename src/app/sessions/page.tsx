
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BrainCircuit, Sparkles, Loader2, Heart, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"

export default function ReflectionsPage() {
  const [note, setNote] = useState("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)
  const { toast } = useToast()

  const handleGetInsight = async () => {
    if (!note.trim()) {
      toast({ title: "Note is empty", description: "Please write a reflection first.", variant: "destructive" })
      return
    }
    setIsSummarizing(true)
    try {
      const result = await summarizeSession({ sessionDetails: note })
      setAiInsight(result)
    } catch (error) {
      console.error("AI Insight failed", error)
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">My Reflections</h2>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Heart className="h-5 w-5" />
                    Today's Reflection
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                    <Calendar className="h-3 w-3 mr-1" /> {new Date().toLocaleDateString()}
                  </Badge>
                </div>
                <CardDescription>How are you feeling today? What did you discover in your session?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Type your thoughts here..." 
                  className="min-h-[200px] text-base border-slate-200 focus-visible:ring-primary rounded-2xl p-4"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    className="rounded-full flex-1 h-12 shadow-lg shadow-primary/20"
                    onClick={handleGetInsight}
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate AI Insight
                  </Button>
                  <Button variant="outline" className="rounded-full h-12 px-6">Save Log</Button>
                </div>
              </CardContent>
            </Card>

            {aiInsight && (
              <Card className="border-none bg-accent/10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-accent-foreground">
                    <BrainCircuit className="h-4 w-4" />
                    AI Growth Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Key Patterns</h4>
                    <p className="text-sm leading-relaxed">{aiInsight.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Focus Items</h4>
                    <p className="text-sm leading-relaxed">{aiInsight.actionItems}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

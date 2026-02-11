
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { BrainCircuit, Sparkles, Loader2, Heart, Calendar, ClipboardList, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"

export default function SessionLogsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Group",
    topic: "",
    participationScore: [5],
    moodScore: [5],
    notes: "",
    homeworkAssigned: ""
  })

  const handleGetInsight = async () => {
    if (!formData.notes.trim()) {
      toast({ title: "Notes are empty", description: "Please write some session notes first.", variant: "destructive" })
      return
    }
    setIsSummarizing(true)
    try {
      const promptContent = `
        Session Date: ${formData.date}
        Type: ${formData.type}
        Topic: ${formData.topic}
        Participation: ${formData.participationScore[0]}/10
        Mood: ${formData.moodScore[0]}/10
        Notes: ${formData.notes}
        Homework: ${formData.homeworkAssigned}
      `
      const result = await summarizeSession({ sessionDetails: promptContent })
      setAiInsight(result)
      toast({ title: "Insight Generated", description: "AI analysis complete." })
    } catch (error) {
      console.error("AI Insight failed", error)
      toast({ title: "AI Error", description: "Failed to process insight.", variant: "destructive" })
    } finally {
      setIsSummarizing(true)
      // Small timeout to simulate thought and ensure state updates correctly
      setTimeout(() => setIsSummarizing(false), 500)
    }
  }

  const handleSaveLog = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await addDoc(collection(db, "profiles", user.uid, "sessions"), {
        ...formData,
        participationScore: formData.participationScore[0],
        moodScore: formData.moodScore[0],
        aiInsight: aiInsight?.summary || "",
        createdAt: new Date().toISOString()
      })
      toast({ title: "Session Saved", description: "Your log has been stored securely." })
      // Reset form or redirect
    } catch (error) {
      console.error("Save failed", error)
      toast({ title: "Error", description: "Could not save your session log.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">SO Program Log</h2>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <ClipboardList className="h-5 w-5" />
                    New Session Entry
                  </div>
                  <Badge variant="outline" className="rounded-full bg-white font-bold text-xs px-3 py-1">
                    {formData.type} Session
                  </Badge>
                </div>
                <CardDescription>Document your progress and insights for today's session.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="pl-10 h-12 rounded-xl border-slate-200" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Group">Group Session</SelectItem>
                        <SelectItem value="Individual">Individual Session</SelectItem>
                        <SelectItem value="Psychoeducation">Psychoeducation</SelectItem>
                        <SelectItem value="Family">Family Support</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Topic/Focus</Label>
                  <Input 
                    placeholder="e.g. Relapse Prevention, Cognitive Distortions..." 
                    className="h-12 rounded-xl border-slate-200"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  />
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Participation Level</Label>
                      <span className="text-sm font-bold text-primary">{formData.participationScore[0]}/10</span>
                    </div>
                    <Slider 
                      value={formData.participationScore} 
                      onValueChange={(v) => setFormData({...formData, participationScore: v})} 
                      max={10} 
                      step={1} 
                      className="py-4"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall Mood</Label>
                      <span className="text-sm font-bold text-accent-foreground">{formData.moodScore[0]}/10</span>
                    </div>
                    <Slider 
                      value={formData.moodScore} 
                      onValueChange={(v) => setFormData({...formData, moodScore: v})} 
                      max={10} 
                      step={1} 
                      className="py-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discussion Notes & Reflections</Label>
                  <Textarea 
                    placeholder="What was discussed? What breakthroughs did you have?" 
                    className="min-h-[150px] text-base border-slate-200 focus-visible:ring-primary rounded-2xl p-4 leading-relaxed"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Homework / Assignments</Label>
                  <Input 
                    placeholder="Next steps or tasks assigned..." 
                    className="h-12 rounded-xl border-slate-200"
                    value={formData.homeworkAssigned}
                    onChange={(e) => setFormData({...formData, homeworkAssigned: e.target.value})}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    className="rounded-full flex-1 h-14 shadow-lg shadow-primary/20 text-md font-bold"
                    onClick={handleGetInsight}
                    disabled={isSummarizing}
                    variant="secondary"
                  >
                    {isSummarizing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-2" />
                    )}
                    Generate AI Insight
                  </Button>
                  <Button 
                    className="rounded-full flex-1 h-14 shadow-lg shadow-primary/20 text-md font-bold"
                    onClick={handleSaveLog}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <ClipboardList className="h-5 w-5 mr-2" />
                    )}
                    Save Session Log
                  </Button>
                </div>
              </CardContent>
            </Card>

            {aiInsight && (
              <Card className="border-none bg-accent/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-accent-foreground">
                    <BrainCircuit className="h-5 w-5" />
                    AI Clinical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Key Growth Patterns</h4>
                    <p className="text-sm leading-relaxed">{aiInsight.summary}</p>
                  </div>
                  {aiInsight.actionItems && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Focus Items for Next Week</h4>
                      <div className="text-sm leading-relaxed bg-white/50 p-4 rounded-2xl border border-accent/20">
                        {aiInsight.actionItems}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

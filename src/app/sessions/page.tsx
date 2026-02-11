
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
import { BrainCircuit, Sparkles, Loader2, Heart, Calendar, ClipboardList, UserCircle, BookOpen, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"

export default function SessionLogsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)

  // Form State based on Spreadsheet Headers
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Group",
    topic: "",
    module: "",
    facilitator: "",
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
        Program: SO Program
        Session Date: ${formData.date}
        Type: ${formData.type}
        Module: ${formData.module}
        Facilitator: ${formData.facilitator}
        Topic: ${formData.topic}
        Participation: ${formData.participationScore[0]}/10
        Mood: ${formData.moodScore[0]}/10
        Notes: ${formData.notes}
        Homework: ${formData.homeworkAssigned}
      `
      const result = await summarizeSession({ sessionDetails: promptContent })
      setAiInsight(result)
      toast({ title: "Clinical Insight Generated", description: "Your reflection has been analyzed." })
    } catch (error) {
      console.error("AI Insight failed", error)
      toast({ title: "AI Error", description: "Failed to process insight.", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveLog = async () => {
    if (!user) {
      toast({ title: "Not Signed In", description: "Please sign in to save your logs.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      await addDoc(collection(db, "profiles", user.uid, "sessions"), {
        ...formData,
        participationScore: formData.participationScore[0],
        moodScore: formData.moodScore[0],
        aiInsight: aiInsight?.summary || "",
        createdAt: new Date().toISOString()
      })
      toast({ title: "Log Saved", description: "Your SO Program entry is now secure." })
      setFormData({
        ...formData,
        topic: "",
        notes: "",
        homeworkAssigned: ""
      })
      setAiInsight(null)
    } catch (error) {
      console.error("Save failed", error)
      toast({ title: "Error", description: "Could not save your session log.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-bold tracking-tight">SO Program Tracker</h2>
          </div>
          <Badge variant="secondary" className="hidden sm:flex bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Official Log
          </Badge>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-24">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                      Session Clinical Entry
                    </CardTitle>
                    <CardDescription className="text-slate-400">Record your participation and therapeutic insights.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-10">
                {/* Section: Session Metadata */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-4">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    General Info
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date of Session</Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          type="date" 
                          className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium" 
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Session Type</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Group">Group Session</SelectItem>
                          <SelectItem value="Individual">Individual Session</SelectItem>
                          <SelectItem value="Psychoeducation">Psychoeducation</SelectItem>
                          <SelectItem value="Family">Family Support</SelectItem>
                          <SelectItem value="Task Review">Task Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Program Module / Stage</Label>
                      <div className="relative">
                        <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="e.g. Module 1: Disclosure" 
                          className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                          value={formData.module}
                          onChange={(e) => setFormData({...formData, module: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Facilitator / Counselor</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Name of clinician" 
                          className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                          value={formData.facilitator}
                          onChange={(e) => setFormData({...formData, facilitator: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Primary Topic / Session Focus</Label>
                    <Input 
                      placeholder="What was the main discussion point?" 
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Section: Engagement Scoring */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-4">
                    <div className="h-8 w-1 bg-accent rounded-full" />
                    Self-Assessment
                  </div>
                  <div className="grid gap-12 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Participation (1-10)</Label>
                        <span className="text-lg font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">{formData.participationScore[0]}</span>
                      </div>
                      <Slider 
                        value={formData.participationScore} 
                        onValueChange={(v) => setFormData({...formData, participationScore: v})} 
                        max={10} 
                        step={1} 
                        className="py-4"
                      />
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Overall Mood / Attitude (1-10)</Label>
                        <span className="text-lg font-black text-accent-foreground bg-accent/5 px-3 py-1 rounded-lg">{formData.moodScore[0]}</span>
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
                </div>

                <Separator className="bg-slate-100" />

                {/* Section: Reflections */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-4">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                    Clinical Reflections
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Detailed Session Notes</Label>
                    <Textarea 
                      placeholder="Write your clinical notes here... What was shared? What insights were gained?" 
                      className="min-h-[220px] text-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-primary rounded-3xl p-6 leading-relaxed shadow-inner"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Homework / Action Items Assigned</Label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input 
                        placeholder="Tasks for next week..." 
                        className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                        value={formData.homeworkAssigned}
                        onChange={(e) => setFormData({...formData, homeworkAssigned: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <Button 
                    className="rounded-2xl flex-1 h-16 shadow-lg hover:shadow-xl transition-all text-md font-bold bg-slate-100 text-slate-900 hover:bg-slate-200"
                    onClick={handleGetInsight}
                    disabled={isSummarizing}
                    variant="ghost"
                  >
                    {isSummarizing ? (
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-6 w-6 mr-3 text-amber-500" />
                    )}
                    Run AI Review
                  </Button>
                  <Button 
                    className="rounded-2xl flex-1 h-16 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-md font-bold"
                    onClick={handleSaveLog}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    ) : (
                      <ClipboardList className="h-6 w-6 mr-3" />
                    )}
                    Complete Entry
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Insight Card */}
            {aiInsight && (
              <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8">
                <CardHeader className="pb-4 border-b border-white/10 p-8">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <BrainCircuit className="h-7 w-7" />
                    Clinical Analysis & Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Summary</h4>
                    <p className="text-lg font-medium leading-relaxed">{aiInsight.summary}</p>
                  </div>
                  {aiInsight.actionItems && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Strategic Focus Areas</h4>
                      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 text-md backdrop-blur-sm">
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

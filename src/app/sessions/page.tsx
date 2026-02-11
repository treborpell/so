
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
import { BrainCircuit, Sparkles, Loader2, Calendar, ClipboardList, UserCircle, BookOpen, Table as TableIcon, PlusCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection, query, orderBy, limit } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection } from "@/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SessionLogsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)

  // Fetch recent logs for the Spreadsheet View
  const sessionsQuery = user ? query(collection(db, "profiles", user.uid, "sessions"), orderBy("date", "desc"), limit(20)) : null;
  const { data: recentSessions, loading: loadingSessions } = useCollection(sessionsQuery);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Group",
    topic: "",
    module: "",
    facilitator: "",
    goal: "",
    participationScore: [5],
    moodScore: [5],
    notes: "",
    homeworkAssigned: "",
    homeworkStatus: "Not Started"
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
        Date: ${formData.date}
        Module: ${formData.module}
        Topic: ${formData.topic}
        Goal: ${formData.goal}
        Notes: ${formData.notes}
      `
      const result = await summarizeSession({ sessionDetails: promptContent })
      setAiInsight(result)
      toast({ title: "Analysis Ready", description: "AI review completed." })
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to process insight.", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveLog = async () => {
    if (!user) {
      toast({ title: "Not Signed In", variant: "destructive" })
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
      toast({ title: "Entry Saved", description: "Successfully added to your clinical record." })
      setFormData({
        ...formData,
        topic: "",
        goal: "",
        notes: "",
        homeworkAssigned: ""
      })
      setAiInsight(null)
      setActiveTab("history")
    } catch (error) {
      toast({ title: "Error", description: "Could not save log.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-bold tracking-tight">SO Program Log</h2>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:flex">
            <TabsList className="bg-slate-100 rounded-full h-10 p-1">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-6">
                <PlusCircle className="h-4 w-4 mr-2" /> New Entry
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-bold px-6">
                <TableIcon className="h-4 w-4 mr-2" /> Spreadsheet View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsContent value="new-entry" className="mt-0">
              <div className="max-w-4xl mx-auto space-y-8 pb-24">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-950 text-white p-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-3xl font-black flex items-center gap-3">
                          <BookOpen className="h-8 w-8 text-primary" />
                          Program Entry
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">Capture your clinical progress and insights.</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px] px-3 py-1 font-black">
                        SECURE LOG
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-10 space-y-12">
                    {/* General Metadata */}
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input 
                            type="date" 
                            className="pl-14 h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 focus:bg-white text-md font-bold shadow-inner"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Log Type</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                          <SelectTrigger className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 focus:bg-white text-md font-bold shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Group">Group Therapy</SelectItem>
                            <SelectItem value="Individual">Individual Session</SelectItem>
                            <SelectItem value="Psychoeducation">Psychoeducation</SelectItem>
                            <SelectItem value="Task Review">Task Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Module / Stage</Label>
                        <Input 
                          placeholder="e.g. Stage 1: Assessment" 
                          className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 text-md font-bold shadow-inner"
                          value={formData.module}
                          onChange={(e) => setFormData({...formData, module: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinician / Facilitator</Label>
                        <Input 
                          placeholder="Lead Facilitator Name" 
                          className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 text-md font-bold shadow-inner"
                          value={formData.facilitator}
                          onChange={(e) => setFormData({...formData, facilitator: e.target.value})}
                        />
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Topic & Core Goal</Label>
                        <Input 
                          placeholder="What was the primary focus today?" 
                          className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 text-md font-bold shadow-inner"
                          value={formData.topic}
                          onChange={(e) => setFormData({...formData, topic: e.target.value})}
                        />
                        <Input 
                          placeholder="What is your specific behavioral goal?" 
                          className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 text-md font-bold shadow-inner mt-4"
                          value={formData.goal}
                          onChange={(e) => setFormData({...formData, goal: e.target.value})}
                        />
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Scores */}
                    <div className="grid gap-16 md:grid-cols-2">
                       <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Engagement (1-10)</Label>
                          <span className="text-2xl font-black text-primary">{formData.participationScore[0]}</span>
                        </div>
                        <Slider value={formData.participationScore} onValueChange={(v) => setFormData({...formData, participationScore: v})} max={10} step={1} className="py-4" />
                      </div>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mood / Attitude (1-10)</Label>
                          <span className="text-2xl font-black text-accent-foreground">{formData.moodScore[0]}</span>
                        </div>
                        <Slider value={formData.moodScore} onValueChange={(v) => setFormData({...formData, moodScore: v})} max={10} step={1} className="py-4" />
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Clinical Notes */}
                    <div className="space-y-6">
                       <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Observations & Reflections</Label>
                       <Textarea 
                        placeholder="Detail your clinical insights, challenges, and breakthroughs here..." 
                        className="min-h-[250px] text-lg rounded-[2rem] border-slate-100 bg-slate-50 p-8 leading-relaxed font-medium shadow-inner resize-none focus:bg-white transition-all"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                       <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Homework Assigned</Label>
                        <Input 
                          placeholder="Next action items..." 
                          className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 text-md font-bold shadow-inner"
                          value={formData.homeworkAssigned}
                          onChange={(e) => setFormData({...formData, homeworkAssigned: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Homework Status</Label>
                        <Select value={formData.homeworkStatus} onValueChange={(v) => setFormData({...formData, homeworkStatus: v})}>
                          <SelectTrigger className="h-16 rounded-[1.25rem] border-slate-100 bg-slate-50 focus:bg-white text-md font-bold shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N/A">N/A</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-10">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-20 rounded-[1.5rem] text-lg font-black bg-slate-100 hover:bg-slate-200"
                        onClick={handleGetInsight}
                        disabled={isSummarizing}
                      >
                        {isSummarizing ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Sparkles className="h-6 w-6 mr-3 text-amber-500" />}
                        AI Clinical Review
                      </Button>
                      <Button 
                        className="flex-1 h-20 rounded-[1.5rem] text-lg font-black shadow-xl shadow-primary/20"
                        onClick={handleSaveLog}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CheckCircle className="h-6 w-6 mr-3" />}
                        Finalize & Save Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {aiInsight && (
                  <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2.5rem] animate-in slide-in-from-bottom-10 duration-500">
                    <CardHeader className="p-10 border-b border-white/10">
                      <CardTitle className="text-2xl font-black flex items-center gap-4">
                        <BrainCircuit className="h-8 w-8" />
                        Patterns & Strategic Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Synthesis</h4>
                        <p className="text-xl font-bold leading-relaxed">{aiInsight.summary}</p>
                      </div>
                      <div className="bg-white/10 p-8 rounded-[1.5rem] border border-white/20">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Focus Areas</h4>
                        <div className="text-md leading-relaxed font-medium">{aiInsight.actionItems}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
               <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">Log History</CardTitle>
                      <CardDescription>Spreadsheet view of your recent clinical entries.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setActiveTab("new-entry")}>
                      <PlusCircle className="h-4 w-4 mr-2" /> New Entry
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-500">Date</TableHead>
                          <TableHead className="font-bold text-slate-500">Module</TableHead>
                          <TableHead className="font-bold text-slate-500">Topic</TableHead>
                          <TableHead className="font-bold text-slate-500">Goal</TableHead>
                          <TableHead className="font-bold text-slate-500 text-center">Part.</TableHead>
                          <TableHead className="font-bold text-slate-500 text-center">Mood</TableHead>
                          <TableHead className="font-bold text-slate-500">Facilitator</TableHead>
                          <TableHead className="font-bold text-slate-500">HW Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSessions?.map((session: any) => (
                          <TableRow key={session.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium text-sm">{session.date}</TableCell>
                            <TableCell className="text-xs">{session.module}</TableCell>
                            <TableCell className="text-sm font-bold">{session.topic}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{session.goal}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{session.participationScore}/10</TableCell>
                            <TableCell className="text-center font-bold text-accent-foreground">{session.moodScore}/10</TableCell>
                            <TableCell className="text-xs">{session.facilitator}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tighter">
                                {session.homeworkStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!recentSessions || recentSessions.length === 0) && !loadingSessions && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-20 text-muted-foreground italic">
                              No entries found in history. Start by logging a new session.
                            </TableCell>
                          </TableRow>
                        )}
                        {loadingSessions && (
                           <TableRow>
                            <TableCell colSpan={8} className="text-center py-20 text-muted-foreground italic">
                              Loading log history...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </div>
  )
}

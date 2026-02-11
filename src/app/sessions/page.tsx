
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BrainCircuit, Sparkles, Loader2, ClipboardList, Table as TableIcon, PlusCircle, CheckCircle, Wallet, Presentation, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection, query, orderBy, limit } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useMemoFirebase } from "@/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function SOProgramLogPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)

  // Fetch entries from the user-specific path with memoization
  // We sort by date descending. Note: if dates are not standardized, sorting will fail.
  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "so_entries"), 
      orderBy("date", "desc"),
      limit(200)
    );
  }, [db, user]);
  
  const { data: recentEntries, loading: loadingEntries } = useCollection(entriesQuery);

  const [formData, setFormData] = useState({
    week: "",
    sessionNumber: "",
    date: new Date().toISOString().split('T')[0],
    cost: "68.25",
    paid: false,
    checkNumber: "",
    ableToPresent: false,
    presentationTopic: "",
    notes: ""
  })

  const handleGetInsight = async () => {
    if (!formData.notes.trim()) {
      toast({ title: "Notes are empty", description: "Please write some session notes first.", variant: "destructive" })
      return
    }
    setIsSummarizing(true)
    try {
      const promptContent = `
        SO Program Entry:
        Week: ${formData.week}
        Session #: ${formData.sessionNumber}
        Topic: ${formData.presentationTopic}
        Notes: ${formData.notes}
        Presented: ${formData.ableToPresent ? "Yes" : "No"}
      `
      const result = await summarizeSession({ sessionDetails: promptContent })
      setAiInsight(result)
      toast({ title: "Analysis Ready", description: "Growth insight generated." })
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to process insight.", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveLog = async () => {
    if (!user || !db) {
      toast({ title: "Not Signed In", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      await addDoc(collection(db, "users", user.uid, "so_entries"), {
        ...formData,
        week: Number(formData.week),
        cost: Number(formData.cost),
        createdAt: new Date().toISOString(),
        aiInsight: aiInsight?.summary || ""
      })
      toast({ title: "Entry Saved", description: "Your SO Program log has been updated." })
      setFormData({
        ...formData,
        week: (Number(formData.week) + 1).toString(),
        sessionNumber: "",
        presentationTopic: "",
        notes: "",
        checkNumber: ""
      })
      setAiInsight(null)
      setActiveTab("history")
    } catch (error) {
      toast({ title: "Error", description: "Could not save entry.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Check if any dates look like they are in non-universal format
  const hasLegacyDates = recentEntries?.some(entry => entry.date && !entry.date.includes('-'));

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-bold tracking-tight">SO Program Ledger</h2>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:flex">
            <TabsList className="bg-slate-100 rounded-full h-10 p-1">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-6">
                <PlusCircle className="h-4 w-4 mr-2" /> New Entry
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-bold px-6">
                <TableIcon className="h-4 w-4 mr-2" /> History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsContent value="new-entry" className="mt-0">
              <div className="max-w-4xl mx-auto space-y-8 pb-24">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-primary text-primary-foreground p-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-3xl font-black flex items-center gap-3">
                          <ClipboardList className="h-8 w-8" />
                          Log Entry
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/70 font-medium">SO Program Session & Financial Tracker</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-10 space-y-10">
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WK</Label>
                        <Input 
                          type="number" 
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-lg"
                          value={formData.week}
                          onChange={(e) => setFormData({...formData, week: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">#</Label>
                        <Input 
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-lg"
                          value={formData.sessionNumber}
                          onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DATE</Label>
                        <Input 
                          type="date" 
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">Financials</h3>
                      </div>
                      <div className="grid gap-6 md:grid-cols-3 items-end">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost</Label>
                          <Input 
                            className="h-14 rounded-2xl border-slate-100 bg-white font-bold"
                            value={formData.cost}
                            onChange={(e) => setFormData({...formData, cost: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check #</Label>
                           <Input 
                            className="h-14 rounded-2xl border-slate-100 bg-white font-bold"
                            value={formData.checkNumber}
                            onChange={(e) => setFormData({...formData, checkNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-between h-14 bg-white rounded-2xl border border-slate-100 px-6">
                          <Label className="text-xs font-bold text-slate-600">Paid?</Label>
                          <Switch checked={formData.paid} onCheckedChange={(v) => setFormData({...formData, paid: v})} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Presentation className="h-4 w-4 text-accent-foreground" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">Presentation</h3>
                      </div>
                      <div className="grid gap-6 md:grid-cols-4 items-center">
                        <div className="flex items-center justify-between h-14 bg-slate-50 rounded-2xl border border-slate-100 px-6 md:col-span-1">
                          <Label className="text-xs font-bold text-slate-600">Able to Present?</Label>
                          <Switch checked={formData.ableToPresent} onCheckedChange={(v) => setFormData({...formData, ableToPresent: v})} />
                        </div>
                        <div className="md:col-span-3">
                          <Input 
                            placeholder="Presentation Topic" 
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                            value={formData.presentationTopic}
                            onChange={(e) => setFormData({...formData, presentationTopic: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes / Reflections</Label>
                      <Textarea 
                        placeholder="Clinical summary or personal breakthrough..." 
                        className="min-h-[200px] rounded-3xl border-slate-100 bg-slate-50 p-6 font-medium shadow-inner focus:bg-white transition-all text-lg"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-16 rounded-2xl text-lg font-black border-2 border-primary/20 hover:bg-primary/5"
                        onClick={handleGetInsight}
                        disabled={isSummarizing}
                      >
                        {isSummarizing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Sparkles className="h-5 w-5 mr-3 text-amber-500" />}
                        AI Review
                      </Button>
                      <Button 
                        className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl"
                        onClick={handleSaveLog}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle className="h-5 w-5 mr-3" />}
                        Save Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
               {hasLegacyDates && (
                 <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <AlertCircle className="h-5 w-5 text-amber-500" />
                     <div>
                       <p className="text-sm font-bold text-amber-900">Sorting Issue Detected</p>
                       <p className="text-xs text-amber-700">Some entries are using legacy date formats which prevent chronological sorting.</p>
                     </div>
                   </div>
                   <Button asChild variant="outline" size="sm" className="rounded-full bg-white border-amber-200 hover:bg-amber-100">
                     <Link href="/import">Fix Dates Now</Link>
                   </Button>
                 </div>
               )}

               <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b">
                  <CardTitle className="text-2xl font-bold">Session History</CardTitle>
                  <CardDescription>View your SO Program ledger in descending order (newest first).</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold text-[10px] uppercase">WK</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">#</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">DATE</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">Cost</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">Presented</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">Topic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentEntries?.map((entry: any) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-black text-primary">{entry.week}</TableCell>
                            <TableCell className="font-bold">{entry.sessionNumber}</TableCell>
                            <TableCell className="text-xs font-mono">{entry.date}</TableCell>
                            <TableCell className="font-mono text-xs">${entry.cost?.toFixed(2)}</TableCell>
                            <TableCell>
                              {entry.paid ? (
                                <Badge className="bg-emerald-500 rounded-full h-5 text-[9px]">PAID</Badge>
                              ) : (
                                <Badge variant="destructive" className="rounded-full h-5 text-[9px]">DUE</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                               {entry.ableToPresent ? (
                                <span className="text-emerald-500 font-bold text-[10px]">YES</span>
                              ) : (
                                <span className="text-slate-300 font-bold text-[10px]">NO</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-bold truncate max-w-[200px]">
                              {entry.presentationTopic}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!recentEntries || recentEntries.length === 0) && !loadingEntries && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">
                              Your ledger is currently empty.
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

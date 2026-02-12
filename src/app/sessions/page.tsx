
"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Loader2, ClipboardList, PlusCircle, CheckCircle2, Wallet, Presentation, History, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { summarizeSession } from "@/ai/flows/summarize-session"
import { useToast } from "@/hooks/use-toast"
import { addDoc, collection, query, orderBy, limit, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useMemoFirebase } from "@/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/firebase/provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2 } from 'lucide-react';

interface SessionEntry {
  id?: string;
  week: string;
  sessionNumber: string;
  date: string;
  cost: string;
  paidAmount: string;
  checkNumber: string;
  ableToPresent: boolean;
  presentationTopic: string;
  notes: string;
  aiInsight?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SOProgramLogPage() {
  const { user, db, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Automation State
  const [formData, setFormData] = useState<SessionEntry>({
    week: "",
    sessionNumber: "",
    date: new Date().toISOString().split('T')[0],
    cost: "68.25",
    paidAmount: "0",
    checkNumber: "",
    ableToPresent: false,
    presentationTopic: "",
    notes: ""
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`/sessions?${params.toString()}`)
  }

  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "so_entries"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: recentEntries, isLoading: loadingEntries } = useCollection(entriesQuery);

  // AUTOMATION LOGIC: Pre-fill form based on history and settings
  useEffect(() => {
    async function automateForm() {
      if (!user || !db || !recentEntries || recentEntries.length === 0 || editingId) return; // Don't automate if editing

      // 1. Fetch user preferences
      const prefRef = doc(db, "users", user.uid, "config", "preferences");
      const prefSnap = await getDoc(prefRef);
      const prefs = prefSnap.exists() ? prefSnap.data() : { defaultCost: "68.25", preferredDay: "2" };

      // 2. Get latest entry info
      const latest = recentEntries[0];
      
      if (latest && latest.date) { // Ensure latest and its date property exist
        const lastDate = new Date(latest.date);
        if (isNaN(lastDate.getTime())) { // Check if the date is valid
          console.error("Invalid date from latest entry:", latest.date);
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
          }));
          return; 
        }

        const nextWeek = (Number(latest.week) + 1).toString();
        const nextSession = (Number(latest.sessionNumber) + 1).toString();
        
        // Calculate next date (target day of the week)
        const targetDay = Number(prefs.preferredDay); // 0-6
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 7); // Increment by exactly one week
        
        // Ensure it aligns with the target day if somehow drifted
        const dayDiff = targetDay - nextDate.getDay();
        nextDate.setDate(nextDate.getDate() + dayDiff);

        setFormData(prev => ({
          ...prev,
          week: nextWeek,
          sessionNumber: nextSession,
          cost: prefs.defaultCost,
          date: nextDate.toISOString().split('T')[0]
        }));
      } else if (!latest && recentEntries.length === 0) {
        // Fallback for first entry if no history
        setFormData(prev => ({ ...prev, cost: prefs.defaultCost, date: new Date().toISOString().split('T')[0] }));
      }
    }

    if (activeTab === "new-entry" && !loadingEntries) {
      automateForm();
    }
  }, [user, db, recentEntries, activeTab, loadingEntries, editingId]);

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  const totals = recentEntries?.reduce((acc, log) => ({
    cost: acc.cost + (Number(log.cost) || 0),
    paid: acc.paid + (Number(log.paidAmount) || 0)
  }), { cost: 0, paid: 0 }) || { cost: 0, paid: 0 };

  const balance = totals.paid - totals.cost;

  const resetForm = () => {
    setFormData({
      week: "",
      sessionNumber: "",
      date: new Date().toISOString().split('T')[0],
      cost: "68.25",
      paidAmount: "0",
      checkNumber: "",
      ableToPresent: false,
      presentationTopic: "",
      notes: ""
    });
    setAiInsight(null);
    setEditingId(null);
  };

  const handleEdit = (entry: SessionEntry) => {
    setFormData({
      ...entry,
      cost: entry.cost.toString(), // Ensure cost is string for input
      paidAmount: entry.paidAmount.toString(), // Ensure paidAmount is string
    });
    setAiInsight({ summary: entry.aiInsight || "" }); // Pre-fill AI insight if exists
    setEditingId(entry.id || null);
    handleTabChange("new-entry");
  };

  const handleDeleteEntry = async (id: string, entryDate: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "so_entries", id));
      toast({ title: "Entry Deleted", description: `Session on ${entryDate} removed.` });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleGetInsight = async () => {
    if (!formData.notes.trim()) {
      toast({ title: "Notes are empty", variant: "destructive" })
      return
    }
    setIsSummarizing(true)
    try {
      const result = await summarizeSession({ sessionDetails: formData.notes })
      setAiInsight(result)
      toast({ title: "Analysis Ready" })
    } catch (error) {
      toast({ title: "AI Error", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveLog = async () => {
    if (!user || !db) return;
    setIsSaving(true)
    try {
      const logDataToSave = {
        week: Number(formData.week),
        sessionNumber: Number(formData.sessionNumber),
        date: formData.date,
        cost: Number(formData.cost),
        paidAmount: Number(formData.paidAmount),
        checkNumber: formData.checkNumber,
        ableToPresent: formData.ableToPresent,
        presentationTopic: formData.presentationTopic,
        notes: formData.notes,
        aiInsight: aiInsight?.summary || "",
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "so_entries", editingId), logDataToSave);
        toast({ title: "Entry Updated", description: "Session log record updated." });
      } else {
        await addDoc(collection(db, "users", user.uid, "so_entries"), {
          ...logDataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Entry Saved", description: "New session log entry saved." });
      }
      
      resetForm();
      handleTabChange("history")
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">SO Program Ledger</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-[1200px] mx-auto">
          <div className="mb-6 flex justify-center sm:justify-start">
            <TabsList className="bg-slate-100 rounded-full h-12 p-1 w-full sm:w-auto">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                {editingId ? <Edit2 className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} 
                {editingId ? 'Edit Entry' : 'New Entry'}
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                <History className="h-4 w-4 mr-2" /> Program History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-entry" className="mt-0 space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <CardTitle className="text-3xl font-black flex items-center gap-3"><ClipboardList className="h-8 w-8" /> {editingId ? 'Edit Session Log' : 'New Session Log'}</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Week</Label>
                    <Input type="number" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.week} onChange={(e) => setFormData({...formData, week: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Session #</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.sessionNumber} onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Date</Label>
                    <Input type="date" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                </div>
                <Separator />
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-600">Financial Tracking</h3></div>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Session Cost</Label>
                      <Input className="h-14 rounded-2xl bg-white font-bold" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Amount Paid</Label>
                      <Input className="h-14 rounded-2xl bg-white font-bold text-emerald-600" value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Check / Ref #</Label>
                      <Input className="h-14 rounded-2xl bg-white font-bold" value={formData.checkNumber} onChange={(e) => setFormData({...formData, checkNumber: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-2"><Presentation className="h-4 w-4 text-accent-foreground" /><h3 className="text-sm font-black uppercase text-slate-600">Clinical Presentation</h3></div>
                  <div className="grid gap-6 md:grid-cols-4 items-center">
                    <div className="flex items-center justify-between h-14 bg-slate-50 rounded-2xl border px-6 md:col-span-1">
                      <Label className="text-xs font-bold">Presented?</Label>
                      <Switch checked={formData.ableToPresent} onCheckedChange={(v) => setFormData({...formData, ableToPresent: v})} />
                    </div>
                    <div className="md:col-span-3">
                      <Input placeholder="What was the topic?" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.presentationTopic} onChange={(e) => setFormData({...formData, presentationTopic: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Clinical Notes</Label>
                  <Textarea placeholder="Describe the session breakthrough or details..." className="min-h-[200px] rounded-3xl bg-slate-50 p-6 text-lg" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-16 rounded-2xl text-lg font-black" onClick={handleGetInsight} disabled={isSummarizing}>
                    {isSummarizing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Sparkles className="h-5 w-5 mr-3 text-amber-500" />} Get AI Insight
                  </Button>
                  {editingId !== null && (
                    <Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl text-lg font-black">Cancel</Button>
                  )}
                  <Button className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl" onClick={handleSaveLog} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />} {(editingId !== null) ? 'Update Log Entry' : 'Save Log Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-none shadow-sm bg-blue-50/50">
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase text-blue-600">Lifetime Program Cost</p>
                  <p className="text-2xl font-black">${totals.cost.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-emerald-50/50">
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase text-emerald-600">Total Amount Paid</p>
                  <p className="text-2xl font-black">${totals.paid.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className={`border-none shadow-sm ${balance < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <CardContent className="p-4">
                  <p className={`text-[10px] font-bold uppercase ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>Current Ledger Balance</p>
                  <p className="text-2xl font-black">{balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `+$${balance.toFixed(2)}`}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase w-16">WK</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase w-16">#</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-right">Cost</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-right">Paid</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-center">Pres.</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Topic / Details</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Notes</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries?.map((entry: SessionEntry) => (
                    <TableRow 
                      key={entry.id} 
                      className="group hover:bg-slate-50/50 cursor-pointer"
                    >
                      <TableCell className="font-black text-primary">WK {entry.week}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-bold">{entry.sessionNumber}</TableCell>
                      <TableCell className="text-xs font-mono font-bold">{entry.date}</TableCell>
                      <TableCell className="font-mono text-xs text-right">${Number(entry.cost).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs text-emerald-600 font-black text-right">${Number(entry.paidAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {entry.ableToPresent ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <Separator className="w-4 h-[1px] mx-auto" />}
                      </TableCell>
                      <TableCell className="text-xs font-bold truncate max-w-[150px]">{entry.presentationTopic}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground truncate max-w-[200px]">{entry.notes}</TableCell>
                      <TableCell className="text-center">
                         <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5">
                               <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                               <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/5">
                                     <Trash2 className="h-4 w-4" />
                                  </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent className="rounded-[2rem]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      Confirm Deletion
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove the session record for Week <span className="font-bold text-slate-900">{entry.week}</span>, Session #<span className="font-bold text-slate-900">{entry.sessionNumber}</span> on <span className="font-bold text-slate-900">{entry.date}</span>. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id!, entry.date)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                      Delete Record
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                               </AlertDialogContent>
                            </AlertDialog>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentEntries || recentEntries.length === 0) && !loadingEntries && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-20 text-muted-foreground italic">
                        No history found. Click "New Entry" or use the Import tool.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

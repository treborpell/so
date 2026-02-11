
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BrainCircuit, Sparkles, Loader2, ClipboardList, Table as TableIcon, PlusCircle, CheckCircle2, Wallet, Presentation, AlertCircle, DollarSign, History } from "lucide-react"
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
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) setActiveTab(tab)
  }, [searchParams])

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
  
  const { data: recentEntries, loading: loadingEntries } = useCollection(entriesQuery);

  const [formData, setFormData] = useState({
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

  const totals = recentEntries?.reduce((acc, log) => ({
    cost: acc.cost + (Number(log.cost) || 0),
    paid: acc.paid + (Number(log.paidAmount) || 0)
  }), { cost: 0, paid: 0 }) || { cost: 0, paid: 0 };

  const balance = totals.paid - totals.cost;

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
      await addDoc(collection(db, "users", user.uid, "so_entries"), {
        ...formData,
        week: Number(formData.week),
        cost: Number(formData.cost),
        paidAmount: Number(formData.paidAmount),
        createdAt: new Date().toISOString(),
        aiInsight: aiInsight?.summary || ""
      })
      toast({ title: "Entry Saved" })
      setFormData({
        ...formData,
        week: (Number(formData.week) + 1).toString(),
        sessionNumber: "",
        paidAmount: "0",
        presentationTopic: "",
        notes: "",
        checkNumber: ""
      })
      setAiInsight(null)
      handleTabChange("history")
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
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
            <h2 className="text-xl font-bold">SO Program Ledger</h2>
          </div>
        </header>

        <main className="p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-center sm:justify-start">
              <TabsList className="bg-slate-100 rounded-full h-12 p-1 w-full sm:w-auto">
                <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                  <PlusCircle className="h-4 w-4 mr-2" /> New Entry
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                  <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new-entry" className="mt-0 space-y-8">
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-primary text-primary-foreground p-10">
                  <CardTitle className="text-3xl font-black flex items-center gap-3"><ClipboardList className="h-8 w-8" /> Log Entry</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">WK</Label>
                      <Input type="number" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.week} onChange={(e) => setFormData({...formData, week: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">#</Label>
                      <Input className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.sessionNumber} onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">DATE</Label>
                      <Input type="date" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>
                  </div>
                  <Separator />
                  <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
                    <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-600">Financials</h3></div>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Cost</Label>
                        <Input className="h-14 rounded-2xl bg-white font-bold" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Paid Amount</Label>
                        <Input className="h-14 rounded-2xl bg-white font-bold text-emerald-600" value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Check #</Label>
                        <Input className="h-14 rounded-2xl bg-white font-bold" value={formData.checkNumber} onChange={(e) => setFormData({...formData, checkNumber: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2"><Presentation className="h-4 w-4 text-accent-foreground" /><h3 className="text-sm font-black uppercase text-slate-600">Presentation</h3></div>
                    <div className="grid gap-6 md:grid-cols-4 items-center">
                      <div className="flex items-center justify-between h-14 bg-slate-50 rounded-2xl border px-6 md:col-span-1">
                        <Label className="text-xs font-bold">Presented?</Label>
                        <Switch checked={formData.ableToPresent} onCheckedChange={(v) => setFormData({...formData, ableToPresent: v})} />
                      </div>
                      <div className="md:col-span-3">
                        <Input placeholder="Presentation Topic" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.presentationTopic} onChange={(e) => setFormData({...formData, presentationTopic: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <Textarea placeholder="Session notes..." className="min-h-[200px] rounded-3xl bg-slate-50 p-6 text-lg" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-16 rounded-2xl text-lg font-black" onClick={handleGetInsight} disabled={isSummarizing}>
                      {isSummarizing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Sparkles className="h-5 w-5 mr-3 text-amber-500" />} AI Review
                    </Button>
                    <Button className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl" onClick={handleSaveLog} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />} Save Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-50/50">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold uppercase text-blue-600">Total Program Cost</p>
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
                    <p className={`text-[10px] font-bold uppercase ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>Current Balance</p>
                    <p className="text-2xl font-black">{balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `+$${balance.toFixed(2)}`}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase">WK</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">DATE</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Cost</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Paid</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Check</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Topic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEntries?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-black text-primary">WK {entry.week}</TableCell>
                        <TableCell className="text-xs font-mono">{entry.date}</TableCell>
                        <TableCell className="font-mono text-xs">${Number(entry.cost).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs text-emerald-600 font-bold">${Number(entry.paidAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{entry.checkNumber || '—'}</TableCell>
                        <TableCell className="text-xs font-bold truncate max-w-[200px]">{entry.presentationTopic}</TableCell>
                      </TableRow>
                    ))}
                    {(!recentEntries || recentEntries.length === 0) && !loadingEntries && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                          No history entries found. Go to "New Entry" to start logging.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </div>
  )
}

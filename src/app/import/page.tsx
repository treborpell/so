
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardPaste, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection, getDocs, updateDoc, doc } from "firebase/firestore"

export default function ImportPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const formatDateForStorage = (dateStr: string) => {
    if (!dateStr || dateStr.toLowerCase() === "na" || dateStr.trim() === "") return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return dateStr;
    let [m, d, y] = parts;
    m = m.padStart(2, '0');
    d = d.padStart(2, '0');
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  const handleMigration = async () => {
    if (!user || !db) return;
    setIsMigrating(true);
    let fixedCount = 0;
    try {
      const colRef = collection(db, "users", user.uid, "so_entries");
      const snapshot = await getDocs(colRef);
      for (const entryDoc of snapshot.docs) {
        const data = entryDoc.data();
        const originalDate = data.date;
        const standardizedDate = formatDateForStorage(originalDate);
        if (originalDate !== standardizedDate) {
          await updateDoc(doc(db, "users", user.uid, "so_entries", entryDoc.id), {
            date: standardizedDate
          });
          fixedCount++;
        }
      }
      toast({ title: "Migration Complete", description: `Successfully standardized ${fixedCount} dates.` });
      router.push("/sessions");
    } catch (error: any) {
      toast({ title: "Migration Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsMigrating(false);
    }
  }

  const parseData = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length < 2) return []
    const firstLine = lines[0]
    const delimiter = firstLine.includes('\t') ? '\t' : ','
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''))
    const result = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''))
      const entry: any = {
        week: 0,
        sessionNumber: "0",
        date: "",
        cost: 0,
        paidAmount: 0,
        checkNumber: "",
        ableToPresent: false,
        presentationTopic: "",
        notes: "",
        aiInsight: "",
        createdAt: new Date().toISOString()
      }
      headers.forEach((header, index) => {
        const val = values[index] || ""
        const h = header.toLowerCase().trim()
        if (h === "wk") entry.week = Number(val) || 0
        else if (h === "#") entry.sessionNumber = val || "0"
        else if (h === "date") entry.date = formatDateForStorage(val)
        else if (h === "cost") entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        else if (h === "paid") entry.paidAmount = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        else if (h === "check #") entry.checkNumber = val
        else if (h === "able to present") entry.ableToPresent = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        else if (h === "presentation topic") entry.presentationTopic = val
        else if (h === "notes") entry.notes = val
      })
      if (entry.week || entry.date) result.push(entry)
    }
    return result
  }

  const handleProcessImport = async () => {
    if (!pasteContent.trim()) {
      toast({ title: "No data", description: "Please paste your rows first.", variant: "destructive" })
      return
    }
    if (!user || !db) {
      toast({ title: "Auth Required", description: "Please sign in first.", variant: "destructive" })
      return
    }
    setIsUploading(true)
    setImportCount(0)
    try {
      const entries = parseData(pasteContent)
      if (entries.length === 0) throw new Error("No valid data found.")
      const colRef = collection(db, "users", user.uid, "so_entries")
      let count = 0
      for (const entry of entries) {
        await addDoc(colRef, entry)
        count++
        setImportCount(count)
      }
      toast({ title: "Import Successful", description: `Processed ${count} entries.` })
      setPasteContent("")
      router.push("/sessions")
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Data Management</h2>
        </header>
        <main className="p-6 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Financial & Date Sync</h1>
              <p className="text-muted-foreground">Import your Excel ledger and ensure your balance tracking is accurate.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" />Format Fixer</CardTitle>
                  <CardDescription>Standardize dates for perfect chronological sorting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={handleMigration} disabled={isMigrating}>
                    {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Fix Existing Dates"}
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-emerald-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Financial Ready</CardTitle>
                  <CardDescription>Imports now track actual dollar amounts paid versus session costs.</CardDescription>
                </CardHeader>
              </Card>
            </div>
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8 space-y-6">
                <Textarea 
                  placeholder="Paste Excel rows here (Include headers: WK, #, DATE, Cost, Paid...)" 
                  className="min-h-[300px] rounded-2xl bg-slate-50 border-slate-100 font-mono text-xs p-6 shadow-inner"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  disabled={isUploading}
                />
                <Button className="w-full h-16 rounded-2xl font-black text-xl" disabled={!pasteContent || isUploading} onClick={handleProcessImport}>
                  {isUploading ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Row {importCount}...</> : "Import Pasted Data"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

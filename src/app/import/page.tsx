
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardPaste, Loader2, AlertCircle, RefreshCw, CheckCircle2, Info, Trash2, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection, getDocs, updateDoc, doc, query, where, limit, deleteDoc, writeBatch } from "firebase/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function ImportPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [importStatus, setImportStatus] = useState({ current: 0, total: 0, mode: "" })

  const formatDateForStorage = (dateStr: string) => {
    if (!dateStr || dateStr.toLowerCase() === "na" || dateStr.trim() === "") return "";
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Attempt to parse M/D/Y or M-D-Y
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return dateStr;
    
    let [m, d, y] = parts;
    m = m.padStart(2, '0');
    d = d.padStart(2, '0');
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  const handleDeleteAll = async () => {
    if (!user || !db) return;
    setIsDeleting(true);
    try {
      const colRef = collection(db, "users", user.uid, "so_entries");
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({ title: "Ledger Cleared", description: "All entries have been erased." });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
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
        if (originalDate && originalDate !== standardizedDate) {
          await updateDoc(doc(db, "users", user.uid, "so_entries", entryDoc.id), {
            date: standardizedDate
          });
          fixedCount++;
        }
      }
      toast({ title: "Migration Complete", description: `Successfully standardized ${fixedCount} dates.` });
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
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''))
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

      headers.forEach((h, index) => {
        const val = values[index] || ""
        
        // Week Detection
        if (h === "wk" || h === "week") entry.week = Number(val) || 0
        
        // Session Number Detection (handles 'x' for excused)
        else if (h === "#" || h === "session" || h === "no" || h === "session #" || h === "session no") {
          entry.sessionNumber = val || "0"
        }
        
        // Date Detection
        else if (h === "date") entry.date = formatDateForStorage(val)
        
        // Cost Detection
        else if (h === "cost" || h === "price" || h === "session cost") {
          entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        }
        
        // Paid Amount Detection
        else if (h === "paid" || h === "amount" || h === "paid amount" || h === "amt paid" || h === "$" || h === "payment") {
          entry.paidAmount = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        }
        
        // Check Number Detection
        else if (h === "check #" || h === "check" || h === "check no") entry.checkNumber = val
        
        // Presentation Status Detection
        else if (h === "presented" || h === "pres" || h === "able to present" || h === "did present" || h === "presentation") {
          const upper = val.toUpperCase();
          entry.ableToPresent = ["YES", "TRUE", "1", "Y", "PRESENT", "T"].includes(upper);
        }
        
        // Topic Detection
        else if (h === "topic" || h === "presentation topic" || h === "subject") entry.presentationTopic = val
        
        // Notes Detection
        else if (h === "notes" || h === "session notes" || h === "clinical notes" || h === "note") entry.notes = val
      })

      // Validation: Must have at least a week or a date to be a valid entry
      if (entry.week || entry.date) result.push(entry)
    }
    return result
  }

  const handleProcessImport = async () => {
    if (!pasteContent.trim() || !user || !db) return;
    setIsUploading(true)
    const entries = parseData(pasteContent)
    
    if (entries.length === 0) {
      toast({ title: "Parse Error", description: "No valid rows found. Check your headers.", variant: "destructive" })
      setIsUploading(false)
      return
    }

    setImportStatus({ current: 0, total: entries.length, mode: "Syncing..." })
    try {
      const colRef = collection(db, "users", user.uid, "so_entries")
      let count = 0
      for (const entry of entries) {
        count++
        setImportStatus(prev => ({ ...prev, current: count }))
        
        // Upsert Logic: Check for existing Week + Date to prevent duplicates
        let existingDocId = null
        if (entry.week && entry.date) {
          const q = query(colRef, where("week", "==", entry.week), where("date", "==", entry.date), limit(1))
          const querySnapshot = await getDocs(q)
          if (!querySnapshot.empty) existingDocId = querySnapshot.docs[0].id
        }
        
        if (existingDocId) {
          // Update existing doc (don't overwrite aiInsight or createdAt)
          const { createdAt, ...updateData } = entry
          await updateDoc(doc(db, "users", user.uid, "so_entries", existingDocId), updateData)
        } else {
          // Create new doc
          await addDoc(colRef, entry)
        }
      }
      toast({ title: "Success", description: `Processed ${entries.length} entries.` })
      setPasteContent("")
      router.push("/sessions?tab=history")
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-xl font-bold">Data Management</h2>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="rounded-xl h-10 px-4 font-bold">
                <Trash2 className="h-4 w-4 mr-2" /> Erase All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem]">
              <AlertDialogHeader>
                <AlertDialogTitle>Wipe everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL entries in your ledger. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                  Yes, Erase Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" /> 
                Sync Your Spreadsheet
              </h1>
              <p className="text-muted-foreground">Paste your Excel or Sheets data below. We'll handle the rest.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" />Format Fixer</CardTitle>
                  <CardDescription>Standardize dates for perfect sorting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={handleMigration} disabled={isMigrating}>
                    {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Fix Existing Dates"}
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Smart Sync</CardTitle>
                  <CardDescription>Pasting data for existing weeks will update the rows instead of duplicating them.</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border-t-8 border-primary">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Excel Data Paste Area</Label>
                  <Textarea 
                    placeholder="Paste rows here (Include headers: WK, DATE, Cost, Paid, Check #, Pres, Topic, Notes...)" 
                    className="min-h-[400px] rounded-2xl bg-slate-50 border-slate-100 font-mono text-xs p-6 shadow-inner focus-visible:ring-primary"
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <Button className="w-full h-16 rounded-2xl font-black text-xl shadow-lg shadow-primary/20" disabled={!pasteContent || isUploading} onClick={handleProcessImport}>
                  {isUploading ? (
                    <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> {importStatus.mode} {importStatus.current}/{importStatus.total}</>
                  ) : (
                    "Sync Pasted Data"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

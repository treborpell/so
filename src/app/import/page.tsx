"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardPaste, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"

export default function ImportPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const formatDateForStorage = (dateStr: string) => {
    if (!dateStr) return "";
    // Handle M/D/YY or MM/DD/YYYY formats
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;

    let [m, d, y] = parts;
    m = m.padStart(2, '0');
    d = d.padStart(2, '0');
    
    // Handle 2-digit years
    if (y.length === 2) {
      y = `20${y}`;
    }
    
    return `${y}-${m}-${d}`; // ISO 8601 format for correct Firestore sorting
  }

  const parseData = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length < 2) return []

    // Detect if tab or comma separated
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
        paid: false,
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
        
        if (h === "wk") {
          entry.week = Number(val) || 0
        } else if (h === "#") {
          entry.sessionNumber = val || "0"
        } else if (h === "date") {
          entry.date = formatDateForStorage(val)
        } else if (h === "cost") {
          entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        } else if (h === "paid") {
          const cleanVal = val.replace(/[^0-9.-]+/g, "")
          const paidAmount = Number(cleanVal) || 0
          entry.paid = paidAmount > 0 || ["YES", "TRUE", "1", "PAID"].includes(val.toUpperCase())
        } else if (h === "check #") {
          entry.checkNumber = val
        } else if (h === "able to present") {
          entry.ableToPresent = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        } else if (h === "presentation topic") {
          entry.presentationTopic = val
        } else if (h === "notes") {
          entry.notes = val
        }
      })
      
      if (entry.week || entry.date) {
        result.push(entry)
      }
    }
    return result
  }

  const handleProcessImport = async () => {
    if (!pasteContent || pasteContent.trim() === "") {
      toast({ title: "No data", description: "Please paste your spreadsheet rows first.", variant: "destructive" })
      return
    }
    
    if (!user) {
      toast({ title: "Wait a moment", description: "Finalizing your secure session...", variant: "destructive" })
      return
    }
    
    setIsUploading(true)
    setImportCount(0)
    
    try {
      const entries = parseData(pasteContent)
      
      if (entries.length === 0) {
        throw new Error("No valid data found. Ensure headers match: WK, #, DATE, Cost, Paid, Notes.")
      }

      const colRef = collection(db, "users", user.uid, "so_entries")
      
      let count = 0
      for (const entry of entries) {
        await addDoc(colRef, entry)
        count++
        setImportCount(count)
      }

      toast({
        title: "Import Successful",
        description: `Processed ${count} session entries. Redirecting...`,
      })
      
      setPasteContent("")
      setTimeout(() => {
        setIsUploading(false)
        router.push("/sessions")
      }, 1000)
      
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Check your formatting and try again.",
        variant: "destructive"
      })
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Import SO Program Ledger</h2>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Sync Ledger</h1>
              <p className="text-muted-foreground">Paste your rows directly from Excel. We'll handle the formatting.</p>
            </div>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold mb-2">
                  <ClipboardPaste className="h-5 w-5" />
                  <h3>Paste Rows (Including Headers)</h3>
                </div>
                <Textarea 
                  placeholder="WK	#	DATE	Cost	Paid... (Copy from Excel and paste here)" 
                  className="min-h-[400px] rounded-2xl bg-slate-50 border-slate-100 font-mono text-xs p-6 shadow-inner focus:bg-white transition-all"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  disabled={isUploading}
                />
                
                {authLoading ? (
                  <Button disabled className="w-full h-16 rounded-2xl font-black text-xl bg-slate-200">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Preparing Secure Storage...
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                    disabled={!pasteContent || isUploading}
                    onClick={handleProcessImport}
                  >
                    {isUploading ? (
                      <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Saving Row {importCount}...</>
                    ) : (
                      "Import Ledger Data"
                    )}
                  </Button>
                )}

                {!user && !authLoading && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-amber-700 text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>Signing you in anonymously to save your data...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

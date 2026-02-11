
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardPaste, Loader2, LogIn, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"
import Link from "next/link"

export default function ImportPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [importCount, setImportCount] = useState(0)

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
        const h = header.toUpperCase().trim()
        
        if (h === "WK") {
          entry.week = Number(val) || 0
        } else if (h === "#") {
          entry.sessionNumber = val || "0"
        } else if (h === "DATE") {
          entry.date = val
        } else if (h === "COST") {
          entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        } else if (h === "PAID") {
          // Check if paid value is a dollar amount > 0 or a string like "yes"
          const cleanVal = val.replace(/[^0-9.-]+/g, "")
          const paidAmount = Number(cleanVal) || 0
          entry.paid = paidAmount > 0 || ["YES", "TRUE", "1", "PAID"].includes(val.toUpperCase())
        } else if (h === "CHECK #") {
          entry.checkNumber = val
        } else if (h === "ABLE TO PRESENT") {
          entry.ableToPresent = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        } else if (h === "PRESENTATION TOPIC") {
          entry.presentationTopic = val
        } else if (h === "NOTES") {
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
      toast({ title: "Authentication required", description: "Please sign in to save your program data.", variant: "destructive" })
      return
    }
    
    setIsUploading(true)
    setImportCount(0)
    
    try {
      const entries = parseData(pasteContent)
      
      if (entries.length === 0) {
        throw new Error("No valid data found. Ensure headers match: WK, #, DATE, Cost, Paid, Notes.")
      }

      toast({
        title: "Starting Import",
        description: `Importing ${entries.length} program entries to your ledger.`,
      })

      const colRef = collection(db, "users", user.uid, "so_entries")
      
      let count = 0
      for (const entry of entries) {
        await addDoc(colRef, entry)
        count++
        setImportCount(count)
        
        // Minor delay to keep UI responsive
        if (count % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      toast({
        title: "Import Successful",
        description: `Processed ${count} session entries.`,
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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
          {!user ? (
            <Card className="border-none shadow-xl rounded-3xl p-12 text-center space-y-6 bg-white">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Authentication Required</h3>
                <p className="text-muted-foreground">You must be signed in to import and save your program data securely.</p>
              </div>
              <Button asChild className="h-14 rounded-2xl px-8 font-black text-lg shadow-lg">
                <Link href="/login">
                  <LogIn className="h-5 w-5 mr-2" /> Go to Login
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Sync Ledger</h1>
                <p className="text-muted-foreground">Copy and paste your spreadsheet rows here. We'll automatically map the columns to your clinical history.</p>
              </div>

              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold mb-2">
                    <ClipboardPaste className="h-5 w-5" />
                    <h3>Paste from Excel / Spreadsheet</h3>
                  </div>
                  <Textarea 
                    placeholder="WK	#	DATE	Cost	Paid... (paste rows including headers)" 
                    className="min-h-[400px] rounded-2xl bg-slate-50 border-slate-100 font-mono text-xs p-6 shadow-inner focus:bg-white transition-all"
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    disabled={isUploading}
                  />
                  <Button 
                    className="w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                    disabled={!pasteContent || isUploading}
                    onClick={handleProcessImport}
                  >
                    {isUploading ? (
                      <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Processing Record {importCount}...</>
                    ) : (
                      "Import Ledger Data"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ClipboardPaste, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function ImportPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [file, setFile] = useState<File | null>(null)
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [importCount, setImportCount] = useState(0)

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
        paid: false,
        checkNumber: "",
        ableToPresent: false,
        presentationTopic: "",
        notes: "",
        receipt: "",
        attachment1: "",
        attachment2: "",
        attachment3: ""
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
        } else if (h === "RECEIPT") {
          entry.receipt = val
        } else if (h === "ATTACHMENT 1") {
          entry.attachment1 = val
        } else if (h === "ATTACHMENT 2") {
          entry.attachment2 = val
        } else if (h === "ATTACHMENT 3") {
          entry.attachment3 = val
        }
      })
      
      if (entry.week || entry.date) {
        result.push(entry)
      }
    }
    return result
  }

  const handleProcessImport = async (textSource: string) => {
    if (!textSource || textSource.trim() === "") {
      toast({ title: "No data", description: "Please paste some data first.", variant: "destructive" })
      return
    }
    
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to save data.", variant: "destructive" })
      return
    }
    
    setIsUploading(true)
    setImportCount(0)
    
    try {
      const entries = parseData(textSource)
      
      if (entries.length === 0) {
        throw new Error("No valid data found. Ensure headers match: WK, #, DATE, Cost, Paid, Notes.")
      }

      toast({
        title: "Starting Import",
        description: `Adding ${entries.length} entries.`,
      })

      const colRef = collection(db, "profiles", user.uid, "so_entries")
      
      let count = 0
      for (const entry of entries) {
        addDoc(colRef, {
          ...entry,
          createdAt: new Date().toISOString(),
          aiInsight: ""
        })
        
        count++
        setImportCount(count)
        
        if (count % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      toast({
        title: "Import Successful",
        description: `Processed ${count} entries.`,
      })
      
      setFile(null)
      setPasteContent("")
      
      setTimeout(() => {
        setIsUploading(false)
        setImportCount(0)
        router.push("/sessions")
      }, 1000)
      
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred.",
        variant: "destructive"
      })
      setIsUploading(false)
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Import Data</h2>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full">
          {!user ? (
            <Card className="border-none shadow-xl rounded-3xl p-12 text-center space-y-6">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Sign In Required</h3>
                <p className="text-muted-foreground">You must be signed in to import and save your spreadsheet data.</p>
              </div>
              <Button asChild className="h-14 rounded-2xl px-8 font-black text-lg">
                <Link href="/login">
                  <LogIn className="h-5 w-5 mr-2" /> Go to Login
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Sync your Spreadsheet</h1>
                <p className="text-muted-foreground">Upload your CSV or paste your Excel rows below. We'll automatically parse your session data.</p>
              </div>

              <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl h-12">
                  <TabsTrigger value="paste" className="rounded-xl font-bold">Paste Text</TabsTrigger>
                  <TabsTrigger value="file" className="rounded-xl font-bold">Upload File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="mt-6">
                  <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold mb-2">
                        <ClipboardPaste className="h-5 w-5" />
                        <h3>Paste from Excel</h3>
                      </div>
                      <Textarea 
                        placeholder="Paste your spreadsheet rows here (including headers)..." 
                        className="min-h-[300px] rounded-2xl bg-slate-50 border-slate-100 font-mono text-xs"
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        disabled={isUploading}
                      />
                      <Button 
                        className="w-full h-14 rounded-2xl font-black text-lg shadow-lg"
                        disabled={!pasteContent || isUploading}
                        onClick={() => handleProcessImport(pasteContent)}
                      >
                        {isUploading ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Record {importCount}...</>
                        ) : (
                          "Import Pasted Data"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="file" className="mt-6">
                  <Card className="border-2 border-dashed border-slate-200 rounded-3xl">
                    <CardContent className="p-12 text-center">
                      {!file ? (
                        <div className="space-y-6">
                          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Upload className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Drop your CSV here</h3>
                            <label className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-6 py-2 text-sm font-bold hover:bg-accent transition-all">
                              Select File
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".csv" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <FileSpreadsheet className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{file.name}</h3>
                            <p className="text-sm text-muted-foreground">Ready to import</p>
                          </div>
                          <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => setFile(null)} disabled={isUploading}>Cancel</Button>
                            <Button 
                              onClick={async () => handleProcessImport(await file.text())} 
                              disabled={isUploading} 
                              className="shadow-lg rounded-xl"
                            >
                              {isUploading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {importCount}...</>
                              ) : (
                                "Start File Import"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  )
}

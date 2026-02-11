
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ClipboardPaste } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ImportPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [file, setFile] = useState<File | null>(null)
  const [pasteContent, setPasteContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const parseData = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length < 2) return []

    // Detect delimiter: tab or comma
    const firstLine = lines[0]
    const delimiter = firstLine.includes('\t') ? '\t' : ','
    
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''))
    const result = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''))
      const entry: any = {}
      
      headers.forEach((header, index) => {
        const val = values[index] || ""
        const h = header.toUpperCase().trim()
        
        if (h === "WK") entry.week = Number(val) || 0
        else if (h === "#") entry.sessionNumber = val || "0"
        else if (h === "DATE") entry.date = val
        else if (h === "COST") entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        else if (h === "PAID") {
           const cleanVal = val.replace(/[^0-9.-]+/g, "")
           const paidAmount = Number(cleanVal) || 0
           entry.paid = paidAmount > 0 || ["YES", "TRUE", "1"].includes(val.toUpperCase())
        }
        else if (h === "CHECK #") entry.checkNumber = val
        else if (h === "ABLE TO PRESENT") entry.ableToPresent = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        else if (h === "PRESENTATION TOPIC") entry.presentationTopic = val
        else if (h === "NOTES") entry.notes = val
        else if (h === "RECEIPT") entry.receipt = val
      })
      
      if (entry.week || entry.date) {
        result.push(entry)
      }
    }
    return result
  }

  const handleProcessImport = async (textSource: string) => {
    if (!textSource || !user) return
    
    setIsUploading(true)
    try {
      const entries = parseData(textSource)
      
      if (entries.length === 0) {
        throw new Error("No valid data found. Ensure headers match: WK, #, DATE, Cost, Paid, etc.")
      }

      let count = 0
      for (const entry of entries) {
        addDoc(collection(db, "profiles", user.uid, "so_entries"), {
          ...entry,
          createdAt: new Date().toISOString(),
          aiInsight: ""
        })
        count++
        setImportCount(count)
      }

      toast({
        title: "Importing...",
        description: `Adding ${count} ledger entries to your record.`,
      })
      setFile(null)
      setPasteContent("")
      setImportCount(0)
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
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
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Sync your Spreadsheet</h1>
              <p className="text-muted-foreground">Upload your CSV or simply paste your Excel rows below. We'll automatically parse your session data.</p>
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
                    />
                    <Button 
                      className="w-full h-14 rounded-2xl font-black text-lg shadow-lg"
                      disabled={!pasteContent || isUploading}
                      onClick={() => handleProcessImport(pasteContent)}
                    >
                      {isUploading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing {importCount}...</>
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
                            Start File Import
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-slate-50 rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Header Match
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    The tool looks for: <code className="bg-slate-200 px-1 rounded">WK</code>, <code className="bg-slate-200 px-1 rounded">#</code>, <code className="bg-slate-200 px-1 rounded">DATE</code>, <code className="bg-slate-200 px-1 rounded">Cost</code>, <code className="bg-slate-200 px-1 rounded">Paid</code>, <code className="bg-slate-200 px-1 rounded">Notes</code>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-slate-50 rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Tip
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Pasting works best if you select all rows in Excel, copy, and paste here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

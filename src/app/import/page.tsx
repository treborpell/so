
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase/provider"
import { useUser } from "@/firebase/auth/use-user"
import { addDoc, collection } from "firebase/firestore"

export default function ImportPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".txt"))) {
      setFile(droppedFile)
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a .csv file.",
        variant: "destructive"
      })
    }
  }

  const parseCSV = (text: string) => {
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
        // Mapping based on headers: WK # DATE Cost Paid Check # Able to Present Presentation Topic Notes Receipt Attachment 1 Attachment 2 Attachment 3
        const h = header.toUpperCase()
        if (h === "WK") entry.week = Number(val) || 0
        else if (h === "#") entry.sessionNumber = Number(val) || 0
        else if (h === "DATE") entry.date = val
        else if (h === "COST") entry.cost = Number(val.replace(/[^0-9.-]+/g, "")) || 0
        else if (h === "PAID") entry.paid = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        else if (h === "CHECK #") entry.checkNumber = val
        else if (h === "ABLE TO PRESENT") entry.ableToPresent = ["YES", "TRUE", "1"].includes(val.toUpperCase())
        else if (h === "PRESENTATION TOPIC") entry.presentationTopic = val
        else if (h === "NOTES") entry.notes = val
        else if (h === "RECEIPT") entry.receipt = val
        else if (h === "ATTACHMENT 1") entry.attachment1 = val
        else if (h === "ATTACHMENT 2") entry.attachment2 = val
        else if (h === "ATTACHMENT 3") entry.attachment3 = val
      })
      
      // Validation: require at least week or date to be considered a row
      if (entry.week || entry.date) {
        result.push(entry)
      }
    }
    return result
  }

  const handleProcessImport = async () => {
    if (!file || !user) return
    
    setIsUploading(true)
    try {
      const text = await file.text()
      const entries = parseCSV(text)
      
      if (entries.length === 0) {
        throw new Error("No valid data found in CSV. Ensure your headers match: WK, #, DATE, Cost, Paid, etc.")
      }

      let count = 0
      for (const entry of entries) {
        await addDoc(collection(db, "profiles", user.uid, "so_entries"), {
          ...entry,
          createdAt: new Date().toISOString(),
          aiInsight: ""
        })
        count++
        setImportCount(count)
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${count} ledger entries.`,
      })
      setFile(null)
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
              <p className="text-muted-foreground">Upload your CSV therapy tracker. We'll automatically parse your WK, session #, costs, and notes.</p>
            </div>

            <Card className={`border-2 border-dashed transition-all duration-300 ${isDragging ? "border-primary bg-primary/5" : "border-slate-200"}`}>
              <CardContent 
                className="p-12 text-center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="space-y-6">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Drop your CSV here</h3>
                      <p className="text-sm text-muted-foreground">Supports CSV files exported from Excel</p>
                    </div>
                    <label className="cursor-pointer inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                      Select File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".csv" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <FileSpreadsheet className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • Ready to import</p>
                    </div>
                    {isUploading && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs font-bold">Importing row {importCount}...</p>
                      </div>
                    )}
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setFile(null)} disabled={isUploading}>Cancel</Button>
                      <Button onClick={handleProcessImport} disabled={isUploading} className="shadow-lg">
                        {isUploading ? "Processing..." : "Start Import"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-slate-50">
                <CardHeader className="p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Expected Headers
                  </h3>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground px-4 pb-4">
                  <p className="mb-2">Your CSV should include these exact columns:</p>
                  <code className="block bg-slate-100 p-2 rounded">
                    WK, #, DATE, Cost, Paid, Check #, Able to Present, Presentation Topic, Notes, Receipt, Attachment 1, Attachment 2, Attachment 3
                  </code>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-slate-50">
                <CardHeader className="p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Import Tips
                  </h3>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground px-4 pb-4">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Export your Excel sheet as "CSV (Comma delimited)"</li>
                    <li>Ensure the first row contains the headers</li>
                    <li>Dates should be in a standard format (YYYY-MM-DD)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

function CardHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>
}

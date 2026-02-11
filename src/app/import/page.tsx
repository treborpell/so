"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))) {
      setFile(droppedFile)
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a .csv or .xlsx spreadsheet file.",
        variant: "destructive"
      })
    }
  }

  const handleProcessImport = () => {
    setIsUploading(true)
    // Simulate parsing
    setTimeout(() => {
      setIsUploading(false)
      toast({
        title: "Import Successful",
        description: `Successfully imported data for 12 patients and 45 sessions.`,
      })
      setFile(null)
    }, 2000)
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <SidebarTrigger />
          <h2 className="text-xl font-headline font-bold">Import Data</h2>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Sync your Spreadsheet</h1>
              <p className="text-muted-foreground">Upload your existing multi-tabbed therapy tracker. We'll automatically parse patient progress, session notes, and attendance.</p>
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
                      <h3 className="text-xl font-semibold">Drop your spreadsheet here</h3>
                      <p className="text-sm text-muted-foreground">Supports CSV, XLS, XLSX formats (up to 20MB)</p>
                    </div>
                    <Button variant="outline" className="rounded-full">Select File</Button>
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
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setFile(null)} disabled={isUploading}>Cancel</Button>
                      <Button onClick={handleProcessImport} disabled={isUploading} className="shadow-lg shadow-primary/20">
                        {isUploading ? "Processing..." : "Start Import"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    What we can parse
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Patient Demographics</li>
                    <li>Session Attendance Logs</li>
                    <li>Clinical Notes for AI Summaries</li>
                    <li>Emotional Well-being Scores</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Tips for best results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Keep patient names consistent across tabs</li>
                    <li>Use clear headers in the first row</li>
                    <li>Ensure date columns are in YYYY-MM-DD</li>
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
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileBarChart, Download, FileText, Share2, Filter } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">Reports</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
            <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Generate New Report
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Monthly Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold">48</span>
                    <span className="text-sm text-emerald-600 font-bold mb-1">+12%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sessions completed this month</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Patient Outcome</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold">82%</span>
                    <span className="text-sm text-emerald-600 font-bold mb-1">Stable</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Average wellness score across all groups</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold">94%</span>
                    <span className="text-sm text-emerald-600 font-bold mb-1">High</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Patient session attendance rate</p>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h3 className="text-lg font-bold">Recent Reports</h3>
              <div className="grid gap-4">
                {[
                  { name: "Q2 Quarterly Clinical Review", date: "May 10, 2024", type: "Quarterly" },
                  { name: "Anxiety Group A - Month 3 Progress", date: "May 01, 2024", type: "Group-Specific" },
                  { name: "Social Integration Monthly Trends", date: "April 28, 2024", type: "Monthly" },
                  { name: "Year-to-Date Patient Outcomes", date: "April 15, 2024", type: "YTD" },
                ].map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/50 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-primary/10 transition-colors">
                        <FileText className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{report.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{report.date}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold uppercase text-slate-500">{report.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"><Share2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const PATIENTS = [
  { id: "1", name: "Alex Johnson", group: "Anxiety Management A", progress: 85, trend: "up", sessions: 12, avatar: "1" },
  { id: "2", name: "Sarah Miller", group: "Social Integration", progress: 62, trend: "up", sessions: 8, avatar: "2" },
  { id: "3", name: "David Chen", group: "PTSD Support", progress: 45, trend: "down", sessions: 15, avatar: "3" },
  { id: "4", name: "Emma Wilson", group: "Anxiety Management A", progress: 92, trend: "up", sessions: 10, avatar: "4" },
  { id: "5", name: "Michael Ross", group: "CBT Fundamentals", progress: 70, trend: "neutral", sessions: 6, avatar: "5" },
  { id: "6", name: "Lily Brown", group: "Social Integration", progress: 38, trend: "down", sessions: 4, avatar: "6" },
]

export default function PatientsPage() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-headline font-bold">Patient Progress</h2>
          </div>
          <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4 mr-2" /> Register Patient
          </Button>
        </header>

        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
             <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients by name, group, or ID..." className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PATIENTS.map((patient) => (
                <Card key={patient.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary transition-colors">
                          <AvatarImage src={`https://picsum.photos/seed/patient-${patient.avatar}/100/100`} />
                          <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold">{patient.name}</h3>
                          <p className="text-xs text-muted-foreground">{patient.group}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200">
                        {patient.sessions} Sessions
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Overall Wellness</span>
                        <div className="flex items-center gap-1">
                          {patient.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {patient.trend === 'down' && <TrendingDown className="h-3 w-3 text-rose-600" />}
                          {patient.trend === 'neutral' && <Minus className="h-3 w-3 text-slate-400" />}
                          <span className={patient.trend === 'up' ? 'text-emerald-600' : patient.trend === 'down' ? 'text-rose-600' : 'text-slate-500'}>
                            {patient.progress}%
                          </span>
                        </div>
                      </div>
                      <Progress value={patient.progress} className="h-1.5" />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
                       <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs font-semibold">View Records</Button>
                       <Button size="sm" variant="ghost" className="flex-1 rounded-lg text-xs font-semibold text-primary">Track Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}
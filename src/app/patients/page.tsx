
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
import { useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore } from "@/firebase/provider"

export default function PatientsPage() {
  const db = useFirestore();
  const patientsQuery = query(collection(db, "patients"), orderBy("name"));
  const { data: patients, loading } = useCollection(patientsQuery);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-bold">Patient Roster</h2>
          </div>
          <Button size="sm" className="rounded-full shadow-lg h-10">
            <UserPlus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Add Patient</span>
          </Button>
        </header>

        <main className="p-4">
          <div className="max-w-6xl mx-auto space-y-4">
             <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
              <Search className="ml-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." className="border-none shadow-none focus-visible:ring-0 bg-transparent h-10" />
            </div>

            {loading ? (
              <div className="text-center py-20 text-muted-foreground">Loading roster...</div>
            ) : (
              <div className="grid gap-3">
                {patients?.map((patient: any) => (
                  <Card key={patient.id} className="border-none shadow-sm active:scale-[0.98] transition-all touch-manipulation">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-primary/10">
                        <AvatarImage src={`https://picsum.photos/seed/${patient.id}/100/100`} />
                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{patient.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{patient.groupName}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={patient.wellnessScore || 50} className="h-1 flex-1" />
                          <span className="text-[10px] font-bold text-primary">{patient.wellnessScore || 0}%</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full h-6 text-[10px] bg-slate-50 border-slate-200">
                        {patient.status || 'active'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                {(!patients || patients.length === 0) && (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-12 text-center space-y-4">
                      <Users className="h-12 w-12 text-slate-200 mx-auto" />
                      <div className="space-y-1">
                        <p className="font-bold">No patients registered</p>
                        <p className="text-xs text-muted-foreground">Import your Excel data to populate your patient list.</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">Import Spreadsheet</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}

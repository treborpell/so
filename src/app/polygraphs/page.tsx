
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Plus, Save, Loader2, DollarSign, History, Settings, MapPin, Phone, Trash2, Edit2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/firebase/provider"
import { doc, setDoc, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const RESULT_OPTIONS = ["Non-Deceptive", "Deceptive", "Inconclusive"];

export default function PolygraphPage() {
  const { user, db, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("history")
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPolygrapher, setIsSavingPolygrapher] = useState(false)
  const [exams, setExams] = useState<any[]>([])
  const [polygraphers, setPolygraphers] = useState<any[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    polygrapherId: "",
    cost: "",
    q1: "",
    r1: "Non-Deceptive",
    q2: "",
    r2: "Non-Deceptive",
    overallResult: "Non-Deceptive"
  })

  const [polygrapherForm, setPolygrapherForm] = useState({
    name: "",
    address: "",
    phone: ""
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Sync Exams
  useEffect(() => {
    if (!user || !db) return;
    const colRef = collection(db, "users", user.uid, "polygraphs");
    const q = query(colRef, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(data);
      setIsLoadingExams(false);
    });
    return () => unsubscribe();
  }, [user, db]);

  // Sync Polygraphers
  useEffect(() => {
    if (!user || !db) return;
    const colRef = collection(db, "users", user.uid, "polygrapher_directory");
    const q = query(colRef, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPolygraphers(data);
    });
    return () => unsubscribe();
  }, [user, db]);

  const handleSaveExam = async () => {
    if (!user || !db) return;
    if (!formData.polygrapherId) {
      toast({ title: "Selection Required", description: "Please select a polygrapher.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const selectedPoly = polygraphers.find(p => p.id === formData.polygrapherId);
      const data = {
        ...formData,
        polygrapherName: selectedPoly?.name || "Unknown",
        cost: Number(formData.cost) || 0,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "polygraphs", editingId), data);
        toast({ title: "Exam Updated" });
      } else {
        await addDoc(collection(db, "users", user.uid, "polygraphs"), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Exam Recorded" });
      }

      resetForm();
      setActiveTab("history");
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      polygrapherId: "",
      cost: "",
      q1: "",
      r1: "Non-Deceptive",
      q2: "",
      r2: "Non-Deceptive",
      overallResult: "Non-Deceptive"
    });
    setEditingId(null);
  };

  const handleEdit = (exam: any) => {
    setFormData({
      date: exam.date,
      polygrapherId: exam.polygrapherId,
      cost: exam.cost.toString(),
      q1: exam.q1,
      r1: exam.r1,
      q2: exam.q2,
      r2: exam.r2,
      overallResult: exam.overallResult
    });
    setEditingId(exam.id);
    setActiveTab("new");
  };

  const handleDeleteExam = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "polygraphs", id));
      toast({ title: "Exam Deleted" });
    } catch (error: any) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleSavePolygrapher = async () => {
    if (!user || !db || !polygrapherForm.name) return;
    setIsSavingPolygrapher(true);
    try {
      await addDoc(collection(db, "users", user.uid, "polygrapher_directory"), {
        ...polygrapherForm,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Polygrapher Added" });
      setPolygrapherForm({ name: "", address: "", phone: "" });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingPolygrapher(false);
    }
  };

  const handleDeletePolygrapher = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "polygrapher_directory", id));
      toast({ title: "Polygrapher Removed" });
    } catch (error: any) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center font-black">Syncing...</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50">
      <header className="flex h-20 shrink-0 items-center justify-between border-b bg-white px-8 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h2 className="text-xl font-black tracking-tight">Polygraphs</h2>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Integrity Verification
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-100 rounded-full h-12 p-1 px-2 border">
              <TabsTrigger value="history" className="rounded-full text-xs font-black px-8">
                <History className="h-4 w-4 mr-2" /> History
              </TabsTrigger>
              <TabsTrigger value="new" className="rounded-full text-xs font-black px-8">
                {editingId ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} 
                {editingId ? 'Edit Exam' : 'New Exam'}
              </TabsTrigger>
              <TabsTrigger value="directory" className="rounded-full text-xs font-black px-8">
                <Settings className="h-4 w-4 mr-2" /> Directory
              </TabsTrigger>
            </TabsList>
          </div>

          {/* HISTORY */}
          <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b">
                    <TableHead className="font-black text-[10px] uppercase w-[120px]">Date</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Polygrapher</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-right">Cost</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Questions & Results</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-center">Outcome</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-900">{exam.date}</TableCell>
                      <TableCell className="font-medium text-slate-600">{exam.polygrapherName}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">${Number(exam.cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="space-y-1 py-2">
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[8px] h-4 font-black px-1">Q1</Badge>
                             <span className="text-xs font-medium text-slate-500">{exam.q1}</span>
                             <span className={`text-[10px] font-black ${exam.r1 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r1}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[8px] h-4 font-black px-1">Q2</Badge>
                             <span className="text-xs font-medium text-slate-500">{exam.q2}</span>
                             <span className={`text-[10px] font-black ${exam.r2 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r2}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`rounded-full px-4 py-1 font-black text-[10px] ${exam.overallResult === 'Non-Deceptive' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}>
                          {exam.overallResult.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5">
                              <Edit2 className="h-4 w-4" />
                           </Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/5">
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[2rem]">
                                 <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                       <AlertTriangle className="h-5 w-5 text-destructive" />
                                       Confirm Deletion
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                       This will permanently remove the polygraph record for <span className="font-bold text-slate-900">{exam.date}</span>. This action cannot be undone.
                                    </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteExam(exam.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                       Delete Record
                                    </AlertDialogAction>
                                 </AlertDialogFooter>
                              </AlertDialogContent>
                           </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exams.length === 0 && !isLoadingExams && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold italic">No exams recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* NEW/EDIT EXAM */}
          <TabsContent value="new" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
             <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border-t-8 border-primary">
                <CardHeader className="p-10 pb-4 text-center">
                   <CardTitle className="text-2xl font-black">{editingId ? 'Update Exam Record' : 'New Polygraph Entry'}</CardTitle>
                   <CardDescription className="font-medium text-slate-400">
                     {editingId ? 'Modify the details of your recorded exam.' : 'Log comprehensive exam details and results.'}
                   </CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                   <div className="grid gap-8 md:grid-cols-3">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Exam Date</Label>
                         <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-inner" />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Provider</Label>
                         <Select value={formData.polygrapherId} onValueChange={(v) => setFormData({...formData, polygrapherId: v})}>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-inner text-left">
                               <SelectValue placeholder="Choose agency..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                               {polygraphers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                               {polygraphers.length === 0 && <SelectItem value="none" disabled>No polygraphers defined</SelectItem>}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Cost</Label>
                         <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input type="number" step="0.01" placeholder="0.00" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12 shadow-inner" />
                         </div>
                      </div>
                   </div>

                   <Separator />

                   <div className="grid gap-10 md:grid-cols-2">
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2 tracking-widest">Question 1</Label>
                            <Input placeholder="Core question text..." value={formData.q1} onChange={(e) => setFormData({...formData, q1: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 shadow-inner" />
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Q1 Result</Label>
                            <Select value={formData.r1} onValueChange={(v) => setFormData({...formData, r1: v})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent className="rounded-2xl border-none shadow-2xl">
                                  {RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2 tracking-widest">Question 2</Label>
                            <Input placeholder="Core question text..." value={formData.q2} onChange={(e) => setFormData({...formData, q2: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 shadow-inner" />
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Q2 Result</Label>
                            <Select value={formData.r2} onValueChange={(v) => setFormData({...formData, r2: v})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent className="rounded-2xl border-none shadow-2xl">
                                  {RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                   </div>

                   <Separator />

                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Overall Exam Outcome</Label>
                      <Select value={formData.overallResult} onValueChange={(v) => setFormData({...formData, overallResult: v})}>
                         <SelectTrigger className={`h-16 rounded-2xl border-none font-black text-xl px-8 shadow-lg ${formData.overallResult === 'Non-Deceptive' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="flex gap-4">
                      {editingId && (
                        <Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl font-bold px-8">Cancel</Button>
                      )}
                      <Button onClick={handleSaveExam} disabled={isSaving} className="flex-1 h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/30">
                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
                        {editingId ? 'Save Changes' : 'Finalize Exam Record'}
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* DIRECTORY */}
          <TabsContent value="directory" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto space-y-8">
             <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                   <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black">Add Provider</CardTitle>
                      <CardDescription className="font-medium text-slate-400">Save agency details for quick selection.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Agency Name</Label>
                         <Input placeholder="e.g. Amich and Jenks" value={polygrapherForm.name} onChange={(e) => setPolygrapherForm({...polygrapherForm, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Address</Label>
                         <Input placeholder="Full business address" value={polygrapherForm.address} onChange={(e) => setPolygrapherForm({...polygrapherForm, address: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Phone Number</Label>
                         <Input placeholder="(555) 555-5555" value={polygrapherForm.phone} onChange={(e) => setPolygrapherForm({...polygrapherForm, phone: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                      </div>
                      <Button onClick={handleSavePolygrapher} disabled={isSavingPolygrapher || !polygrapherForm.name} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20">
                         {isSavingPolygrapher ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                         Add to Directory
                      </Button>
                   </CardContent>
                </Card>

                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest ml-4">Saved Providers</h3>
                   <div className="grid gap-4">
                      {polygraphers.map((p) => (
                        <Card key={p.id} className="border-none shadow-sm rounded-3xl bg-white group overflow-hidden">
                           <CardContent className="p-6 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Settings className="h-6 w-6" />
                                 </div>
                                 <div className="space-y-0.5">
                                    <h4 className="font-black text-slate-900">{p.name}</h4>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                       <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {p.address || 'No address'}</span>
                                       <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {p.phone || 'No phone'}</span>
                                    </div>
                                 </div>
                              </div>
                              <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity">
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent className="rounded-[2rem]">
                                    <AlertDialogHeader>
                                       <AlertDialogTitle>Remove provider?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                          This will remove <span className="font-bold text-slate-900">{p.name}</span> from your directory.
                                       </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                       <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                       <AlertDialogAction onClick={() => handleDeletePolygrapher(p.id)} className="bg-destructive rounded-xl">Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                 </AlertDialogContent>
                              </AlertDialog>
                           </CardContent>
                        </Card>
                      ))}
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

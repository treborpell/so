
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Plus, Save, Loader2, DollarSign, History, Settings, MapPin, Phone, Trash2, Edit2, AlertTriangle, BookType } from "lucide-react"
import { useAuth } from "@/firebase/provider"
import { doc, setDoc, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import { GOOGLE_MAPS_API_KEY } from "@/config/maps"
import { useMediaQuery } from "@/hooks/use-media-query"

const RESULT_OPTIONS = ["Non-Deceptive", "Deceptive", "Inconclusive"];
const LIBRARIES: ("places")[] = ["places"];

const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

export default function PolygraphPage() {
  const { user, db, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: LIBRARIES });
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [editAutocomplete, setEditAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history")
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPolygrapher, setIsSavingPolygrapher] = useState(false)
  const [isSavingExamType, setIsSavingExamType] = useState(false)
  const [exams, setExams] = useState<any[]>([])
  const [polygraphers, setPolygraphers] = useState<any[]>([])
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingProvider, setEditingProvider] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    polygrapherId: "",
    examTypeId: "",
    cost: "",
    q1: "",
    r1: "Non-Deceptive",
    q2: "",
    r2: "Non-Deceptive",
    overallResult: "Non-Deceptive"
  })

  const [polygrapherForm, setPolygrapherForm] = useState({ name: "", address: "", phone: "" })
  const [examTypeForm, setExamTypeForm] = useState({ name: "" })

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(query(collection(db, "users", user.uid, "polygraphs"), orderBy("date", "desc")), (snap) => {
      setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setIsLoadingExams(false)
    })
    return () => unsub()
  }, [user, db])

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(query(collection(db, "users", user.uid, "polygrapher_directory"), orderBy("name", "asc")), (snap) => {
      setPolygraphers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [user, db])

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(query(collection(db, "users", user.uid, "polygraph_exam_types"), orderBy("name", "asc")), (snap) => {
      setExamTypes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [user, db])

  const handleSaveExam = async () => {
    if (!user || !db || !formData.polygrapherId || !formData.examTypeId) {
      toast({ title: "Selection Required", description: "Please select a polygrapher and exam type.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const selectedPoly = polygraphers.find(p => p.id === formData.polygrapherId)
      const selectedType = examTypes.find(t => t.id === formData.examTypeId)
      const data = {
        ...formData,
        polygrapherName: selectedPoly?.name || "Unknown",
        examTypeName: selectedType?.name || "Unknown",
        cost: Number(formData.cost) || 0,
        updatedAt: new Date().toISOString()
      }
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "polygraphs", editingId), data)
        toast({ title: "Exam Updated" })
      } else {
        await addDoc(collection(db, "users", user.uid, "polygraphs"), { ...data, createdAt: new Date().toISOString() })
        toast({ title: "Exam Recorded" })
      }
      resetForm()
      setActiveTab("history")
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], polygrapherId: "", examTypeId: "", cost: "", q1: "", r1: "Non-Deceptive", q2: "", r2: "Non-Deceptive", overallResult: "Non-Deceptive" })
    setEditingId(null)
  }

  const handleEdit = (exam: any) => {
    setFormData({ date: exam.date, polygrapherId: exam.polygrapherId, examTypeId: exam.examTypeId, cost: exam.cost.toString(), q1: exam.q1, r1: exam.r1, q2: exam.q2, r2: exam.r2, overallResult: exam.overallResult })
    setEditingId(exam.id)
    setActiveTab("new")
  }

  const handleDeleteExam = async (id: string) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "polygraphs", id))
      toast({ title: "Exam Deleted" })
    } catch (error: any) {
      toast({ title: "Delete Failed", variant: "destructive" })
    }
  }

  const handleSavePolygrapher = async () => {
    if (!user || !db || !polygrapherForm.name) return
    setIsSavingPolygrapher(true)
    try {
      await addDoc(collection(db, "users", user.uid, "polygrapher_directory"), { ...polygrapherForm, createdAt: new Date().toISOString() })
      toast({ title: "Polygrapher Added" })
      setPolygrapherForm({ name: "", address: "", phone: "" })
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsSavingPolygrapher(false)
    }
  }

  const handleUpdateProvider = async () => {
    if (!user || !db || !editingProvider) return;

    setIsSavingPolygrapher(true);
    try {
        const providerRef = doc(db, "users", user.uid, "polygrapher_directory", editingProvider.id);
        await updateDoc(providerRef, {
            name: editingProvider.name,
            address: editingProvider.address,
            phone: editingProvider.phone,
        });
        toast({ title: "Provider Updated" });
        setEditingProvider(null);
    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsSavingPolygrapher(false);
    }
  };
  
  const handleSaveExamType = async () => {
    if (!user || !db || !examTypeForm.name) return
    setIsSavingExamType(true)
    try {
      await addDoc(collection(db, "users", user.uid, "polygraph_exam_types"), { ...examTypeForm, createdAt: new Date().toISOString() })
      toast({ title: "Exam Type Added" })
      setExamTypeForm({ name: "" })
    } catch (error: any) { 
      toast({ title: "Save Failed", description: error.message, variant: "destructive" }) 
    } finally { 
      setIsSavingExamType(false) 
    }
  }

  const handleDeletePolygrapher = async (id: string) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "polygrapher_directory", id))
      toast({ title: "Polygrapher Removed" })
    } catch (error: any) {
      toast({ title: "Delete Failed", variant: "destructive" })
    }
  }

  const handleDeleteExamType = async (id: string) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "polygraph_exam_types", id))
      toast({ title: "Exam Type Removed" })
    } catch (error: any) {
      toast({ title: "Delete Failed", variant: "destructive" })
    }
  }
  
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      setPolygrapherForm(prev => ({...prev, address: place.formatted_address || ''}));
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  }

  const onEditPlaceChanged = () => {
    if (editAutocomplete !== null) {
        const place = editAutocomplete.getPlace();
        setEditingProvider((prev: any) => ({...prev, address: place.formatted_address || ''}));
    }
  };

  if (authLoading || !user) return <div className="h-screen w-full flex items-center justify-center font-black">Syncing...</div>

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex h-20 shrink-0 items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4"><SidebarTrigger /><div><h2 className="text-xl font-black tracking-tight text-slate-900">Polygraphs</h2><p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Integrity Verification</p></div></div>
      </header>

      <main className="flex-1 w-full space-y-8 p-4 sm:p-8 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
        <div className="flex justify-center mb-8 sticky top-20 z-20 backdrop-blur-sm py-4 bg-white/50">
          <TabsList className="bg-slate-100 rounded-full h-auto sm:h-12 p-1.5 px-2.5 border flex-wrap sm:flex-nowrap">
              <TabsTrigger value="history" className="rounded-full text-xs font-black px-6 py-2.5"><History className="h-4 w-4 mr-2" /> History</TabsTrigger>
              <TabsTrigger value="new" className="rounded-full text-xs font-black px-6 py-2.5">{editingId ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} {editingId ? 'Edit Exam' : 'New Exam'}</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full text-xs font-black px-6 py-2.5"><Settings className="h-4 w-4 mr-2" /> Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isDesktop ? (
              <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] overflow-hidden"><Table><TableHeader className="bg-slate-50/80"><TableRow className="border-b-2 border-slate-100"><TableHead className="font-black text-[10px] uppercase w-[120px]">Date</TableHead><TableHead className="font-black text-[10px] uppercase">Polygrapher</TableHead><TableHead className="font-black text-[10px] uppercase">Type</TableHead><TableHead className="font-black text-[10px] uppercase text-right">Cost</TableHead><TableHead className="font-black text-[10px] uppercase">Questions & Results</TableHead><TableHead className="font-black text-[10px] uppercase text-center">Outcome</TableHead><TableHead className="w-24 text-center">Actions</TableHead></TableRow></TableHeader><TableBody>{exams.map((exam) => (<TableRow key={exam.id} className="group hover:bg-slate-50/50 transition-colors"><TableCell className="font-bold text-slate-900">{exam.date}</TableCell><TableCell className="font-medium text-slate-600">{exam.polygrapherName}</TableCell><TableCell className="font-medium text-slate-600"><Badge variant="secondary" className="font-mono">{exam.examTypeName}</Badge></TableCell><TableCell className="text-right font-bold text-slate-900">${Number(exam.cost).toFixed(2)}</TableCell><TableCell><div className="space-y-1 py-2"><div className="flex items-center gap-2"><Badge variant="outline" className="text-[8px] h-4 font-black px-1">Q1</Badge><span className="text-xs font-medium text-slate-500">{exam.q1}</span><span className={`text-[10px] font-black ${exam.r1 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r1}</span></div><div className="flex items-center gap-2"><Badge variant="outline" className="text-[8px] h-4 font-black px-1">Q2</Badge><span className="text-xs font-medium text-slate-500">{exam.q2}</span><span className={`text-[10px] font-black ${exam.r2 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r2}</span></div></div></TableCell><TableCell className="text-center"><Badge className={`rounded-full px-4 py-1 font-black text-[10px] ${exam.overallResult === 'Non-Deceptive' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}>{exam.overallResult.toUpperCase()}</Badge></TableCell><TableCell><div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5"><Edit2 className="h-4 w-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirm Deletion</AlertDialogTitle><AlertDialogDescription>This will permanently remove the polygraph record for <span className="font-bold text-slate-900">{exam.date}</span>. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteExam(exam.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete Record</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></TableCell></TableRow>))}
                  {exams.length === 0 && !isLoadingExams && (<TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-400 font-bold italic">No exams recorded yet.</TableCell></TableRow>)}</TableBody></Table></Card>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <Card key={exam.id} className="rounded-[2.5rem] shadow-2xl shadow-slate-500/10 border-2 border-slate-100 relative group">
                     <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10">
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2rem]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirm Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove the polygraph record for <span className="font-bold text-slate-900">{exam.date}</span>.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteExam(exam.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">Delete Record</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="pr-12">
                          <p className="font-black text-xl text-slate-900">{exam.date}</p>
                          <p className="font-medium text-slate-500">{exam.polygrapherName}</p>
                        </div>
                        <Badge className={`rounded-full px-4 py-1.5 font-black text-[10px] ${exam.overallResult === 'Non-Deceptive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>{exam.overallResult.toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50/80 p-4 rounded-2xl">
                        <Badge variant="secondary" className="font-mono bg-white border-slate-200">{exam.examTypeName}</Badge>
                        <p className="font-bold text-slate-900 text-lg">${Number(exam.cost).toFixed(2)}</p>
                      </div>
                      <div className="space-y-3 pt-3">
                        <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px] h-5 font-black px-1.5 border-slate-200">Q1</Badge><span className="text-sm font-medium text-slate-600">{exam.q1}</span><span className={`text-xs font-black ${exam.r1 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r1}</span></div>
                        <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px] h-5 font-black px-1.5 border-slate-200">Q2</Badge><span className="text-sm font-medium text-slate-600">{exam.q2}</span><span className={`text-xs font-black ${exam.r2 === 'Non-Deceptive' ? 'text-emerald-500' : 'text-red-500'}`}>{exam.r2}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {exams.length === 0 && !isLoadingExams && (<p className="text-center py-20 text-slate-400 font-bold italic">No exams recorded yet.</p>)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
             <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] bg-white overflow-hidden"><CardHeader className="p-10 pb-4 text-center"><CardTitle className="text-2xl font-black text-slate-900">{editingId ? 'Update Exam Record' : 'New Polygraph Entry'}</CardTitle><CardDescription className="font-medium text-slate-400 pt-2">{editingId ? 'Modify the details of your recorded exam.' : 'Log comprehensive exam details and results.'}</CardDescription></CardHeader><CardContent className="p-10 space-y-10"><div className="grid gap-8 md:grid-cols-2"><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Exam Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-6 shadow-inner" /></div><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Provider</Label><Select value={formData.polygrapherId} onValueChange={(v) => setFormData({...formData, polygrapherId: v})}><SelectTrigger className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-6 shadow-inner text-left"><SelectValue placeholder="Choose agency..." /></SelectTrigger><SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl shadow-slate-500/10">{polygraphers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}{polygraphers.length === 0 && <SelectItem value="none" disabled>No polygraphers defined</SelectItem>}</SelectContent></Select></div></div><div className="grid gap-8 md:grid-cols-2"><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Exam Type</Label><Select value={formData.examTypeId} onValueChange={(v) => setFormData({...formData, examTypeId: v})}><SelectTrigger className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-6 shadow-inner text-left"><SelectValue placeholder="Choose type..." /></SelectTrigger><SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl shadow-slate-500/10">{examTypes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}{examTypes.length === 0 && <SelectItem value="none" disabled>No types defined</SelectItem>}</SelectContent></Select></div><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Cost</Label><div className="relative"><DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type="number" step="0.01" placeholder="0.00" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold pl-12 shadow-inner" /></div></div></div><Separator className="bg-slate-100" /><div className="grid gap-10 md:grid-cols-2"><div className="space-y-6"><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-primary ml-3 tracking-widest">Question 1</Label><Input placeholder="Core question text..." value={formData.q1} onChange={(e) => setFormData({...formData, q1: e.target.value})} className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-medium px-6 shadow-inner" /></div><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Q1 Result</Label><Select value={formData.r1} onValueChange={(v) => setFormData({...formData, r1: v})}><SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl border-slate-100 shadow-2xl shadow-slate-500/10">{RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-6"><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-primary ml-3 tracking-widest">Question 2</Label><Input placeholder="Core question text..." value={formData.q2} onChange={(e) => setFormData({...formData, q2: e.target.value})} className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-medium px-6 shadow-inner" /></div><div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Q2 Result</Label><Select value={formData.r2} onValueChange={(v) => setFormData({...formData, r2: v})}><SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl border-slate-100 shadow-2xl shadow-slate-500/10">{RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div></div></div><Separator className="bg-slate-100" /><div className="space-y-4"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Overall Exam Outcome</Label><Select value={formData.overallResult} onValueChange={(v) => setFormData({...formData, overallResult: v})}><SelectTrigger className={`h-16 rounded-2xl border-none font-black text-xl px-8 shadow-lg ${formData.overallResult === 'Non-Deceptive' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl border-none shadow-2xl">{RESULT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div><div className="flex gap-4">{editingId && (<Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl font-bold px-8">Cancel</Button>)}<Button onClick={handleSaveExam} disabled={isSaving} className="flex-1 h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/30">{isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}{editingId ? 'Save Changes' : 'Finalize Exam Record'}</Button></div></CardContent></Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] overflow-hidden"><CardHeader className="p-8 pb-4"><CardTitle className="text-xl font-black">Add Provider</CardTitle><CardDescription className="font-medium text-slate-400 pt-1">Save agency details for quick selection.</CardDescription></CardHeader><CardContent className="p-8 space-y-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Agency Name</Label><Input placeholder="e.g. Amich and Jenks" value={polygrapherForm.name} onChange={(e) => setPolygrapherForm({...polygrapherForm, name: e.target.value})} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 font-bold px-4 shadow-inner" /></div>
                {isLoaded && (
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Address</Label>
                        <Autocomplete
                            onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <Input placeholder="Full business address" value={polygrapherForm.address} onChange={(e) => setPolygrapherForm({...polygrapherForm, address: e.target.value})} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 font-bold px-4 shadow-inner" />
                        </Autocomplete>
                    </div>
                )}
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Phone Number</Label><Input placeholder="(555) 555-5555" value={polygrapherForm.phone} onChange={(e) => setPolygrapherForm({...polygrapherForm, phone: formatPhoneNumber(e.target.value)})} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 font-bold px-4 shadow-inner" /></div><Button onClick={handleSavePolygrapher} disabled={isSavingPolygrapher || !polygrapherForm.name} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">{isSavingPolygrapher ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}Add to Directory</Button></CardContent></Card>
                <div className="space-y-4"><h3 className="text-sm font-black uppercase text-slate-400 tracking-widest ml-4">Saved Providers</h3><div className="grid gap-4">{polygraphers.map((p) => (<Card key={p.id} className="border-2 border-slate-100 shadow-xl shadow-slate-500/10 rounded-[2.5rem] group overflow-hidden relative"><div className="absolute top-4 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10" onClick={() => setEditingProvider(p)}><Edit2 className="h-4 w-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle>Remove provider?</AlertDialogTitle><AlertDialogDescription>This will remove <span className="font-bold text-slate-900">{p.name}</span> from your directory.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePolygrapher(p.id)} className="bg-destructive rounded-xl">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div><CardContent className="p-6 flex items-center"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Settings className="h-6 w-6" /></div><div className="space-y-0.5"><h4 className="font-black text-slate-900 pr-12">{p.name}</h4><div className="flex items-center gap-3 text-[10px] font-bold text-slate-400"><span className="flex items-center gap-1.5"><MapPin className="h-2.5 w-2.5" /> {p.address || 'No address'}</span><span className="flex items-center gap-1.5"><Phone className="h-2.5 w-2.5" /> {p.phone || 'No phone'}</span></div></div></div></CardContent></Card>))}
                   </div></div>
             </div>
             <Separator className="my-8 bg-slate-100" />
             <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] overflow-hidden"><CardHeader className="p-8 pb-4"><CardTitle className="text-xl font-black">Add Exam Type</CardTitle><CardDescription className="font-medium text-slate-400 pt-1">Define a new category for polygraph tests.</CardDescription></CardHeader><CardContent className="p-8 space-y-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Exam Name</Label><Input placeholder="e.g. Clinical, Maintenance, etc." value={examTypeForm.name} onChange={(e) => setExamTypeForm({ ...examTypeForm, name: e.target.value })} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 font-bold px-4 shadow-inner" /></div><Button onClick={handleSaveExamType} disabled={isSavingExamType || !examTypeForm.name} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">{isSavingExamType ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}Add Exam Type</Button></CardContent></Card>
                <div className="space-y-4"><h3 className="text-sm font-black uppercase text-slate-400 tracking-widest ml-4">Saved Exam Types</h3><div className="grid gap-4">{examTypes.map((p) => (<Card key={p.id} className="border-2 border-slate-100 shadow-xl shadow-slate-500/10 rounded-[2.5rem] group overflow-hidden relative"><div className="absolute top-4 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle>Remove type?</AlertDialogTitle><AlertDialogDescription>This will remove <span className="font-bold text-slate-900">{p.name}</span> from your list.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteExamType(p.id)} className="bg-destructive rounded-xl">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div><CardContent className="p-6 flex items-center"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><BookType className="h-6 w-6" /></div><div className="space-y-0.5"><h4 className="font-black text-slate-900 pr-12">{p.name}</h4></div></div></CardContent></Card>))}
                   </div></div>
             </div>
             {editingProvider && (
                <Dialog open={!!editingProvider} onOpenChange={(isOpen) => !isOpen && setEditingProvider(null)}>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white"><DialogHeader><DialogTitle>Edit Provider</DialogTitle><DialogDescription>Make changes to your provider here. Click save when you're done.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={editingProvider.name} onChange={(e) => setEditingProvider({...editingProvider, name: e.target.value})} className="col-span-3 h-12 rounded-lg" /></div>
                            {isLoaded && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="address" className="text-right">Address</Label><div className="col-span-3"><Autocomplete onLoad={(autocomplete) => setEditAutocomplete(autocomplete)} onPlaceChanged={onEditPlaceChanged}><Input id="address" value={editingProvider.address} onChange={(e) => setEditingProvider({...editingProvider, address: e.target.value})} className="h-12 rounded-lg" /></Autocomplete></div></div>)}
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right">Phone</Label><Input id="phone" value={editingProvider.phone} onChange={(e) => setEditingProvider({...editingProvider, phone: formatPhoneNumber(e.target.value)})} className="col-span-3 h-12 rounded-lg" /></div></div><DialogFooter><Button variant="outline" onClick={() => setEditingProvider(null)} className="h-12 rounded-lg">Cancel</Button><Button onClick={handleUpdateProvider} disabled={isSavingPolygrapher} className="h-12 rounded-lg">{isSavingPolygrapher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button></DialogFooter></DialogContent>
                </Dialog>
             )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

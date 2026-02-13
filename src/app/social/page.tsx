
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle, CheckCircle2, History, Users, MapPin, Tag, Settings, Plus, X, Trash2, Upload, ChevronDown, Edit2, AlertTriangle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addDoc, collection, query, orderBy, doc, getDoc, setDoc, writeBatch, updateDoc, deleteDoc, limit } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useMemoFirebase, usePaginatedCollection } from "@/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/firebase/provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll/InfiniteScrollTrigger"

interface ProSocialActivity {
  id?: string; 
  date: string;
  cost: string;
  type: string;
  activityType: string;
  location: string;
  participants: string;
  createdAt?: string;
}

export default function ProSocialLogPage() {
  const { user, db, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history")
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [pasteContent, setPasteContent] = useState("")

  const [settings, setSettings] = useState({
    groupTypes: ["Family", "Friends", "Work Colleagues", "Community", "Support Group"],
    activityTypes: ["Entertainment", "Restaurant", "Outdoor", "Sport", "Cultural", "Volunteering"]
  })
  const [newGroupType, setNewGroupType] = useState("")
  const [newActivityType, setNewActivityType] = useState("")

  const [formData, setFormData] = useState<ProSocialActivity>({
    date: new Date().toISOString().split('T')[0],
    cost: "0.00",
    type: "",
    activityType: "",
    location: "",
    participants: ""
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`/social?${params.toString()}`)
  }

  // Paginated History Query
  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "pro_social_logs"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: historyEntries, isLoading: loadingHistory, loadMore, hasMore } = usePaginatedCollection<ProSocialActivity>(entriesQuery, 15);

  // Dedicated query for automation (latest only)
  const latestQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "pro_social_logs"), orderBy("date", "desc"), limit(1));
  }, [db, user]);
  const { data: latestEntries } = useCollection<ProSocialActivity>(latestQuery);

  // Totals Query
  const allEntriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "pro_social_logs"));
  }, [db, user]);
  const { data: allEntries } = useCollection<ProSocialActivity>(allEntriesQuery);

  useEffect(() => {
    async function loadSettings() {
      if (user && db) {
        const docRef = doc(db, "users", user.uid, "config", "pro_social_preferences");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            groupTypes: Array.isArray(data.groupTypes) && data.groupTypes.length > 0 ? data.groupTypes : prev.groupTypes,
            activityTypes: Array.isArray(data.activityTypes) && data.activityTypes.length > 0 ? data.activityTypes : prev.activityTypes
          }));
        }
      }
    }
    loadSettings();
  }, [user, db]);

  useEffect(() => {
    async function automateForm() {
      if (!user || !db || !latestEntries || latestEntries.length === 0 || editingId !== null) return;
      const latest = latestEntries[0];
      if (latest && latest.date) { 
        const lastDate = new Date(latest.date);
        if (isNaN(lastDate.getTime())) { 
          setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
          return; 
        }
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 7);
        setFormData(prev => ({ ...prev, date: nextDate.toISOString().split('T')[0], type: latest.type || "", activityType: latest.activityType || "" }));
      }
    }
    if (activeTab === "new-entry" && latestEntries !== null) {
      automateForm();
    }
  }, [user, db, latestEntries, activeTab, editingId]);

  const saveSettingsToDb = async (newSettings: typeof settings) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, "users", user.uid, "config", "pro_social_preferences"), newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to auto-save settings", error);
    }
  };

  const addSettingItem = (type: 'group' | 'activity') => {
    const val = type === 'group' ? newGroupType : newActivityType;
    if (!val.trim()) return;
    const newSettings = { ...settings };
    if (type === 'group') {
      if (!newSettings.groupTypes.includes(val.trim())) {
        newSettings.groupTypes = [...newSettings.groupTypes, val.trim()];
        saveSettingsToDb(newSettings);
        toast({ title: "Group Type Added" });
      }
      setNewGroupType("");
    } else {
      if (!newSettings.activityTypes.includes(val.trim())) {
        newSettings.activityTypes = [...newSettings.activityTypes, val.trim()];
        saveSettingsToDb(newSettings);
        toast({ title: "Activity Type Added" });
      }
      setNewActivityType("");
    }
  };

  const removeSettingItem = (type: 'group' | 'activity', item: string) => {
    const newSettings = { ...settings };
    if (type === 'group') {
      newSettings.groupTypes = newSettings.groupTypes.filter(i => i !== item);
    } else {
      newSettings.activityTypes = newSettings.activityTypes.filter(i => i !== item);
    }
    saveSettingsToDb(newSettings);
    toast({ title: "Item Removed" });
  };

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], cost: "0.00", type: "", activityType: "", location: "", participants: "" });
    setEditingId(null);
  };

  const handleEdit = (entry: ProSocialActivity) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    handleTabChange("new-entry");
  };

  const handleDeleteActivity = async (id: string, activityDate: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "pro_social_logs", id));
      toast({ title: "Activity Deleted", description: `Activity on ${activityDate} removed.` });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleImportData = async () => {
    if (!user || !db || !pasteContent.trim()) return;
    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      const rows = pasteContent.split('\n').filter(r => r.trim());
      let count = 0;
      rows.forEach(row => {
        let cols = row.includes('\t') ? row.split('\t') : row.split(',');
        cols = cols.map(c => c.trim().replace(/^"|"$/g, '')); 
        if (cols.length < 2) return; 
        let dateStr = cols[0];
        if (dateStr.includes('/')) {
          const [m, d, y] = dateStr.split('/');
          const year = y.length === 2 ? `20${y}` : y;
          dateStr = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) return;
        dateStr = parsedDate.toISOString().split('T')[0];
        const costStr = cols[1]?.replace('$', '').replace(',', '') || "0";
        const docRef = doc(collection(db, "users", user.uid, "pro_social_logs"));
        batch.set(docRef, { date: dateStr, cost: parseFloat(costStr), type: cols[2] || "Family", activityType: cols[3] || "", location: cols[4] || "", participants: cols[5] || "", createdAt: new Date().toISOString() });
        count++;
      });
      await batch.commit();
      toast({ title: "Import Successful", description: `Imported ${count} records.` });
      setPasteContent("");
      handleTabChange("history");
    } catch (error: any) {
      toast({ title: "Import Failed", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveLog = async () => {
    if (!user || !db) return;
    setIsSaving(true)
    try {
      const newSettings = { ...settings };
      let settingsChanged = false;
      if (formData.type && !settings.groupTypes.includes(formData.type)) {
        newSettings.groupTypes.push(formData.type);
        settingsChanged = true;
      }
      if (formData.activityType && !settings.activityTypes.includes(formData.activityType)) {
        newSettings.activityTypes.push(formData.activityType);
        settingsChanged = true;
      }
      if (settingsChanged) await saveSettingsToDb(newSettings);
      
      let dateToSave = formData.date;
      const parsedFormDataDate = new Date(formData.date);
      if (isNaN(parsedFormDataDate.getTime())) dateToSave = new Date().toISOString().split('T')[0];
      
      const logDataToSave = { date: dateToSave, cost: Number(formData.cost), type: formData.type, activityType: formData.activityType, location: formData.location, participants: formData.participants, updatedAt: new Date().toISOString() };
      
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "pro_social_logs", editingId), logDataToSave);
        toast({ title: "Activity Updated" });
      } else {
        await addDoc(collection(db, "users", user.uid, "pro_social_logs"), { ...logDataToSave, createdAt: new Date().toISOString() });
        toast({ title: "Activity Logged" });
      }
      resetForm();
      handleTabChange("history")
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !user) return <div className="h-screen w-full flex items-center justify-center font-black">Mindful...</div>;

  const totalCost = allEntries?.reduce((acc, log) => acc + (Number(log.cost) || 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex h-20 shrink-0 items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Pro-Social</h2>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Users className="h-3 w-3" /> Activity Log</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full space-y-8 p-4 sm:p-8 pt-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-6xl mx-auto">
          <div className="flex justify-center mb-4 sm:mb-8 sticky top-20 z-20 backdrop-blur-sm py-4 bg-white/50">
            <TabsList className="bg-slate-100 rounded-full h-auto sm:h-12 p-1.5 px-2.5 border flex-wrap sm:flex-nowrap">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-black px-4 sm:px-6 py-2 sm:py-2.5"><PlusCircle className="h-4 w-4 mr-2" />{editingId ? 'Edit' : 'New'}</TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-black px-4 sm:px-6 py-2 sm:py-2.5"><History className="h-4 w-4 mr-2" /> History</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full text-xs font-black px-4 sm:px-6 py-2 sm:py-2.5"><Settings className="h-4 w-4 mr-2" /> Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-entry" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 sm:p-10">
                <CardTitle className="text-2xl sm:text-3xl font-black flex items-center gap-3.5"><Users className="h-7 w-7" /> {editingId ? 'Edit Activity' : 'New Activity'}</CardTitle>
                <CardDescription className="text-indigo-100/90 pt-1">Log your positive social engagements here.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Date</Label><Input type="date" className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-5 shadow-inner" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Cost</Label><div className="relative"><DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type="number" placeholder="0.00" className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold pl-12 pr-5 shadow-inner" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} /></div></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Group Type</Label><Select onValueChange={(v) => setFormData({...formData, type: v})} value={formData.type}><SelectTrigger className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-5 shadow-inner"><SelectValue placeholder="Family, Friends..." /></SelectTrigger><SelectContent className="rounded-2xl border-slate-100 shadow-2xl shadow-slate-500/10">{settings.groupTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <Separator className="bg-slate-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Activity</Label><Select onValueChange={(v) => setFormData({...formData, activityType: v})} value={formData.activityType}><SelectTrigger className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-5 shadow-inner"><SelectValue placeholder="Entertainment..." /></SelectTrigger><SelectContent className="rounded-2xl border-slate-100 shadow-2xl shadow-slate-500/10">{settings.activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Location</Label><div className="relative"><MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="e.g. Mile High Stadium" className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold pl-12 pr-5 shadow-inner" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div></div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Participants</Label><Input placeholder="Who joined you?" className="h-14 rounded-2xl bg-slate-50/80 border-2 border-slate-100 font-bold px-5 shadow-inner" value={formData.participants} onChange={(e) => setFormData({...formData, participants: e.target.value})} /></div>
                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                  {editingId && <Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl font-bold text-lg">Cancel</Button>}
                  <Button className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl shadow-indigo-500/30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white" onClick={handleSaveLog} disabled={isSaving}>{isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />} {editingId ? 'Update Activity' : 'Save Activity'}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-2 border-slate-100 bg-white shadow-2xl shadow-slate-500/10 rounded-[2.5rem]"><CardContent className="p-4 flex items-center justify-between"><p className="text-sm font-bold uppercase text-slate-500 tracking-widest">Total Spend</p><p className="text-2xl font-black text-slate-900">${totalCost.toFixed(2)}</p></CardContent></Card>
            {isDesktop ? (
              <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80"><TableRow className="border-b-2 border-slate-100"><TableHead className="font-bold text-[10px] uppercase w-28">Date</TableHead><TableHead className="font-bold text-[10px] uppercase w-24 text-right">Cost</TableHead><TableHead className="font-bold text-[10px] uppercase">Type</TableHead><TableHead className="font-bold text-[10px] uppercase">Activity</TableHead><TableHead className="font-bold text-[10px] uppercase">Location</TableHead><TableHead className="font-bold text-[10px] uppercase">Participants</TableHead><TableHead className="w-24 text-center">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>{historyEntries?.map((entry: ProSocialActivity) => (<TableRow key={entry.id} className="group hover:bg-slate-50/50"><TableCell className="font-mono font-bold text-indigo-600">{entry.date}</TableCell><TableCell className="font-mono text-right font-bold">${Number(entry.cost).toFixed(2)}</TableCell><TableCell><Badge variant="outline">{entry.type}</Badge></TableCell><TableCell className="text-slate-600">{entry.activityType}</TableCell><TableCell className="text-slate-600">{entry.location}</TableCell><TableCell className="text-muted-foreground italic">{entry.participants}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="h-8 w-8 rounded-lg"><Edit2 className="h-4 w-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the activity on <span className="font-bold">{entry.date}</span>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteActivity(entry.id!, entry.date)} className="rounded-xl bg-destructive">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></TableCell></TableRow>))}
                  </TableBody>
                </Table>
                <InfiniteScrollTrigger onIntersect={() => loadMore?.()} isLoading={loadingHistory} hasMore={!!hasMore} />
              </Card>
            ) : (
              <div className="space-y-4">
                {historyEntries?.map((entry: ProSocialActivity) => (
                  <Card key={entry.id} className="rounded-[2.5rem] shadow-2xl shadow-slate-500/10 border-2 border-slate-100 relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10">
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
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription>This action will permanently delete this activity.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-lg h-12">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteActivity(entry.id!, entry.date)} className="rounded-lg h-12 bg-destructive">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-12">
                                <p className="font-bold text-indigo-600 text-lg">{entry.date}</p>
                                <p className="font-black text-2xl text-slate-800">{entry.activityType}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/>{entry.location}</p>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0">
                                <p className="font-black text-2xl text-slate-800">${Number(entry.cost).toFixed(2)}</p>
                                <Badge variant="secondary" className="mt-1">{entry.type}</Badge>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground pt-3 italic"><span className="font-bold not-italic text-slate-500">With:</span> {entry.participants}</p>
                    </CardContent>
                </Card>
                ))}
                <InfiniteScrollTrigger onIntersect={() => loadMore?.()} isLoading={loadingHistory} hasMore={!!hasMore} />
                {(!historyEntries || historyEntries.length === 0) && !loadingHistory && (<p className="text-center py-10 text-slate-500 italic">No activities logged.</p>)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] bg-white"><CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Users className="h-5 w-5 text-primary" /> Group Types</CardTitle><CardDescription className="pt-1">Manage your common social circles.</CardDescription></CardHeader><CardContent className="p-8 pt-0 space-y-4"><div className="flex flex-wrap gap-2">{settings.groupTypes.map((item) => (<Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200"><button onClick={() => removeSettingItem('group', item)} className="mr-1.5 hover:text-red-500 rounded-full"><X className="h-3 w-3" /></button>{item}</Badge>))}</div><div className="flex gap-3"><Input placeholder="Add group..." value={newGroupType} onChange={(e) => setNewGroupType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('group')} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 shadow-inner px-4 font-bold" /><Button size="icon" onClick={() => addSettingItem('group')} className="h-12 w-12 rounded-xl"><Plus className="h-5 w-5" /></Button></div></CardContent></Card>
                <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-500/10 rounded-[2.5rem] bg-white"><CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Tag className="h-5 w-5 text-primary" /> Activity Types</CardTitle><CardDescription className="pt-1">Manage your frequent activity categories.</CardDescription></CardHeader><CardContent className="p-8 pt-0 space-y-4"><div className="flex flex-wrap gap-2">{settings.activityTypes.map((item) => (<Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200"><button onClick={() => removeSettingItem('activity', item)} className="mr-1.5 hover:text-red-500 rounded-full"><X className="h-3 w-3" /></button>{item}</Badge>))}</div><div className="flex gap-3"><Input placeholder="Add activity..." value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('activity')} className="h-12 rounded-xl bg-slate-50/80 border-2 border-slate-100 shadow-inner px-4 font-bold" /><Button size="icon" onClick={() => addSettingItem('activity')} className="h-12 w-12 rounded-xl"><Plus className="h-5 w-5" /></Button></div></CardContent></Card>
             </div>
             <Card className="border-2 border-slate-700/50 shadow-2xl shadow-slate-800/20 rounded-[2.5rem] bg-slate-800 text-white"><CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3 text-white"><Upload className="h-5 w-5" /> Import Data</CardTitle><CardDescription className="text-slate-400 pt-1">Paste Excel or CSV data. Format: Date, Cost, Type, Activity, Location, Participants</CardDescription></CardHeader><CardContent className="p-8 pt-0 space-y-4"><Textarea value={pasteContent} onChange={(e) => setPasteContent(e.target.value)} placeholder={'9/15/24\t$0.00\tFamily\tEntertainment\tMile High Stadium\tChristina\n9/22/24\t$54.00\tFriends\tRestaurant\tHapa Sushi\tMark, Jess, & Ryan'} className="min-h-[140px] bg-slate-700/50 border-slate-600 text-slate-200 font-mono text-xs rounded-xl p-4" /><Button onClick={handleImportData} disabled={isImporting} className="w-full h-14 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">{isImporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />} Import Records</Button></CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

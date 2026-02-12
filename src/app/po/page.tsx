
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle, CheckCircle2, History, User, FileText, CalendarDays, Settings, Plus, X, Trash2, Edit2, AlertTriangle, PhoneCall, Home, Upload, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addDoc, collection, query, orderBy, doc, getDoc, setDoc, writeBatch, updateDoc, deleteDoc } from "firebase/firestore"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useMemoFirebase } from "@/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/firebase/provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface PoInteraction {
  id?: string;
  date: string;
  type: string; // e.g., "office", "home"
  scheduled: boolean;
  poName: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PoLogPage() {
  const { user, db, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Settings State
  const [settings, setSettings] = useState({
    interactionTypes: ["Office", "Home", "Phone Call", "Video Call", "Field Visit"],
    poNames: ["Lynn Matesi", "Michael Bohlen", "John Smith"]
  })
  const [newInteractionType, setNewInteractionType] = useState("")
  const [newPoName, setNewPoName] = useState("")

  // Form State
  const [formData, setFormData] = useState<PoInteraction>({
    date: new Date().toISOString().split('T')[0],
    type: "",
    scheduled: false,
    poName: "",
    notes: ""
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
    router.replace(`/po?${params.toString()}`)
  }

  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "po_interactions"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: recentEntries, isLoading: loadingEntries } = useCollection(entriesQuery);

  // Load Settings
  useEffect(() => {
    async function loadSettings() {
      if (user && db) {
        const docRef = doc(db, "users", user.uid, "config", "po_preferences");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            interactionTypes: Array.isArray(data.interactionTypes) ? data.interactionTypes : prev.interactionTypes,
            poNames: Array.isArray(data.poNames) ? data.poNames : prev.poNames
          }));
        }
      }
    }
    loadSettings();
  }, [user, db]);

  // AUTOMATION LOGIC: Pre-fill based on history
  useEffect(() => {
    async function automateForm() {
      if (!user || !db || !recentEntries || recentEntries.length === 0 || editingId) return; 

      const latest = recentEntries[0];
      
      if (latest && latest.date) { 
        const lastDate = new Date(latest.date);
        if (isNaN(lastDate.getTime())) { 
          console.error("Invalid date from latest entry (setting to today):", latest.date);
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
          }));
          return; 
        }

        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1); // Suggest next day as a placeholder

        setFormData(prev => ({
          ...prev,
          date: nextDate.toISOString().split('T')[0],
          type: latest.type || "",
          poName: latest.poName || "",
          scheduled: false, // Assume not scheduled for next auto-fill
          notes: ""
        }));
      } else if (!latest && recentEntries.length === 0) {
        setFormData(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0],
          type: "",
          scheduled: false,
          poName: "",
          notes: ""
        }));
      }
    }

    if (activeTab === "new-entry" && !loadingEntries) {
      automateForm();
    }
  }, [user, db, recentEntries, activeTab, loadingEntries, editingId]);

  const saveSettingsToDb = async (newSettings: typeof settings) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, "users", user.uid, "config", "po_preferences"), newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to auto-save settings", error);
    }
  };

  const addSettingItem = (type: 'interaction' | 'po') => {
    const val = type === 'interaction' ? newInteractionType : newPoName;
    if (!val.trim()) return;
    
    const newSettings = { ...settings };
    if (type === 'interaction') {
      if (!newSettings.interactionTypes.includes(val.trim())) {
        newSettings.interactionTypes = [...newSettings.interactionTypes, val.trim()];
        saveSettingsToDb(newSettings);
        toast({ title: "Interaction Type Added" });
      }
      setNewInteractionType("");
    } else {
      if (!newSettings.poNames.includes(val.trim())) {
        newSettings.poNames = [...newSettings.poNames, val.trim()];
        saveSettingsToDb(newSettings);
        toast({ title: "PO Name Added" });
      }
      setNewPoName("");
    }
  };

  const removeSettingItem = (type: 'interaction' | 'po', item: string) => {
    const newSettings = { ...settings };
    if (type === 'interaction') {
      newSettings.interactionTypes = newSettings.interactionTypes.filter(i => i !== item);
    } else {
      newSettings.poNames = newSettings.poNames.filter(i => i !== item);
    }
    saveSettingsToDb(newSettings);
    toast({ title: "Item Removed" });
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: "",
      scheduled: false,
      poName: "",
      notes: ""
    });
    setEditingId(null);
  };

  const handleEdit = (entry: PoInteraction) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    handleTabChange("new-entry");
  };

  const handleDeleteInteraction = async (id: string, interactionDate: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "po_interactions", id));
      toast({ title: "Interaction Deleted", description: `Interaction on ${interactionDate} removed.` });
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
        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid date format in import row, skipping:", row);
          toast({ title: "Import Warning", description: `Skipped row with invalid date: ${row.substring(0, 50)}...`, variant: "destructive" });
          return; // Skip this row
        }
        dateStr = parsedDate.toISOString().split('T')[0]; // Ensure valid YYYY-MM-DD

        const scheduledBool = cols[2]?.toLowerCase() === 'yes' || cols[2]?.toLowerCase() === 'true';

        const docRef = doc(collection(db, "users", user.uid, "po_interactions"));
        batch.set(docRef, {
          date: dateStr,
          type: cols[1] || "",
          scheduled: scheduledBool,
          poName: cols[3] || "",
          notes: cols[4] || "",
          createdAt: new Date().toISOString()
        });
        count++;
      });

      await batch.commit();
      toast({ title: "Import Successful", description: `Imported ${count} records.` });
      setPasteContent("");
      handleTabChange("history");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Import Failed", description: "Check format and try again.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveLog = async () => {
    if (!user || !db) return;
    setIsSaving(true)
    try {
      // 1. Learn new types automatically
      const newSettings = { ...settings };
      let settingsChanged = false;

      if (formData.type && !settings.interactionTypes.includes(formData.type)) {
        newSettings.interactionTypes.push(formData.type);
        settingsChanged = true;
      }
      if (formData.poName && !settings.poNames.includes(formData.poName)) {
        newSettings.poNames.push(formData.poName);
        settingsChanged = true;
      }

      if (settingsChanged) {
        await saveSettingsToDb(newSettings);
      }

      // 2. Validate and Save/Update Log
      let dateToSave = formData.date;
      const parsedFormDataDate = new Date(formData.date);
      if (isNaN(parsedFormDataDate.getTime())) {
        console.error("Invalid date in form data, defaulting to today:", formData.date);
        dateToSave = new Date().toISOString().split('T')[0]; // Default to today if form date is invalid
      }

      const logDataToSave = {
        date: dateToSave,
        type: formData.type,
        scheduled: formData.scheduled,
        poName: formData.poName,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "po_interactions", editingId), logDataToSave);
        toast({ title: "Interaction Updated", description: "PO interaction record updated." });
      } else {
        await addDoc(collection(db, "users", user.uid, "po_interactions"), {
          ...logDataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Interaction Logged", description: "New PO interaction saved." });
      }
      
      resetForm();
      handleTabChange("history")
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">PO Interactions</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-[1200px] mx-auto">
          <div className="mb-6 flex justify-center sm:justify-start">
            <TabsList className="bg-slate-100 rounded-full h-12 p-1 w-full sm:w-auto">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                {editingId !== null ? <Edit2 className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} 
                {editingId !== null ? 'Edit Interaction' : 'New Interaction'}
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                <History className="h-4 w-4 mr-2" /> Interaction History
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                <Settings className="h-4 w-4 mr-2" /> Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-entry" className="mt-0 space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <CardTitle className="text-3xl font-black flex items-center gap-3"><User className="h-8 w-8" /> {editingId !== null ? 'Edit Interaction Details' : 'New Interaction Details'}</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Date</Label>
                    <Input type="date" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                    <div className="relative">
                      <Input 
                        value={formData.type} 
                        onChange={(e) => setFormData({...formData, type: e.target.value})} 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-inner pr-12"
                        placeholder="Office, Home, Phone..."
                      />
                      <Select onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="absolute right-0 top-0 h-14 w-12 border-none bg-transparent hover:bg-slate-100 rounded-r-2xl">
                          <span className="sr-only">Open</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {settings.interactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Scheduled?</Label>
                    <div className="flex items-center justify-between h-14 bg-slate-50 rounded-2xl border px-6">
                      <Label className="text-xs font-bold">{formData.scheduled ? 'Yes' : 'No'}</Label>
                      <Switch checked={formData.scheduled} onCheckedChange={(v) => setFormData({...formData, scheduled: v})} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-6 md:grid-cols-1">
                   <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Probation Officer</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        value={formData.poName} 
                        onChange={(e) => setFormData({...formData, poName: e.target.value})} 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12 shadow-inner pr-12"
                        placeholder="Lynn Matesi, Michael Bohlen..."
                      />
                      <Select onValueChange={(v) => setFormData({...formData, poName: v})}>
                        <SelectTrigger className="absolute right-0 top-0 h-14 w-12 border-none bg-transparent hover:bg-slate-100 rounded-r-2xl">
                          <span className="sr-only">Open</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {settings.poNames.map(po => <SelectItem key={po} value={po}>{po}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Notes</Label>
                  <Textarea placeholder="Details of the interaction..." className="min-h-[120px] rounded-3xl bg-slate-50 p-6 text-lg" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                  {editingId !== null && (
                    <Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl font-bold px-8">Cancel</Button>
                  )}
                  <Button className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl" onClick={handleSaveLog} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />} {editingId !== null ? 'Update Interaction' : 'Save Interaction'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-1">
              <Card className="border-none shadow-sm bg-blue-50/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-blue-600">Total Interactions</p>
                    <p className="text-2xl font-black">{recentEntries?.length || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase w-24">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Type</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-center">Scheduled</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">P.O.</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Notes</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries?.map((entry: PoInteraction) => (
                    <TableRow 
                      key={entry.id} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="text-xs font-mono font-bold text-primary">{entry.date}</TableCell>
                      <TableCell className="text-xs font-bold">{entry.type}</TableCell>
                      <TableCell className="text-center">
                        {entry.scheduled ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-400 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">{entry.poName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground italic truncate max-w-[200px]">{entry.notes}</TableCell>
                      <TableCell className="text-center">
                         <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5">
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
                                        This will permanently remove the PO interaction record for <span className="font-bold text-slate-900">{entry.poName}</span> on <span className="font-bold text-slate-900">{entry.date}</span>. This action cannot be undone.
                                     </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                     <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDeleteInteraction(entry.id!, entry.date)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                        Delete Record
                                     </AlertDialogAction>
                                  </AlertDialogFooter>
                               </AlertDialogContent>
                            </AlertDialog>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentEntries || recentEntries.length === 0) && !loadingEntries && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                        No interactions logged yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                   <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black flex items-center gap-3">
                         <PhoneCall className="h-5 w-5 text-primary" /> Interaction Types
                      </CardTitle>
                      <CardDescription>Manage common ways you interact with your P.O.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="flex flex-wrap gap-2">
                         {settings.interactionTypes.map((item) => (
                            <Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 transition-colors">
                               {item} 
                               <button onClick={() => removeSettingItem('interaction', item)} className="hover:text-red-500">
                                  <X className="h-3 w-3" />
                               </button>
                            </Badge>
                         ))}
                      </div>
                      <div className="flex gap-3">
                         <Input placeholder="Add type..." value={newInteractionType} onChange={(e) => setNewInteractionType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('interaction')} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                         <Button size="icon" onClick={() => addSettingItem('interaction')} className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20"><Plus className="h-5 w-5" /></Button>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                   <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black flex items-center gap-3">
                         <User className="h-5 w-5 text-primary" /> P.O. Names
                      </CardTitle>
                      <CardDescription>Manage the names of your Probation Officers.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="flex flex-wrap gap-2">
                         {settings.poNames.map((item) => (
                            <Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 transition-colors">
                               {item}
                               <button onClick={() => removeSettingItem('po', item)} className="hover:text-red-500">
                                  <X className="h-3 w-3" />
                               </button>
                            </Badge>
                         ))}
                      </div>
                      <div className="flex gap-3">
                         <Input placeholder="Add P.O. name..." value={newPoName} onChange={(e) => setNewPoName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('po')} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                         <Button size="icon" onClick={() => addSettingItem('po')} className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20"><Plus className="h-5 w-5" /></Button>
                      </div>
                   </CardContent>
                </Card>
             </div>

             <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
               <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-xl font-black flex items-center gap-3 text-white">
                   <Upload className="h-5 w-5" /> Import Data
                 </CardTitle>
                 <CardDescription className="text-slate-400">
                   Paste Excel or CSV data. Format: <strong>Date | Type | Scheduled (yes/no) | P.O. Name | Notes</strong>
                 </CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-4 space-y-4">
                 <Textarea 
                   value={pasteContent} 
                   onChange={(e) => setPasteContent(e.target.value)} 
                   placeholder={`7/8/2024\toffice\tyes\tLynn Matesi\tinitial visit, sign probation documents\n...`}
                   className="min-h-[150px] bg-slate-800 border-none text-slate-200 font-mono text-xs rounded-xl p-4"
                 />
                 <Button onClick={handleImportData} disabled={false} className="w-full h-14 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                   {isImporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />} Import Records
                 </Button>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

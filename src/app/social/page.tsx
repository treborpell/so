
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle, CheckCircle2, History, Users, MapPin, Tag, Settings, Plus, X, Trash2, Upload, ChevronDown, Edit2, AlertTriangle } from "lucide-react"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ProSocialActivity {
  id?: string; // Optional for new entries
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

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "new-entry")
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Settings State
  const [settings, setSettings] = useState({
    groupTypes: ["Family", "Friends", "Work Colleagues", "Community", "Support Group"],
    activityTypes: ["Entertainment", "Restaurant", "Outdoor", "Sport", "Cultural", "Volunteering"]
  })
  const [newGroupType, setNewGroupType] = useState("")
  const [newActivityType, setNewActivityType] = useState("")

  // Form State
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

  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "pro_social_logs"), orderBy("date", "desc"));
  }, [db, user]);
  
  const { data: recentEntries, isLoading: loadingEntries } = useCollection(entriesQuery);

  // Load Settings
  useEffect(() => {
    async function loadSettings() {
      if (user && db) {
        const docRef = doc(db, "users", user.uid, "config", "pro_social_preferences");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            groupTypes: Array.isArray(data.groupTypes) ? data.groupTypes : prev.groupTypes,
            activityTypes: Array.isArray(data.activityTypes) ? data.activityTypes : prev.activityTypes
          }));
        }
      }
    }
    loadSettings();
  }, [user, db]);

  // AUTOMATION LOGIC: Pre-fill based on history
  useEffect(() => {
    async function automateForm() {
      if (!user || !db || !recentEntries || recentEntries.length === 0 || editingId !== null) return; // Don't automate if editing

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
        nextDate.setDate(lastDate.getDate() + 7);

        setFormData(prev => ({
          ...prev,
          date: nextDate.toISOString().split('T')[0],
          type: latest.type || "",
          activityType: latest.activityType || ""
        }));
      } else if (!latest && recentEntries.length === 0) {
        setFormData(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0],
          type: "",
          activityType: ""
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
    setFormData({
      date: new Date().toISOString().split('T')[0],
      cost: "0.00",
      type: "",
      activityType: "",
      location: "",
      participants: ""
    });
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
        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid date format in import row, skipping:", row);
          toast({ title: "Import Warning", description: `Skipped row with invalid date: ${row.substring(0, 50)}...`, variant: "destructive" });
          return; // Skip this row
        }
        dateStr = parsedDate.toISOString().split('T')[0]; // Ensure valid YYYY-MM-DD

        const costStr = cols[1]?.replace('$', '').replace(',', '') || "0";
        
        const docRef = doc(collection(db, "users", user.uid, "pro_social_logs"));
        batch.set(docRef, {
          date: dateStr,
          cost: parseFloat(costStr),
          type: cols[2] || "Family",
          activityType: cols[3] || "",
          location: cols[4] || "",
          participants: cols[5] || "",
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

      if (formData.type && !settings.groupTypes.includes(formData.type)) {
        newSettings.groupTypes.push(formData.type);
        settingsChanged = true;
      }
      if (formData.activityType && !settings.activityTypes.includes(formData.activityType)) {
        newSettings.activityTypes.push(formData.activityType);
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
        cost: Number(formData.cost),
        type: formData.type,
        activityType: formData.activityType,
        location: formData.location,
        participants: formData.participants,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "pro_social_logs", editingId), logDataToSave);
        toast({ title: "Activity Updated", description: "Pro-social activity record updated." });
      } else {
        await addDoc(collection(db, "users", user.uid, "pro_social_logs"), {
          ...logDataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Activity Logged", description: "Pro-social activity saved." });
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

  const totalCost = recentEntries?.reduce((acc, log) => acc + (Number(log.cost) || 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Pro-Social Activities</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-[1200px] mx-auto">
          <div className="mb-6 flex justify-center sm:justify-start">
            <TabsList className="bg-slate-100 rounded-full h-12 p-1 w-full sm:w-auto">
              <TabsTrigger value="new-entry" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                {editingId !== null ? <Edit2 className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} 
                {editingId !== null ? 'Edit Activity' : 'New Activity'}
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                <History className="h-4 w-4 mr-2" /> Activity Log
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full text-xs font-bold px-8 flex-1 sm:flex-none">
                <Settings className="h-4 w-4 mr-2" /> Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-entry" className="mt-0 space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <CardTitle className="text-3xl font-black flex items-center gap-3"><Users className="h-8 w-8" /> {editingId !== null ? 'Edit Activity Details' : 'New Activity Details'}</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Date</Label>
                    <Input type="date" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Est. Cost</Label>
                    <Input type="number" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Group Type</Label>
                    <div className="relative">
                      <Input 
                        value={formData.type} 
                        onChange={(e) => setFormData({...formData, type: e.target.value})} 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-inner pr-12"
                        placeholder="Family, Friends..."
                      />
                      <Select onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="absolute right-0 top-0 h-14 w-12 border-none bg-transparent hover:bg-slate-100 rounded-r-2xl">
                          <span className="sr-only">Open</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {settings.groupTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-6 md:grid-cols-2">
                   <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Activity Type</Label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        value={formData.activityType} 
                        onChange={(e) => setFormData({...formData, activityType: e.target.value})} 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12 shadow-inner pr-12"
                        placeholder="Entertainment, Outdoor..."
                      />
                      <Select onValueChange={(v) => setFormData({...formData, activityType: v})}>
                        <SelectTrigger className="absolute right-0 top-0 h-14 w-12 border-none bg-transparent hover:bg-slate-100 rounded-r-2xl">
                          <span className="sr-only">Open</span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {settings.activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="e.g. Mile High Stadium" className="h-14 rounded-2xl bg-slate-50 font-bold pl-12" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Participants</Label>
                  <Input placeholder="Who joined you?" className="h-14 rounded-2xl bg-slate-50 font-bold" value={formData.participants} onChange={(e) => setFormData({...formData, participants: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                  {editingId !== null && (
                    <Button variant="outline" onClick={resetForm} className="h-16 rounded-2xl font-bold px-8">Cancel</Button>
                  )}
                  <Button className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl" onClick={handleSaveLog} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />} {(editingId !== null) ? 'Update Activity' : 'Save Activity'}
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
                    <p className="text-[10px] font-bold uppercase text-blue-600">Total Pro-Social Spend</p>
                    <p className="text-2xl font-black">${totalCost.toFixed(2)}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase w-24">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase w-20 text-right">Cost</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Type</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Activity</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Location</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Participants</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries?.map((entry: ProSocialActivity) => (
                    <TableRow 
                      key={entry.id} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="text-xs font-mono font-bold text-primary">{entry.date}</TableCell>
                      <TableCell className="font-mono text-xs text-right font-bold">${Number(entry.cost).toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-bold">{entry.type}</TableCell>
                      <TableCell className="text-xs text-slate-600">{entry.activityType}</TableCell>
                      <TableCell className="text-xs text-slate-600">{entry.location}</TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{entry.participants}</TableCell>
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
                                        This will permanently remove the pro-social activity record for <span className="font-bold text-slate-900">{entry.date}</span>. This action cannot be undone.
                                     </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                     <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDeleteActivity(entry.id!, entry.date)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
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
                      <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">
                        No activities logged yet.
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
                         <Users className="h-5 w-5 text-primary" /> Group Types
                      </CardTitle>
                      <CardDescription>Manage your common social circles.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="flex flex-wrap gap-2">
                         {settings.groupTypes.map((item) => (
                            <Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 transition-colors">
                               {item} 
                               <button onClick={() => removeSettingItem('group', item)} className="hover:text-red-500">
                                  <X className="h-3 w-3" />
                               </button>
                            </Badge>
                         ))}
                      </div>
                      <div className="flex gap-3">
                         <Input placeholder="Add group type..." value={newGroupType} onChange={(e) => setNewGroupType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('group')} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                         <Button size="icon" onClick={() => addSettingItem('group')} className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20"><Plus className="h-5 w-5" /></Button>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                   <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black flex items-center gap-3">
                         <Tag className="h-5 w-5 text-primary" /> Activity Types
                      </CardTitle>
                      <CardDescription>Manage your frequent activity categories.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="flex flex-wrap gap-2">
                         {settings.activityTypes.map((item) => (
                            <Badge key={item} variant="secondary" className="px-3 py-1.5 rounded-lg font-bold gap-2 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 transition-colors">
                               {item}
                               <button onClick={() => removeSettingItem('activity', item)} className="hover:text-red-500">
                                  <X className="h-3 w-3" />
                               </button>
                            </Badge>
                         ))}
                      </div>
                      <div className="flex gap-3">
                         <Input placeholder="Add activity type..." value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSettingItem('activity')} className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4 shadow-inner" />
                         <Button size="icon" onClick={() => addSettingItem('activity')} className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20"><Plus className="h-5 w-5" /></Button>
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
                   Paste Excel or CSV data. Format: <strong>Date | Cost | Type | Activity | Location | Participants</strong>
                 </CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-4 space-y-4">
                 <Textarea 
                   value={pasteContent} 
                   onChange={(e) => setPasteContent(e.target.value)} 
                   placeholder={`9/15/24\t$0.00\tFamily\tEntertainment\tMile High Stadium\tChristina\n...`}
                   className="min-h-[150px] bg-slate-800 border-none text-slate-200 font-mono text-xs rounded-xl p-4"
                 />
                 <Button onClick={handleImportData} disabled={isImporting} className="w-full h-14 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
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

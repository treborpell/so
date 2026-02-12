
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Save, 
  Loader2, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle
} from "lucide-react"
import { useAuth } from "@/firebase/provider"
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
}

// Multi-select component with automated learning
function QuickSelect({ 
  label, 
  options, 
  selected = [], 
  onChange,
  onNewItem
}: { 
  label: string, 
  options: string[], 
  selected: string[], 
  onChange: (items: string[]) => void,
  onNewItem: (item: string) => void
}) {
  const [customValue, setCustomValue] = useState("");

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      if (!selected.includes(trimmed)) {
        onChange([...selected, trimmed]);
      }
      if (!options.includes(trimmed)) {
        onNewItem(trimmed);
      }
      setCustomValue("");
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">{label}</Label>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-2xl bg-slate-50 border-2 border-slate-100/50 shadow-inner">
        {selected.length === 0 && <p className="text-[10px] text-slate-300 font-bold italic py-1 px-2">Nothing selected...</p>}
        {selected.map(item => (
          <Badge key={item} className="px-3 py-1.5 rounded-xl font-bold bg-primary text-white flex items-center gap-2 border-none">
            {item} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleItem(item)} />
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.filter(o => !selected.includes(o)).map(option => (
          <Button key={option} variant="outline" size="sm" className="rounded-xl font-bold text-[10px] h-8 border-slate-200" onClick={() => toggleItem(option)}>
             <Plus className="h-3 w-3 mr-1" /> {option}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input 
          placeholder={`Add ${label.toLowerCase()}...`}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          className="h-10 rounded-xl bg-white border-slate-100 font-medium px-4 text-xs"
        />
        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={addCustom} type="button">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getStartOfWeek(date: Date, preferredDay: number) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day < preferredDay ? preferredDay - 7 : preferredDay);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function JournalPage() {
  const { user, db, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null)
  const [preferences, setPreferences] = useState<any>({ preferredDay: "2", defaultEvents: [], defaultFeelings: [] })
  const [weekData, setWeekData] = useState<any>({ weeklyFields: {}, days: {} })
  const [isSaving, setIsSaving] = useState(false)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    async function loadPrefs() {
      if (user && db) {
        const docRef = doc(db, "users", user.uid, "config", "preferences");
        const snap = await getDoc(docRef);
        const prefs = snap.exists() ? snap.data() : { preferredDay: "2", defaultEvents: [], defaultFeelings: [] };
        setPreferences(prefs);
        if (!currentWeekStart) {
          setCurrentWeekStart(getStartOfWeek(new Date(), Number(prefs.preferredDay)));
        }
      }
    }
    loadPrefs();
  }, [user, db, currentWeekStart]);

  useEffect(() => {
    if (!user || !db || !currentWeekStart) return;
    const weekId = getLocalDateString(currentWeekStart);
    const docRef = doc(db, "users", user.uid, "journal_weeks", weekId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      setWeekData(snap.exists() ? snap.data() : { weeklyFields: {}, days: {} });
    });
    return () => unsubscribe();
  }, [user, db, currentWeekStart]);

  const handleLearnNewItem = async (type: 'events' | 'feelings', item: string) => {
    if (!user || !db) return;
    const prefRef = doc(db, "users", user.uid, "config", "preferences");
    const field = type === 'events' ? 'defaultEvents' : 'defaultFeelings';
    try { await updateDoc(prefRef, { [field]: arrayUnion(item) }); } catch (e) { console.error(e); }
  };

  const handleDayFieldChange = (dateKey: string, field: string, value: any) => {
    setWeekData((prev: any) => ({ ...prev, days: { ...prev.days, [dateKey]: { ...(prev.days[dateKey] || {}), [field]: value } } }));
  };

  const handleWeeklyFieldChange = (key: string, field: 'checked' | 'text', value: any) => {
    setWeekData((prev: any) => ({ ...prev, weeklyFields: { ...prev.weeklyFields, [key]: { ...(prev.weeklyFields[key] || {}), [field]: value } } }));
  };

  const saveWeek = async () => {
    if (!user || !db || !currentWeekStart) return;
    setIsSaving(true);
    try {
      const weekId = getLocalDateString(currentWeekStart);
      await setDoc(doc(db, "users", user.uid, "journal_weeks", weekId), weekData, { merge: true });
      toast({ title: "Journal Synced" });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const weekDates = useMemo(() => {
    if (!currentWeekStart) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  if (authLoading || !user || !currentWeekStart) {
    return <div className="h-full flex items-center justify-center font-black">Syncing...</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50">
      <header className="flex h-20 shrink-0 items-center justify-between border-b bg-white px-8 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h2 className="text-xl font-black tracking-tight">Daily Journal</h2>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Week of {currentWeekStart.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-xl border-2" onClick={() => setCurrentWeekStart(d => new Date(d!.setDate(d!.getDate() - 7)))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-2" onClick={() => setCurrentWeekStart(d => new Date(d!.setDate(d!.getDate() + 7)))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button onClick={saveWeek} disabled={isSaving} className="rounded-xl font-black shadow-lg shadow-primary/20 px-6">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
          </Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 pb-40">
        <div className="grid gap-4">
          {weekDates.map((date) => {
            const dateKey = getLocalDateString(date);
            const isToday = todayStr === dateKey;
            const isOpen = expandedDay === dateKey;
            const data = weekData.days?.[dateKey] || {};
            
            // Calculate hasData outside of useMemo in the loop
            const hasData = 
              data.sThoughts || data.sFantasies || data.sBehaviors || data.thoughts ||
              (data.selectedEvents && data.selectedEvents.length > 0) ||
              (data.selectedFeelings && data.selectedFeelings.length > 0);

            const summaryItems = [...(data.selectedFeelings || []), ...(data.selectedEvents || [])];

            return (
              <Card key={dateKey} className={`border-none shadow-sm transition-all duration-300 ${isToday ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}>
                <Collapsible open={isOpen} onOpenChange={() => setExpandedDay(isOpen ? null : dateKey)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] uppercase border-2 ${isToday ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-slate-100 transition-colors'}`}>
                          <span>{WEEKDAYS[date.getDay()].substring(0, 3)}</span>
                          <span className="text-lg leading-none">{date.getDate()}</span>
                        </div>
                        <h3 className={`font-black text-lg ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>{WEEKDAYS[date.getDay()]} Log</h3>
                        {!isOpen && hasData && (
                          <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 font-bold border-none text-[10px] py-1 shadow-sm">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Completed
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {!isOpen && hasData && (
                          <div className="hidden md:flex items-center gap-2">
                            {summaryItems.slice(0, 3).map(item => (
                              <Badge key={item} variant="outline" className="text-slate-500 font-medium text-[10px] rounded-md">{item}</Badge>
                            ))}
                            {summaryItems.length > 3 && <span className="text-slate-400 font-bold text-xs">...</span>}
                          </div>
                        )}
                        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-8 pt-0 space-y-10 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Separator />
                      <div className="grid gap-10 md:grid-cols-2">
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">S. Thoughts</Label>
                              <Input placeholder="..." value={data.sThoughts || ""} onChange={(e) => handleDayFieldChange(dateKey, 'sThoughts', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 shadow-inner" />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">S. Fantasies</Label>
                              <Input placeholder="..." value={data.sFantasies || ""} onChange={(e) => handleDayFieldChange(dateKey, 'sFantasies', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 shadow-inner" />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">S. Behaviors</Label>
                              <Input placeholder="..." value={data.sBehaviors || ""} onChange={(e) => handleDayFieldChange(dateKey, 'sBehaviors', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 shadow-inner" />
                           </div>
                        </div>
                        <div className="space-y-10">
                           <QuickSelect 
                              label="Daily Events" 
                              options={preferences.defaultEvents || []} 
                              selected={data.selectedEvents || []} 
                              onChange={(items) => handleDayFieldChange(dateKey, 'selectedEvents', items)}
                              onNewItem={(item) => handleLearnNewItem('events', item)}
                           />
                           <QuickSelect 
                              label="Feelings" 
                              options={preferences.defaultFeelings || []} 
                              selected={data.selectedFeelings || []} 
                              onChange={(items) => handleDayFieldChange(dateKey, 'selectedFeelings', items)}
                              onNewItem={(item) => handleLearnNewItem('feelings', item)}
                           />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Detailed Reflection</Label>
                        <Textarea placeholder="..." value={data.thoughts || ""} onChange={(e) => handleDayFieldChange(dateKey, 'thoughts', e.target.value)} className="min-h-[160px] rounded-3xl bg-slate-50 border-none font-medium p-8 shadow-inner" />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        <div className="pt-10 space-y-4">
           <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] py-1 tracking-widest uppercase">WEEKLY SUMMARY</Badge>
           <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border-b-8 border-primary">
            <CardContent className="p-10 space-y-10">
              {[
                { id: 'minors', label: 'Contact with minors' },
                { id: 'adults', label: 'Inappropriate adults' },
                { id: 'alcohol', label: 'Alcohol' },
                { id: 'drugs', label: 'Drugs' },
                { id: 'police', label: 'Police' },
                { id: 'po', label: 'P.O.' }
              ].map((item) => (
                <div key={item.id} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-xl font-black text-slate-700">{item.label}</Label>
                    <Checkbox checked={weekData.weeklyFields[item.id]?.checked || false} onCheckedChange={(v) => handleWeeklyFieldChange(item.id, 'checked', v)} className="h-8 w-8 rounded-xl border-2" />
                  </div>
                  {weekData.weeklyFields[item.id]?.checked && (
                    <Textarea placeholder="Details..." value={weekData.weeklyFields[item.id].text} onChange={(e) => handleWeeklyFieldChange(item.id, 'text', e.target.value)} className="rounded-2xl bg-slate-50 border-none font-medium p-6 min-h-[100px] shadow-inner animate-in slide-in-from-top-2 duration-300" />
                  )}
                  <Separator className="opacity-50" />
                </div>
              ))}
              <Button onClick={saveWeek} disabled={isSaving} className="w-full h-20 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-[1.01] transition-all">
                {isSaving ? <Loader2 className="h-8 w-8 animate-spin mr-3" /> : "Finalize & Sync Week"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Loader2, DollarSign, CalendarDays, Bell, BellOff, Clock, Plus, X, Heart, ListTodo } from "lucide-react"
import { useAuth } from "@/firebase/provider"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  const { user, db, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [settings, setSettings] = useState({
    defaultCost: "68.25",
    preferredDay: "2",
    reminderFrequency: "daily",
    reminderTime: "20:00",
    defaultEvents: ["Work", "Gym", "Therapy", "Family Time", "Reading"],
    defaultFeelings: ["Grateful", "Anxious", "Neutral", "Productive", "Tired", "Happy", "Stressed"]
  })

  const [newEvent, setNewEvent] = useState("")
  const [newFeeling, setNewFeeling] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    async function loadSettings() {
      if (user && db) {
        const docRef = doc(db, "users", user.uid, "config", "preferences");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            ...prev, 
            ...data,
            defaultEvents: data.defaultEvents || prev.defaultEvents,
            defaultFeelings: data.defaultFeelings || prev.defaultFeelings
          }));
        }
      }
    }
    loadSettings();
  }, [user, db]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Unsupported", description: "Your browser does not support notifications.", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast({ title: "Notifications Enabled", description: "You will now receive program reminders." });
    }
  };

  const handleSave = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid, "config", "preferences"), settings);
      toast({ title: "Preferences Saved", description: "Your settings and journal defaults are updated." });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: 'events' | 'feelings') => {
    const val = type === 'events' ? newEvent : newFeeling;
    if (!val.trim()) return;
    
    if (type === 'events') {
      if (!settings.defaultEvents.includes(val.trim())) {
        setSettings({...settings, defaultEvents: [...settings.defaultEvents, val.trim()]});
      }
      setNewEvent("");
    } else {
      if (!settings.defaultFeelings.includes(val.trim())) {
        setSettings({...settings, defaultFeelings: [...settings.defaultFeelings, val.trim()]});
      }
      setNewFeeling("");
    }
  };

  const removeItem = (type: 'events' | 'feelings', item: string) => {
    if (type === 'events') {
      setSettings({...settings, defaultEvents: settings.defaultEvents.filter(i => i !== item)});
    } else {
      setSettings({...settings, defaultFeelings: settings.defaultFeelings.filter(i => i !== item)});
    }
  };

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center font-black">Syncing...</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/30">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Preferences</h2>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-10 pb-32">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-4xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-4">
            <Settings className="h-10 w-10 text-primary" /> 
            Global Settings
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">Manage your therapeutic program defaults, daily journal reminders, and quick-select options.</p>
        </div>

        <div className="grid gap-10">
          {/* PROGRAM & REMINDERS */}
          <div className="grid gap-10 lg:grid-cols-2">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Session Cost</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="number" 
                      value={settings.defaultCost} 
                      onChange={(e) => setSettings({...settings, defaultCost: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold pl-12 shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Program Day</Label>
                  <Select value={settings.preferredDay} onValueChange={(v) => setSettings({...settings, preferredDay: v})}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold px-6 shadow-inner">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Bell className="h-6 w-6 text-primary" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-8">
                 <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Frequency</Label>
                  <Select value={settings.reminderFrequency} onValueChange={(v) => setSettings({...settings, reminderFrequency: v})}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold px-6 shadow-inner">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Delivery Time</Label>
                  <Input 
                    type="time" 
                    value={settings.reminderTime} 
                    onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold px-6 shadow-inner"
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={requestNotificationPermission}
                  className="w-full h-12 rounded-xl font-bold border-primary/20 text-primary"
                >
                  {notificationPermission === "granted" ? "Notifications Enabled" : "Request Permissions"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* QUICK SELECT OPTIONS */}
          <div className="grid gap-10 lg:grid-cols-2">
            {/* EVENTS */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border-t-8 border-purple-500">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <ListTodo className="h-6 w-6 text-purple-500" />
                  Journal Events
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Default options for your daily event tracking.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {settings.defaultEvents.map((item) => (
                    <Badge key={item} variant="secondary" className="px-4 py-2 rounded-xl font-bold gap-2 bg-purple-50 text-purple-700 border-none hover:bg-purple-100 transition-colors">
                      {item} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => removeItem('events', item)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="New event..." 
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('events')}
                    className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold shadow-inner"
                  />
                  <Button size="icon" className="h-12 w-12 rounded-xl bg-purple-500 shadow-lg shadow-purple-200" onClick={() => addItem('events')}>
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FEELINGS */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border-t-8 border-pink-500">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Heart className="h-6 w-6 text-pink-500" />
                  Journal Feelings
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Default options for your emotional tracking.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {settings.defaultFeelings.map((item) => (
                    <Badge key={item} variant="secondary" className="px-4 py-2 rounded-xl font-bold gap-2 bg-pink-50 text-pink-700 border-none hover:bg-pink-100 transition-colors">
                      {item} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => removeItem('feelings', item)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="New feeling..." 
                    value={newFeeling}
                    onChange={(e) => setNewFeeling(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('feelings')}
                    className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold shadow-inner"
                  />
                  <Button size="icon" className="h-12 w-12 rounded-xl bg-pink-500 shadow-lg shadow-pink-200" onClick={() => addItem('feelings')}>
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex pt-6">
           <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full h-20 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-[1.01] transition-all"
          >
            {isSaving ? <Loader2 className="h-8 w-8 animate-spin mr-3" /> : <Save className="h-8 w-8 mr-3" />} 
            Deploy Settings
          </Button>
        </div>
      </main>
    </div>
  )
}

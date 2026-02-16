'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/firebase/provider'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { FileSearch, Link as LinkIcon, Loader2, ExternalLink, X, LayoutGrid } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import Script from 'next/script'

// --- Type Definitions ---
interface Assignment { name: string; }
interface Section { name: string; assignments: Assignment[]; }
interface Phase { name: string; sections: Section[]; }
interface AssignmentData {
  datePresented?: string;
  dateCompleted?: string;
  googleDocUrl?: string;
  docName?: string;
}
interface AssignmentStatus { [key: string]: AssignmentData; }
interface UiState { openPhases: string[]; openSections: Record<string, string[]>; }

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useAuth()
  const [phases, setPhases] = useState<Phase[]>([])
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>({})
  const [uiState, setUiState] = useState<UiState>({ openPhases: [], openSections: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [isPicking, setIsPicking] = useState<string | null>(null)
  const [gapiLoaded, setGapiLoaded] = useState(false)
  const [gisLoaded, setGisLoaded] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { toast } = useToast()

  const createAssignmentId = (pIdx: number, sIdx: number, aIdx: number) => `p${pIdx}-s${sIdx}-a${aIdx}`

  useEffect(() => {
    // Recover token from session storage if it exists
    const storedToken = sessionStorage.getItem('google_picker_token');
    if (storedToken) setAccessToken(storedToken);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const syllabusDocRef = doc(db, 'users', user.uid, 'data', 'syllabus')
          const statusDocRef = doc(db, 'users', user.uid, 'data', 'assignment_status')
          const uiStateDocRef = doc(db, 'users', user.uid, 'data', 'assignment_ui_state')

          const [syllabusSnap, statusSnap, uiStateSnap] = await Promise.all([
            getDoc(syllabusDocRef),
            getDoc(statusDocRef),
            getDoc(uiStateDocRef)
          ]);

          if (syllabusSnap.exists()) setPhases(syllabusSnap.data().phases)
          if (statusSnap.exists()) setAssignmentStatus(statusSnap.data() as AssignmentStatus)
          if (uiStateSnap.exists()) setUiState(uiStateSnap.data() as UiState)

        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [user])

  const updateAssignmentStatusInFirestore = async (assignmentId: string, newAssignmentData: AssignmentData) => {
      if (!user) return;
      try {
          const statusDocRef = doc(db, 'users', user.uid, 'data', 'assignment_status');
          await setDoc(statusDocRef, { [assignmentId]: newAssignmentData }, { merge: true });
      } catch (error) {
          console.error("Failed to save assignment status:", error);
      }
  }

  const openPicker = (assignmentId: string, token: string) => {
    const pickerCallback = async (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        const documentUrl = doc.url;
        const docName = doc.name;

        const currentData = assignmentStatus[assignmentId] || {};
        const newData: AssignmentData = { ...currentData, googleDocUrl: documentUrl, docName: docName };
        const newFullStatus = { ...assignmentStatus, [assignmentId]: newData };
        setAssignmentStatus(newFullStatus);

        await updateAssignmentStatusInFirestore(assignmentId, newData);
        toast({ title: "Document Attached", description: `"${docName}" has been linked.` });
      }
      setIsPicking(null);
    };

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setMode(window.google.picker.DocsViewMode.GRID)
      .setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "")
      .setCallback(pickerCallback)
      .setTitle("Select Assignment Document")
      .build();

    picker.setVisible(true);
  }

  const handleBrowseDrive = (assignmentId: string) => {
    if (!gapiLoaded || !gisLoaded) {
      toast({ title: "Please wait", description: "Google services are still loading..." });
      return;
    }

    setIsPicking(assignmentId);

    // If we have a token, just open the picker
    if (accessToken) {
      openPicker(assignmentId, accessToken);
      return;
    }

    // Otherwise, request a token first
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
        setIsPicking(null);
        toast({ title: "Configuration Error", description: "Google Client ID is missing.", variant: "destructive" });
        return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            console.error(response);
            setIsPicking(null);
            toast({ title: "Access Denied", description: "Could not get permission to access Google Drive.", variant: "destructive" });
            return;
          }
          setAccessToken(response.access_token);
          sessionStorage.setItem('google_picker_token', response.access_token);
          openPicker(assignmentId, response.access_token);
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error(err);
      setIsPicking(null);
      toast({ title: "Error", description: "Failed to initialize Google login.", variant: "destructive" });
    }
  };

  const handleRemoveDoc = async (assignmentId: string) => {
    const currentData = assignmentStatus[assignmentId] || {};
    const newData: AssignmentData = { ...currentData };
    delete newData.googleDocUrl;
    delete newData.docName;

    const newFullStatus = { ...assignmentStatus, [assignmentId]: newData };
    setAssignmentStatus(newFullStatus);
    await updateAssignmentStatusInFirestore(assignmentId, newData);
    toast({ title: "Link Removed" });
  }

  const handleAssignmentToggle = (assignmentId: string, isCompleted: boolean) => {
    const currentData = assignmentStatus[assignmentId] || {};
    const newDateCompleted = isCompleted ? (currentData.dateCompleted || new Date().toISOString().split('T')[0]) : undefined;
    
    const newData: AssignmentData = { ...currentData, dateCompleted: newDateCompleted };
    if (newData.dateCompleted === undefined) { delete newData.dateCompleted; }

    const newFullStatus = { ...assignmentStatus, [assignmentId]: newData };
    setAssignmentStatus(newFullStatus);
    updateAssignmentStatusInFirestore(assignmentId, newData);
  }

  const handleDateChange = (assignmentId: string, dateType: 'datePresented' | 'dateCompleted', newDate: string) => {
    const currentData = assignmentStatus[assignmentId] || {};
    const newData = { ...currentData, [dateType]: newDate };

    if (!newDate) { delete newData[dateType]; }

    const newFullStatus = { ...assignmentStatus, [assignmentId]: newData };
    setAssignmentStatus(newFullStatus);
    updateAssignmentStatusInFirestore(assignmentId, newData);
  }

  const updateUiStateInFirestore = async (newUiState: UiState) => {
      if (!user) return;
      try {
          const uiStateDocRef = doc(db, 'users', user.uid, 'data', 'assignment_ui_state');
          await setDoc(uiStateDocRef, newUiState, { merge: true });
      } catch (error) {
          console.error("Failed to save UI state:", error);
      }
  }

  const handlePhaseToggle = (newOpenPhases: string[]) => {
      const newUiState = { ...uiState, openPhases: newOpenPhases };
      setUiState(newUiState);
      updateUiStateInFirestore(newUiState);
  }

  const handleSectionToggle = (phaseId: string, newOpenSections: string[]) => {
      const newUiState = { ...uiState, openSections: { ...uiState.openSections, [phaseId]: newOpenSections } };
      setUiState(newUiState);
      updateUiStateInFirestore(newUiState);
  }

  const onGapiLoad = () => {
    window.gapi.load('picker', { callback: () => setGapiLoaded(true) });
  };

  const onGisLoad = () => {
    setGisLoaded(true);
  }

  if (authLoading || isLoading) {
    return <div className="h-full flex items-center justify-center font-black animate-pulse text-primary">Loading Assignments...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <Script src="https://apis.google.com/js/api.js" onLoad={onGapiLoad} />
      <Script src="https://accounts.google.com/gsi/client" onLoad={onGisLoad} />
      
      <header className="flex h-20 shrink-0 items-center justify-between border-b bg-white/80 px-8 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 rounded-xl" />
          <h2 className="text-2xl font-black tracking-tight">Assignment Tracker</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-6">
          {phases.length === 0 && (
            <Card className="border-2 border-dashed rounded-[2.5rem]">
              <CardContent className="py-20 text-center space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                   <LayoutGrid className="h-10 w-10" />
                </div>
                <p className="text-slate-400 font-bold italic">Your syllabus is currently empty.</p>
              </CardContent>
            </Card>
          )}
          
          <Accordion type="multiple" className="space-y-4" value={uiState.openPhases} onValueChange={handlePhaseToggle}>
            {phases.map((phase, phaseIndex) => {
              const phaseId = `phase-${phaseIndex}`;
              return (
                <AccordionItem key={phaseId} value={phaseId} className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <AccordionTrigger className="p-8 text-2xl font-black w-full hover:no-underline px-10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center text-sm">0{phaseIndex + 1}</div>
                        {phase.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-10 pb-8 pt-0">
                    {phase.sections.length === 0 ? (
                      <p className="text-sm text-slate-400 font-bold italic pl-4">No sections available.</p>
                    ) : (
                      <Accordion type="multiple" className="space-y-3" value={uiState.openSections[phaseId] || []} onValueChange={(value) => handleSectionToggle(phaseId, value)}>
                        {phase.sections.map((section, sectionIndex) => {
                          const sectionId = `section-${sectionIndex}`;
                          return (
                            <AccordionItem key={sectionId} value={sectionId} className="border border-slate-100 rounded-3xl overflow-hidden px-6">
                              <AccordionTrigger className="font-black pt-4 mb-2 text-lg text-slate-800 hover:no-underline">
                                {section.name}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3 pb-4 pt-2">
                                {section.assignments.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-bold italic pl-4">No assignments yet.</p>
                                ) : (
                                  <div className="grid gap-2">
                                    {section.assignments.map((assignment, assignmentIndex) => {
                                      const assignmentId = createAssignmentId(phaseIndex, sectionIndex, assignmentIndex);
                                      const data = assignmentStatus[assignmentId] || {};
                                      const isCompleted = !!data.dateCompleted;
                                      
                                      return (
                                        <div key={assignmentId} className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white transition-all hover:shadow-lg group">
                                          <div className="flex items-center gap-4 flex-grow min-w-0">
                                            <Checkbox 
                                              id={assignmentId} 
                                              checked={isCompleted} 
                                              onCheckedChange={(checked) => handleAssignmentToggle(assignmentId, !!checked)} 
                                              className="h-6 w-6 rounded-xl border-2"
                                            />
                                            <div className="min-w-0 flex flex-col">
                                                <label 
                                                htmlFor={assignmentId} 
                                                className={`text-base font-black truncate cursor-pointer ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}
                                                >
                                                {assignment.name}
                                                </label>
                                                {data.docName && <span className="text-[10px] text-primary font-bold">{data.docName}</span>}
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Presented</span>
                                                <Input 
                                                  type="date" 
                                                  value={data.datePresented || ''} 
                                                  onChange={(e) => handleDateChange(assignmentId, 'datePresented', e.target.value)} 
                                                  className="h-10 w-36 rounded-xl bg-white border-slate-200 text-xs font-bold" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Completed</span>
                                                <Input 
                                                  type="date" 
                                                  value={data.dateCompleted || ''} 
                                                  onChange={(e) => handleDateChange(assignmentId, 'dateCompleted', e.target.value)} 
                                                  className="h-10 w-36 rounded-xl bg-white border-slate-200 text-xs font-bold" 
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 ml-auto lg:ml-0">
                                              {data.googleDocUrl ? (
                                                <div className="flex items-center gap-1">
                                                   <Button asChild variant="outline" size="sm" className="h-10 rounded-xl px-4 font-bold border-2 bg-white">
                                                      <a href={data.googleDocUrl} target="_blank" rel="noopener noreferrer">
                                                          <ExternalLink className="h-4 w-4 mr-2" />
                                                          View Doc
                                                      </a>
                                                  </Button>
                                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveDoc(assignmentId)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50">
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <Button 
                                                  variant="secondary" 
                                                  size="sm" 
                                                  className="h-10 rounded-xl px-4 font-black bg-slate-200 hover:bg-primary hover:text-white transition-all" 
                                                  onClick={() => handleBrowseDrive(assignmentId)}
                                                  disabled={!gapiLoaded || !gisLoaded || isPicking === assignmentId}
                                                >
                                                  {isPicking === assignmentId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSearch className="h-4 w-4 mr-2" />}
                                                  Browse Drive
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </main>
    </div>
  )
}

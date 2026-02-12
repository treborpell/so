'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/firebase/provider'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// --- Type Definitions ---
interface Assignment { name: string; }
interface Section { name: string; assignments: Assignment[]; }
interface Phase { name: string; sections: Section[]; }
interface AssignmentData {
  datePresented?: string;
  dateCompleted?: string;
}
interface AssignmentStatus { [key: string]: AssignmentData; }
interface UiState { openPhases: string[]; openSections: Record<string, string[]>; }

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useAuth()
  const [phases, setPhases] = useState<Phase[]>([])
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>({})
  const [uiState, setUiState] = useState<UiState>({ openPhases: [], openSections: {} })
  const [isLoading, setIsLoading] = useState(true)

  const createAssignmentId = (pIdx: number, sIdx: number, aIdx: number) => `p${pIdx}-s${sIdx}-a${aIdx}`

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

  if (authLoading || isLoading) {
    return <div className="h-full flex items-center justify-center">Loading Assignments...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Assignment Tracker</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-[1200px] mx-auto">
          {phases.length === 0 && (<Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Syllabus empty.</p></CardContent></Card>)}
          <Accordion type="multiple" className="space-y-4" value={uiState.openPhases} onValueChange={handlePhaseToggle}>
            {phases.map((phase, phaseIndex) => {
              const phaseId = `phase-${phaseIndex}`;
              return (
                <AccordionItem key={phaseId} value={phaseId} className="bg-white border shadow-sm rounded-lg overflow-hidden">
                  <AccordionTrigger className="p-6 text-xl font-bold w-full hover:no-underline">{phase.name}</AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    {phase.sections.length === 0 ? (<p className="text-sm text-muted-foreground italic pl-4">No sections.</p>) : (
                      <Accordion type="multiple" className="space-y-2" value={uiState.openSections[phaseId] || []} onValueChange={(value) => handleSectionToggle(phaseId, value)}>
                        {phase.sections.map((section, sectionIndex) => {
                          const sectionId = `section-${sectionIndex}`;
                          return (
                            <AccordionItem key={sectionId} value={sectionId} className="border-t">
                              <AccordionTrigger className="font-semibold pt-4 mb-2 text-md text-slate-800 hover:no-underline">
                                {section.name}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-2 pl-8 pb-2 pt-2">
                                {section.assignments.length === 0 ? (<p className="text-xs text-muted-foreground italic">No assignments.</p>) : (
                                  section.assignments.map((assignment, assignmentIndex) => {
                                    const assignmentId = createAssignmentId(phaseIndex, sectionIndex, assignmentIndex);
                                    const data = assignmentStatus[assignmentId] || {};
                                    const isCompleted = !!data.dateCompleted;
                                    return (
                                      <div key={assignmentId} className="flex flex-col md:flex-row md:items-center gap-3 py-3 border-b border-slate-100 last:border-b-0">
                                        <div className="flex items-center gap-4 flex-grow">
                                          <Checkbox id={assignmentId} checked={isCompleted} onCheckedChange={(checked) => handleAssignmentToggle(assignmentId, !!checked)} className="rounded-full h-5 w-5"/>
                                          <label htmlFor={assignmentId} className={`text-sm font-medium leading-none cursor-pointer ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{assignment.name}</label>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 pt-3 md:pt-0 pl-9 md:pl-0">
                                            <div className="flex items-center justify-between"><label className="text-xs text-slate-500 shrink-0">Presented</label><Input type="date" value={data.datePresented || ''} onChange={(e) => handleDateChange(assignmentId, 'datePresented', e.target.value)} className="h-9 w-36 rounded-md bg-slate-50 border-slate-200 text-xs" /></div>
                                            <div className="flex items-center justify-between"><label className="text-xs text-slate-500 shrink-0">Completed</label><Input type="date" value={data.dateCompleted || ''} onChange={(e) => handleDateChange(assignmentId, 'dateCompleted', e.target.value)} className="h-9 w-36 rounded-md bg-slate-50 border-slate-200 text-xs" /></div>
                                        </div>
                                      </div>
                                    )
                                  })
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

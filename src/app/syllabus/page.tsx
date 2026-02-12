'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, TrashIcon, SaveIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase/provider'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function SyllabusPage() {
  const [phases, setPhases] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (user) {
      const fetchSyllabus = async () => {
        try {
          const syllabusDocRef = doc(db, 'users', user.uid, 'data', 'syllabus')
          const docSnap = await getDoc(syllabusDocRef)
          if (docSnap.exists()) {
            setPhases(docSnap.data().phases)
          } else {
            console.log('No such document!')
          }
        } catch (error) {
          console.error('Error fetching syllabus:', error)
          toast({
            title: 'Error',
            description: 'Failed to load syllabus.',
            variant: 'destructive',
          })
        }
      }
      fetchSyllabus()
    }
  }, [user, toast])

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const syllabusDocRef = doc(db, 'users', user.uid, 'data', 'syllabus')
      await setDoc(syllabusDocRef, { phases })
      toast({
        title: 'Success',
        description: 'Syllabus saved successfully.',
      })
    } catch (error) {
      console.error('Error saving syllabus:', error)
      toast({
        title: 'Error',
        description: 'Failed to save syllabus.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addPhase = () => {
    setPhases([...phases, { name: 'New Phase', sections: [] }])
  }

  const updatePhaseName = (phaseIndex: number, name: string) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].name = name
    setPhases(newPhases)
  }

  const deletePhase = (phaseIndex: number) => {
    const newPhases = [...phases]
    newPhases.splice(phaseIndex, 1)
    setPhases(newPhases)
  }

  const addSection = (phaseIndex: number) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections.push({ name: 'New Section', assignments: [] })
    setPhases(newPhases)
  }

  const updateSectionName = (phaseIndex: number, sectionIndex: number, name: string) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections[sectionIndex].name = name
    setPhases(newPhases)
  }

  const deleteSection = (phaseIndex: number, sectionIndex: number) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections.splice(sectionIndex, 1)
    setPhases(newPhases)
  }

  const addAssignment = (phaseIndex: number, sectionIndex: number) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections[sectionIndex].assignments.push({ name: 'New Assignment' })
    setPhases(newPhases)
  }

  const updateAssignmentName = (
    phaseIndex: number,
    sectionIndex: number,
    assignmentIndex: number,
    name: string
  ) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections[sectionIndex].assignments[assignmentIndex].name = name
    setPhases(newPhases)
  }

  const deleteAssignment = (
    phaseIndex: number,
    sectionIndex: number,
    assignmentIndex: number
  ) => {
    const newPhases = [...phases]
    newPhases[phaseIndex].sections[sectionIndex].assignments.splice(
      assignmentIndex,
      1
    )
    setPhases(newPhases)
  }

  if (authLoading || !user) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-xl font-bold">Program Syllabus</h2>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SaveIcon className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-end mb-4">
              <Button onClick={addPhase}>
                <PlusIcon className="mr-2" />
                Add Phase
              </Button>
          </div>
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="mb-4 p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Input
                  value={phase.name}
                  onChange={(e) => updatePhaseName(phaseIndex, e.target.value)}
                  className="text-xl font-bold mr-2"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePhase(phaseIndex)}
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={() => addSection(phaseIndex)}
                size="sm"
                className="mb-2"
              >
                <PlusIcon className="mr-2" />
                Add Section
              </Button>
              {phase.sections.map((section: any, sectionIndex: number) => (
                <div
                  key={sectionIndex}
                  className="mb-2 p-2 border rounded-md ml-4"
                >
                  <div className="flex items-center mb-2">
                    <Input
                      value={section.name}
                      onChange={(e) =>
                        updateSectionName(
                          phaseIndex,
                          sectionIndex,
                          e.target.value
                        )
                      }
                      className="font-semibold mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteSection(phaseIndex, sectionIndex)
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => addAssignment(phaseIndex, sectionIndex)}
                    size="sm"
                    className="mb-2"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                  {section.assignments.map(
                    (assignment: any, assignmentIndex: number) => (
                      <div
                        key={assignmentIndex}
                        className="flex items-center ml-4"
                      >
                        <Input
                          value={assignment.name}
                          onChange={(e) =>
                            updateAssignmentName(
                              phaseIndex,
                              sectionIndex,
                              assignmentIndex,
                              e.target.value
                            )
                          }
                          className="text-sm mr-2"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteAssignment(
                              phaseIndex,
                              sectionIndex,
                              assignmentIndex
                            )
                          }
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

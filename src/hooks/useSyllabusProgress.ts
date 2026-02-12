'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/firebase/provider'
import { doc, getDoc } from 'firebase/firestore'

// --- Type Definitions ---
interface Assignment { name: string; }
interface Section { name: string; assignments: Assignment[]; }
interface Phase { name: string; sections: Section[]; }
interface AssignmentData { dateCompleted?: string; }
interface AssignmentStatus { [key: string]: AssignmentData; }

export interface ProgressData {
  name: string;
  total: number;
  completed: number;
  progress: number;
  sections: {
    name: string;
    total: number;
    completed: number;
    progress: number;
  }[];
}

const createAssignmentId = (pIdx: number, sIdx: number, aIdx: number) => `p${pIdx}-s${sIdx}-a${aIdx}`;

export function useSyllabusProgress() {
  const { user, db } = useAuth();
  const [phasesWithProgress, setPhasesWithProgress] = useState<ProgressData[]>([]);
  const [overallProgress, setOverallProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const calculateProgress = async () => {
      setIsLoading(true);
      try {
        const syllabusDocRef = doc(db, 'users', user.uid, 'data', 'syllabus');
        const statusDocRef = doc(db, 'users', user.uid, 'data', 'assignment_status');

        const [syllabusSnap, statusSnap] = await Promise.all([getDoc(syllabusDocRef), getDoc(statusDocRef)]);

        const syllabus = syllabusSnap.exists() ? (syllabusSnap.data() as { phases: Phase[] }) : { phases: [] };
        const statuses = statusSnap.exists() ? (statusSnap.data() as AssignmentStatus) : {};

        let totalAssignments = 0;
        let completedAssignments = 0;

        const progressData = syllabus.phases.map((phase, pIdx) => {
          let phaseTotal = 0;
          let phaseCompleted = 0;

          const sectionsProgress = phase.sections.map((section, sIdx) => {
            const sectionTotal = section.assignments.length;
            let sectionCompleted = 0;

            section.assignments.forEach((_, aIdx) => {
              const assignmentId = createAssignmentId(pIdx, sIdx, aIdx);
              if (statuses[assignmentId]?.dateCompleted) {
                sectionCompleted++;
              }
            });
            
            phaseTotal += sectionTotal;
            phaseCompleted += sectionCompleted;

            return {
              name: section.name,
              total: sectionTotal,
              completed: sectionCompleted,
              progress: sectionTotal > 0 ? (sectionCompleted / sectionTotal) * 100 : 100,
            };
          });
          
          totalAssignments += phaseTotal;
          completedAssignments += phaseCompleted;

          return {
            name: phase.name,
            total: phaseTotal,
            completed: phaseCompleted,
            progress: phaseTotal > 0 ? (phaseCompleted / phaseTotal) * 100 : 100,
            sections: sectionsProgress,
          };
        });

        setPhasesWithProgress(progressData);
        setOverallProgress({
          total: totalAssignments,
          completed: completedAssignments,
          progress: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 100,
        });

      } catch (error) {
        console.error("Error calculating syllabus progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateProgress();
  }, [user, db]);

  return { phasesWithProgress, overallProgress, isLoading };
}

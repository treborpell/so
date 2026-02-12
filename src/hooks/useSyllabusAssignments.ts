'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';

// --- Type Definitions ---
interface Assignment { name: string; }
interface Section { name: string; assignments: Assignment[]; }
interface Phase { name: string; sections: Section[]; }
interface AssignmentData { datePresented?: string; dateCompleted?: string; }
interface AssignmentStatus { [key: string]: AssignmentData; }

export interface SyllabusAssignment {
  id: string;
  name: string;
  phaseName: string;
  sectionName: string;
  isPresented: boolean;
  isCompleted: boolean;
}

const createAssignmentId = (pIdx: number, sIdx: number, aIdx: number) => `p${pIdx}-s${sIdx}-a${aIdx}`;

export function useSyllabusAssignments() {
  const { user, db } = useAuth();
  const [assignments, setAssignments] = useState<SyllabusAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const syllabusDocRef = doc(db, 'users', user.uid, 'data', 'syllabus');
        const statusDocRef = doc(db, 'users', user.uid, 'data', 'assignment_status');

        const [syllabusSnap, statusSnap] = await Promise.all([getDoc(syllabusDocRef), getDoc(statusDocRef)]);

        const syllabus = syllabusSnap.exists() ? (syllabusSnap.data() as { phases: Phase[] }) : { phases: [] };
        const statuses = statusSnap.exists() ? (statusSnap.data() as AssignmentStatus) : {};

        const allAssignments: SyllabusAssignment[] = [];
        syllabus.phases.forEach((phase, pIdx) => {
          phase.sections.forEach((section, sIdx) => {
            section.assignments.forEach((assignment, aIdx) => {
              const assignmentId = createAssignmentId(pIdx, sIdx, aIdx);
              const status = statuses[assignmentId] || {};
              allAssignments.push({
                id: assignmentId,
                name: assignment.name,
                phaseName: phase.name,
                sectionName: section.name,
                isPresented: !!status.datePresented,
                isCompleted: !!status.dateCompleted,
              });
            });
          });
        });

        setAssignments(allAssignments);
      } catch (error) {
        console.error("Error fetching syllabus assignments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user, db]);

  return { assignments, isLoading };
}

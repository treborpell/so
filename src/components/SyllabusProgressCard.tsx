
'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSyllabusProgress, ProgressData } from '@/hooks/useSyllabusProgress'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const PhaseProgress: React.FC<{ phase: ProgressData }> = ({ phase }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <p className="font-bold text-sm">{phase.name}</p>
      <p className="text-xs font-mono font-bold">{phase.completed}/{phase.total}</p>
    </div>
    <Progress value={phase.progress} className="h-2" />
  </div>
);

export const SyllabusProgressCard = () => {
  const { phasesWithProgress, overallProgress, isLoading } = useSyllabusProgress();

  if (isLoading) {
    return (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black">Syllabus Progress</CardTitle>
                <CardDescription>Your assignment completion status.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    )
  }

  if (phasesWithProgress.length === 0) {
      return null; // Don't show the card if there is no syllabus to track
  }

  return (
    <Link href="/assignments" className="block hover:scale-105 transition-transform">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-full">
        <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black">Syllabus Progress</CardTitle>
            <CardDescription>Your assignment completion status.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
            
            <div className="text-center space-y-2 py-4">
                <div className="text-5xl font-black text-primary">{Math.round(overallProgress.progress)}%</div>
                <p className="font-bold text-slate-500">Overall Completion ({overallProgress.completed}/{overallProgress.total})</p>
            </div>

            <div className="space-y-4">
                {phasesWithProgress.map((phase, index) => (
                    <PhaseProgress key={index} phase={phase} />
                ))}
            </div>

        </CardContent>
        </Card>
    </Link>
  )
}

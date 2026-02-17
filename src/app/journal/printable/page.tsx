"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PrintableJournalContent() {
  const { user, db, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const weekId = searchParams.get('weekId');
  const [weekData, setWeekData] = useState<any>(null);
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);

  useEffect(() => {
    if (weekId) {
      // Manually parse the date string to avoid timezone issues.
      // new Date('YYYY-MM-DD') is interpreted as UTC.
      const parts = weekId.split('-').map(Number);
      const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
      setWeekStartDate(localDate);
    }
  }, [weekId]);

  useEffect(() => {
    async function loadWeekData() {
      if (user && db && weekId) {
        const docRef = doc(db, "users", user.uid, "journal_weeks", weekId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWeekData(docSnap.data());
        } else {
          console.log("No such document!");
          setWeekData({}); // Treat as empty week
        }
      }
    }
    loadWeekData();
  }, [user, db, weekId]);

  // Also check for weekStartDate to be loaded
  if (authLoading || !weekData || !weekStartDate) {
    return <div className="h-full flex items-center justify-center font-black">Loading...</div>;
  }
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartDate!);
      d.setDate(d.getDate() + i);
      return d;
  });
  
  const getLocalDateString = (date: Date) => {
    // This function correctly gets the YYYY-MM-DD for a local date object.
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  }

  return (
    <div className="p-4 sm:p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 print:hidden">
            <h1 className="text-2xl font-black">Printable Weekly Journal</h1>
            <Button onClick={() => window.print()} className="rounded-lg font-bold">Print</Button>
        </header>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Week of {weekStartDate?.toLocaleDateString()}</CardTitle>
            </CardHeader>
        </Card>

        <div className="space-y-6">
            {weekDates.map(date => {
                const dateKey = getLocalDateString(date);
                const dayData = weekData.days?.[dateKey];

                if (!dayData) return null;

                const hasData = dayData.sThoughts || dayData.sFantasies || dayData.sBehaviors || dayData.thoughts || (dayData.selectedEvents && dayData.selectedEvents.length > 0) || (dayData.selectedFeelings && dayData.selectedFeelings.length > 0);

                if(!hasData) return null;

                return (
                    <Card key={dateKey}>
                        <CardHeader>
                            <CardTitle>{WEEKDAYS[date.getDay()]} - {date.toLocaleDateString()}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dayData.sThoughts && <div><p className="font-bold">S. Thoughts:</p><p>{dayData.sThoughts}</p></div>}
                            {dayData.sFantasies && <div><p className="font-bold">S. Fantasies:</p><p>{dayData.sFantasies}</p></div>}
                            {dayData.sBehaviors && <div><p className="font-bold">S. Behaviors:</p><p>{dayData.sBehaviors}</p></div>}
                            {dayData.selectedEvents && dayData.selectedEvents.length > 0 && <div><p className="font-bold">Daily Events:</p><div className="flex flex-wrap gap-2">{dayData.selectedEvents.map((e:string) => <Badge key={e} variant="outline">{e}</Badge>)}</div></div>}
                            {dayData.selectedFeelings && dayData.selectedFeelings.length > 0 && <div><p className="font-bold">Feelings:</p><div className="flex flex-wrap gap-2">{dayData.selectedFeelings.map((f:string) => <Badge key={f} variant="outline">{f}</Badge>)}</div></div>}
                            {dayData.thoughts && <div><p className="font-bold">Detailed Reflection:</p><p>{dayData.thoughts}</p></div>}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
        
        {weekData.weeklyFields && Object.keys(weekData.weeklyFields).length > 0 &&
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Weekly Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(weekData.weeklyFields).map(([key, value]: [string, any]) => {
                        if (!value.checked) return null;
                        const label = key.charAt(0).toUpperCase() + key.slice(1);
                        return (
                            <div key={key}>
                                <p className="font-bold">{label}:</p>
                                <p>{value.text || 'Checked'}</p>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        }
        
      </div>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintableJournalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintableJournalContent />
        </Suspense>
    );
}

'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';

// Basic type for logs, assuming they have a date property
interface Log {
  id: string;
  date: string;
  [key: string]: any;
}

interface ComplianceOverviewCardProps {
  polygraphs: Log[] | null | undefined;
  socialLogs: Log[] | null | undefined;
}

export const ComplianceOverviewCard: React.FC<ComplianceOverviewCardProps> = ({ polygraphs, socialLogs }) => {
  const lastPolygraph = polygraphs?.[0];
  const lastSocial = socialLogs?.[0];

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-full">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black">Compliance Overview</CardTitle>
        <CardDescription>Polygraph and pro-social activity.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4 grid gap-6">
        {/* Polygraph Section - Linked */}
        <Link href="/polygraphs" className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-grow space-y-1">
              <p className="font-bold text-slate-800">Polygraph Exams</p>
              {lastPolygraph ? (
                <p className="text-sm text-slate-500">
                  Last exam on <span className="font-bold">{lastPolygraph.date}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 italic">No polygraphs logged yet.</p>
              )}
            </div>
          </div>
        </Link>

        {/* Pro-Social Section - Linked */}
        <Link href="/social" className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-grow space-y-1">
              <p className="font-bold text-slate-800">Pro-Social Log</p>
              {lastSocial ? (
                <p className="text-sm text-slate-500">
                  Last activity on <span className="font-bold">{lastSocial.date}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 italic">No activities logged yet.</p>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

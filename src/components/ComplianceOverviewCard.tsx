'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users, ArrowRight } from 'lucide-react';

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
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black">Compliance Overview</CardTitle>
        <CardDescription>Polygraph and pro-social activity.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4 grid gap-6">
        {/* Polygraph Section */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
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
          <Button asChild size="sm" className="rounded-lg font-bold shrink-0">
            <Link href="/polygraphs">
              View <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Pro-Social Section */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
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
          <Button asChild size="sm" className="rounded-lg font-bold shrink-0">
            <Link href="/social">
              View <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

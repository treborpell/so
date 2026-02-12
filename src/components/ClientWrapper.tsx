'use client';

import React from "react";
import { AuthProvider } from "@/firebase/provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Toaster } from "@/components/ui/toaster";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </AuthProvider>
  );
}

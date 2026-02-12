'use client';

import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/firebase/provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { doc, getDoc } from "firebase/firestore";

function NotificationScheduler() {
  const { user, db } = useAuth();

  useEffect(() => {
    if (!user || !db || typeof window === "undefined") return;

    const checkAndNotify = async () => {
      if (Notification.permission !== "granted") return;

      const prefRef = doc(db, "users", user.uid, "config", "preferences");
      const snap = await getDoc(prefRef);
      if (!snap.exists()) return;

      const prefs = snap.data();
      if (prefs.reminderFrequency === "off") return;

      const [prefHour, prefMin] = (prefs.reminderTime || "20:00").split(':').map(Number);
      const now = new Date();
      
      // Basic client-side check: if it's the specific minute of your preference, show notification
      // In a real production app, this would be handled by a Cloud Function + FCM
      // But for a personal PWA, this "heartbeat" check works while the app is open
      if (now.getHours() === prefHour && now.getMinutes() === prefMin) {
         new Notification("Mindful Tracker", {
           body: "Time for your daily journal entry. Stay consistent!",
           icon: "/icon-192x192.png"
         });
      }
    };

    // Check every minute
    const interval = setInterval(checkAndNotify, 60000);
    return () => clearInterval(interval);
  }, [user, db]);

  return null;
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationScheduler />
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

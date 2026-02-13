
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/firebase/provider";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { db, app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Loader2 } from "lucide-react";

// Updated with the newest key from your screenshot
const VAPID_KEY = "BLX3Nmsix98pIIo14AxjUzBVUylrWHkF5QbZNBfaMfeeOM1BldCMm0el6GL-LVzrJgrZxEeNo5D7UeV-zx3Jmro";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({ 
    reminderFrequency: 'daily', 
    deliveryTime: '20:00',
    timezone: 'UTC' 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [isProcessingPush, setIsProcessingPush] = useState(false);

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    async function fetchPreferences() {
      if (user) {
        const prefDocRef = doc(db, "users", user.uid, "config", "preferences");
        const docSnap = await getDoc(prefDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPreferences({
            reminderFrequency: data.reminderFrequency || 'daily',
            deliveryTime: data.deliveryTime || '20:00',
            timezone: data.timezone || detectedTimezone
          });
        } else {
          setPreferences(prev => ({ ...prev, timezone: detectedTimezone }));
        }
        setIsLoading(false);
      }
    }
    fetchPreferences();

    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const prefDocRef = doc(db, "users", user.uid, "config", "preferences");
      await setDoc(prefDocRef, preferences, { merge: true });
      toast({ title: "Success", description: "Your preferences have been saved." });
    } catch (error) {
      console.error("Error saving preferences: ", error);
      toast({ title: "Error", description: "Could not save your preferences.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;
    setIsProcessingPush(true);
    try {
      const messaging = getMessaging(app);
      await deleteToken(messaging);
      
      const tokenDocRef = doc(db, "users", user.uid, "config", "fcm");
      await deleteDoc(tokenDocRef);
      
      toast({ title: "Disabled", description: "You will no longer receive push notifications on this device." });
      setNotificationStatus('default');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({ title: "Error", description: "Failed to disable notifications properly.", variant: "destructive" });
    } finally {
      setIsProcessingPush(false);
    }
  };

  const handleEnableNotifications = async () => {
    const hasNotification = 'Notification' in window;
    const hasSW = 'serviceWorker' in navigator;
    
    if (!hasNotification || !hasSW) {
      toast({ 
        title: "Unsupported", 
        description: "Your browser doesn't support push notifications.", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (fcmToken && user) {
          const tokenDocRef = doc(db, "users", user.uid, "config", "fcm");
          await setDoc(tokenDocRef, { 
            token: fcmToken, 
            createdAt: new Date().toISOString(),
            platform: 'web'
          }, { merge: true });
          
          toast({ title: "Success!", description: "Push notifications enabled." });
        } else {
          throw new Error("Could not retrieve FCM token.");
        }
      } else {
          toast({ title: "Permission Denied", description: "Please enable notifications in your browser settings.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      // Detailed error message to help debug authentication credential issues
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({ 
        title: "Error", 
        description: `Failed to enable notifications: ${errorMessage.slice(0, 100)}...`, 
        variant: "destructive" 
      });
    } finally {
      setIsProcessingPush(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Preferences</h1>
      <div className="space-y-8 max-w-2xl mx-auto">

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage how you receive reminders. 
              {preferences.timezone !== 'UTC' && ` We'll use your local timezone (${preferences.timezone}).`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Daily Journal Reminder</Label>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Select value={preferences.reminderFrequency} onValueChange={(value) => setPreferences(p => ({ ...p, reminderFrequency: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input type="time" value={preferences.deliveryTime} onChange={(e) => setPreferences(p => ({ ...p, deliveryTime: e.target.value }))} disabled={preferences.reminderFrequency === 'off'} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {notificationStatus === 'granted' ? (
                  <Button variant="outline" className="flex-1" onClick={handleDisableNotifications} disabled={isProcessingPush}>
                    {isProcessingPush ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
                    Disable Notifications
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={handleEnableNotifications} disabled={isProcessingPush}>
                    {isProcessingPush ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                    Enable Push Notifications
                  </Button>
                )}
              </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

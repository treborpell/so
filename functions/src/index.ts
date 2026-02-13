import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendDailyJournalReminders = onSchedule("every 15 minutes", async (event) => {
  const db = admin.firestore();
  
  console.log(`Checking for reminders...`);

  try {
    // 1. Find all users who have daily reminders enabled
    const usersSnap = await db.collectionGroup("config")
      .where("reminderFrequency", "==", "daily")
      .get();

    const sendPromises: Promise<any>[] = [];

    usersSnap.forEach((doc) => {
      const prefs = doc.data();
      const userId = doc.ref.parent.parent?.id;
      
      if (!userId || !prefs.deliveryTime) return;

      // 2. Determine the current time in the user's timezone
      const userTimezone = prefs.timezone || "UTC";
      
      // Get current time in user's timezone
      const now = new Date();
      const userNowStr = now.toLocaleString("en-US", { timeZone: userTimezone, hour12: false });
      const userNow = new Date(userNowStr);
      
      const userHours = userNow.getHours().toString().padStart(2, '0');
      const userMinutes = userNow.getMinutes().toString().padStart(2, '0');
      const userTime = `${userHours}:${userMinutes}`;

      // 3. Compare with deliveryTime (approximate to 15m window)
      const [prefH, prefM] = prefs.deliveryTime.split(':').map(Number);
      
      // Calculate minutes since midnight for both
      const nowMins = userNow.getHours() * 60 + userNow.getMinutes();
      const prefMins = prefH * 60 + prefM;
      
      const diffMins = nowMins - prefMins;

      // If we are within 0 to 15 minutes of the preferred time, send it
      if (diffMins >= 0 && diffMins < 15) {
        sendPromises.push(sendNotificationToUser(userId, db));
      }
    });

    await Promise.all(sendPromises);
    console.log(`Processed ${usersSnap.size} users, sent ${sendPromises.length} reminders.`);
  } catch (error) {
    console.error("Error sending reminders:", error);
  }
});

async function sendNotificationToUser(userId: string, db: admin.firestore.Firestore) {
  try {
    const fcmDoc = await db.doc(`users/${userId}/config/fcm`).get();
    const fcmData = fcmDoc.data();
    
    if (!fcmData || !fcmData.token) {
      return;
    }

    const message = {
      notification: {
        title: "Time to Journal! 📖",
        body: "Take a moment to document your thoughts for today.",
      },
      token: fcmData.token,
      webpush: {
        fcmOptions: {
          link: "/journal"
        }
      }
    };

    await admin.messaging().send(message);
    console.log(`Successfully sent reminder to user ${userId}`);
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
}

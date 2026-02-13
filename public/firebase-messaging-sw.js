
// Import and initialize the Firebase SDK
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
  apiKey: "AIzaSyBGuwLV4yeuUVp9KzNTSIvYS8pL5K27wl0",
  authDomain: "studio-8298944904-e8e18.firebaseapp.com",
  projectId: "studio-8298944904-e8e18",
  storageBucket: "studio-8298944904-e8e1s.firebasestorage.app",
  messagingSenderId: "717087876339",
  appId: "1:717087876339:web:bbcb268a50ea9151cf4386"
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

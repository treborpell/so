
// Import and initialize the Firebase SDK
// Using the compat version for easier use in a static service worker file
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBGuwLV4yeuUVp9KzNTSIvYS8pL5K27wl0",
  authDomain: "studio-8298944904-e8e18.firebaseapp.com",
  projectId: "studio-8298944904-e8e18",
  storageBucket: "studio-8298944904-e8e18.firebasestorage.app",
  messagingSenderId: "717087876339",
  appId: "1:717087876339:web:bbcb268a50ea9151cf4386"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const firebaseConfig = {
    apiKey: "AIzaSyDvA1LkHWTaRxacq2ZfG59ChD8-GVNgUiI",
    authDomain: "cntdev-e49f5.firebaseapp.com",
    projectId: "cntdev-e49f5",
    storageBucket: "cntdev-e49f5.firebasestorage.app",
    messagingSenderId: "165841118197",
    appId: "1:165841118197:web:9fb0cafce09b4b917776bc",
    measurementId: "G-BQQQ939VZY"
};

// Initialize Firebase
// (เราจะ import SDK ในไฟล์ HTML หลัก)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);

    // Export Data & Storage
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    window.auth = firebase.auth();

    console.log("✅ Firebase Initialized");
} else {
    console.error("❌ Firebase SDK not found!");
}

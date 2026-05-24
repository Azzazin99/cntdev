import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

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
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
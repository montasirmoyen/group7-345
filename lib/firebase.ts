import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// these are identifiers, not secrets
const firebaseConfig = {
  apiKey: "AIzaSyB3waZ49x0GVLi0E2cgn40yWZfEQSXbLec",
  authDomain: "job-application-tracker-c1d5e.firebaseapp.com",
  projectId: "job-application-tracker-c1d5e",
  storageBucket: "job-application-tracker-c1d5e.firebasestorage.app",
  messagingSenderId: "74310859482",
  appId: "1:74310859482:web:b25c7590c08af5dd3a43e3",
  measurementId: "G-2BR6WJJTQE",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// these are identifiers, not secrets
const firebaseConfig = {
  apiKey: "AIzaSyB3waZ49x0GVLi0E2cgn40yWZfEQSXbLec",
  authDomain: "job-application-tracker-c1d5e.firebaseapp.com",
  projectId: "job-application-tracker-c1d5e",
  storageBucket: "job-application-tracker-c1d5e.firebasestorage.app",
  messagingSenderId: "74310859482",
  appId: "1:74310859482:web:b25c7590c08af5dd3a43e3",
  measurementId: "G-2BR6WJJTQE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
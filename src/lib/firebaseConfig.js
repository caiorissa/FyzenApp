import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = requiredEnv.filter((key) => !import.meta.env[key]?.trim());

export const firebaseConfigError = missing.length
  ? `Variáveis ausentes no .env.local: ${missing.join(", ")}`
  : null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = firebaseConfigError ? null : initializeApp(firebaseConfig);

if (app && typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

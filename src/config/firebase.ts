// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Runtime validation of environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Please ensure your .env file is configured correctly. ` +
      `See .env.example for required variables.`
    );
  }
  return value;
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: validateEnvVar('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: validateEnvVar('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: validateEnvVar('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: validateEnvVar('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: validateEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: validateEnvVar('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: validateEnvVar('VITE_FIREBASE_MEASUREMENT_ID', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// ID global de l'application pour tes collections Firestore
export const APP_ID = "botola-v1";

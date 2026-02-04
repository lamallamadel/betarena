// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3hGmxB-RnwFed_tvyRrIBUZGFuhEPGws",
  authDomain: "crossteamz.firebaseapp.com",
  projectId: "crossteamz",
  storageBucket: "crossteamz.appspot.com",
  messagingSenderId: "933700937863",
  appId: "1:933700937863:web:a8c078d9eedc00ab3c3022",
  measurementId: "G-Z1F0BJSWTM"
};

// Initialize Firebase


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// ID global de l'application pour tes collections Firestore
export const APP_ID = "botola-v1";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcbaYjydaLo6YI9svSFbbm8ulOqKB7ykQ",
  authDomain: "gardariam.firebaseapp.com",
  projectId: "gardariam",
  storageBucket: "gardariam.firebasestorage.app",
  messagingSenderId: "1059576739320",
  appId: "1:1059576739320:web:03dc5daae9890d317d120d",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const ADMIN_EMAIL = "thejyg35@gmail.com";

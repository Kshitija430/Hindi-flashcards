import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhg4R3CFq5xZoexgl0ib5JBFrqrLasdZs",
  authDomain: "hindi-flashcards-e2f33.firebaseapp.com",
  projectId: "hindi-flashcards-e2f33",
  storageBucket: "hindi-flashcards-e2f33.firebasestorage.app",
  messagingSenderId: "920776591294",
  appId: "1:920776591294:web:1de750c8cca68d77e25bef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

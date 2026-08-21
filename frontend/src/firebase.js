// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; // 🚨 1. Firestore-a thelivaa import panrom

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfiGOeQ3s6yq2QXxtqj__yBFxPVQeaHRY",
  authDomain: "ai-task-agent-7c58b.firebaseapp.com",
  projectId: "ai-task-agent-7c58b",
  storageBucket: "ai-task-agent-7c58b.firebasestorage.app",
  messagingSenderId: "364060170784",
  appId: "1:364060170784:web:c8bc6840f6f5a03db6ba45",
  measurementId: "G-Z82N5LJT36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Authentication export panrom (Itha thaan Login/Signup-la use pannuvom)
export const auth = getAuth(app);

// 🚨 2. Database export panrom (Itha thaan Chat Save panna use panna porom)
export const db = getFirestore(app);
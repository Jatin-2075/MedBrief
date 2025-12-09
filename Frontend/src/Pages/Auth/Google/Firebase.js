// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCPRb7LB_BE5CBD2U1U6Ep24WT6T_PFQ_Q",
    authDomain: "health-ai-ee5a4.firebaseapp.com",
    projectId: "health-ai-ee5a4",
    storageBucket: "health-ai-ee5a4.firebasestorage.app",
    messagingSenderId: "516412949172",
    appId: "1:516412949172:web:6919819a4bbf6ad2d1cde1",
    measurementId: "G-RPVT6NYHKR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

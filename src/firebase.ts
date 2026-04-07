import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';

// Fallback config for development if the file is missing
const firebaseConfig = {
  apiKey: "DEMO_KEY",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "12345",
  appId: "1:12345:web:12345"
};

// In a real app, we would use:
// import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, getDocs };

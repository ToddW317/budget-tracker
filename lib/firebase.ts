import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAor_jzteizL008pj8XDMQrToTF9F6hwAE",
    authDomain: "budget-tracker-dc9de.firebaseapp.com",
    projectId: "budget-tracker-dc9de",
    storageBucket: "budget-tracker-dc9de.firebasestorage.app",
    messagingSenderId: "560153447620",
    appId: "1:560153447620:web:8be5ac9d88e0db92d44d91",
    measurementId: "G-B0Q2WZMSPW"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
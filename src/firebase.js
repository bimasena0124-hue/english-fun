// Import fungsi yang dibutuhkan dari SDK Firebase NPM
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Konfigurasi Firebase milikmu
const firebaseConfig = {
  apiKey: "AIzaSyDlcrOkziwFSpM7ylvW3MP_31ws65lG8NI",
  authDomain: "english-fun-c2cda.firebaseapp.com",
  projectId: "english-fun-c2cda",
  storageBucket: "english-fun-c2cda.firebasestorage.app",
  messagingSenderId: "71095070589",
  appId: "1:71095070589:web:d56e0cd6d51597eba46614",
  measurementId: "G-R4NLXEVCKR"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Service Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Export db dan auth agar bisa di-import di Login.vue dan Teacher.vue
export { db, auth };
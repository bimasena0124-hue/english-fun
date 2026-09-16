// Import fungsi yang dibutuhkan dari SDK Firebase NPM
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 1. Tambahkan import ini

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

// Inisialisasi Service Firestore, Auth, dan Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // 2. Inisialisasi Storage

// Export db, auth, dan storage agar bisa di-import di Teacher.vue atau file lainnya
export { db, auth, storage }; // 3. Export storage
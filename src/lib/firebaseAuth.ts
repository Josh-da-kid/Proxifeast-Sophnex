// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDJREPuc2Uf1vzUck2_4xHVjbVGxV7vdYk",
  authDomain: "zhanga-restaurant.firebaseapp.com",
  projectId: "zhanga-restaurant",
  storageBucket: "zhanga-restaurant.firebasestorage.app",
  messagingSenderId: "938165473432",
  appId: "1:938165473432:web:9fcdbcba559253109f40ed",
  measurementId: "G-EVJDM6C8SH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
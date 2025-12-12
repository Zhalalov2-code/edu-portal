import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLEETnEE2vBd3MVGzJgNNMn-oPxVDaB9U",
  authDomain: "edu-portal-dc4cf.firebaseapp.com",
  projectId: "edu-portal-dc4cf",
  storageBucket: "edu-portal-dc4cf.firebasestorage.app",
  messagingSenderId: "1073001301564",
  appId: "1:1073001301564:web:82c78a46c981e7ea86a539",
  measurementId: "G-N5V8W2Z1R8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const signWithGoogle = () => signInWithPopup(auth, googleProvider);
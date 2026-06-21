import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAXtes7hC2n0uC5v5jbBe6ZS16XYcmAT0",
  authDomain: "medbook-789c0.firebaseapp.com",
  projectId: "medbook-789c0",
  storageBucket: "medbook-789c0.app",
  messagingSenderId: "1051606503117",
  appId: "1:1051606503117:web:d200084fb54c4e66c7e384",
  measurementId: "G-B9XTNNXSYT",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

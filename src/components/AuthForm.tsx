import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  Mail,
  Lock,
  Hospital,
  UserCircle,
  Stethoscope,
  Loader2,
} from "lucide-react";
import Footer from "./Footer";
import type { AuthFormProps, UserRole } from "../types";

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Save selected role in localStorage as fallback
    localStorage.setItem("temp_auth_role", userRole);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        // Fetch role from Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        let role = userRole; // fallback to UI toggle
        
        if (userDoc.exists()) {
          role = userDoc.data().role;
        } else {
          // If user doc doesn't exist (e.g. old auth account), create one matching selected role
          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: userCredential.user.email,
            role: userRole,
          });
        }

        onAuthSuccess({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role,
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user role in users collection
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: userRole,
        });
        
        // If Doctor, seed doctor details in doctors collection so they show up on search
        if (userRole === "doctor") {
          const docName = email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
          await setDoc(doc(db, "doctors", userCredential.user.uid), {
            name: `Dr. ${docName}`,
            specialty: "General Physician",
            clinic: "MediNearby Clinic",
            address: "Agra, Uttar Pradesh",
            phone: "+91 98765 43210",
            experience: "5+ years",
            rating: 4.8,
            lat: 27.1767,
            lng: 78.0081
          });
        }
        
        setToast(
          `${userRole === "doctor" ? "Doctor" : "Patient"} account created successfully`
        );
        setIsLogin(true);
      }
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.code === "auth/email-already-in-use"
            ? "This email is already registered"
            : err.code === "auth/weak-password"
              ? "Password must be at least 6 characters"
              : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isDoctor = userRole === "doctor";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg">
            <Hospital className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">MediNearby</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Hero Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? "Welcome back" : "Get started"}
            </h2>
            <p className="text-slate-500">
              {isLogin
                ? "Sign in to find healthcare near you"
                : "Create your MediNearby account"}
            </p>
          </div>

          {/* Card */}
          <div className="card p-8">
            {/* Role Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setUserRole("patient")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isDoctor
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserCircle className="w-4 h-4" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setUserRole("doctor")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  isDoctor
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg input-field text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder={isLogin ? "Enter your password" : "Min 6 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg input-field text-sm"
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg btn-primary text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please wait...
                  </>
                ) : isLogin ? (
                  `Sign in as ${isDoctor ? "Doctor" : "Patient"}`
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* Toggle */}
            <p className="mt-6 text-center text-slate-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-brand-600 hover:text-brand-700 font-semibold cursor-pointer transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium text-sm bg-teal-600 animate-slide-in">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AuthForm;

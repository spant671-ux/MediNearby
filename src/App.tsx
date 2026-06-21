import React, { useState, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import { auth, db } from "./firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Hospital, Loader2 } from "lucide-react";
import type { AuthUser } from "./types";

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: data.role,
            });

            // Seed doctor profile document if it doesn't exist
            if (data.role === "doctor") {
              const docProfile = await getDoc(doc(db, "doctors", firebaseUser.uid));
              if (!docProfile.exists()) {
                const docName =
                  firebaseUser.email?.split("@")[0].charAt(0).toUpperCase() +
                    firebaseUser.email?.split("@")[0].slice(1) || "Doctor";
                await setDoc(doc(db, "doctors", firebaseUser.uid), {
                  name: `Dr. ${docName}`,
                  specialty: "General Physician",
                  clinic: "MediNearby Clinic",
                  address: "Agra, Uttar Pradesh",
                  phone: "+91 98765 43210",
                  experience: "5+ years",
                  rating: 4.8,
                  lat: 27.1767,
                  lng: 78.0081,
                });
              }
            }
          } else {
            // Default to patient role and save document in db
            const defaultRole = "patient";
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              role: defaultRole,
            });
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: defaultRole,
            });
          }
        } catch (err) {
          console.error("Error loading user role: ", err);
          // Fallback to local state if firebase fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "patient",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="bg-brand-600 p-4 rounded-2xl shadow-lg animate-pulse">
            <Hospital className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">MediNearby</h1>
          <p className="text-slate-400 text-sm">Initializing secure connection...</p>
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={setUser} />;
  }

  // Route based on role
  return user.role === "doctor" ? (
    <DoctorDashboard user={user} />
  ) : (
    <PatientDashboard user={user} />
  );
};

export default App;

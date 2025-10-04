import React, { useState, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import MediNearby from "./pages/MediNearby";
import Footer from "./components/Footer";
import { auth } from "./firebase/firebase";

function App() {
  const [user, setUser] = useState(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((usr) => setUser(usr));
    return () => unsubscribe();
  }, []);

  return (
    <>
      {user ? (
        <>
      

          {/* Main Page */}
          <MediNearby />

          <Footer />
        </>
      ) : (
        <AuthForm onAuthSuccess={setUser} />
      )}
    </>
  );
}

export default App;

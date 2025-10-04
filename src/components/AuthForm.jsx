import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Mail, Lock, Hospital, Info } from "lucide-react";
import Footer from "./Footer";

function AuthFormWithHeader({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user); // ✅ Only on login
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setToast({ message: "Your account has been created ✅", type: "success" });
        setIsLogin(true); // Stay on login page after signup
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-tr from-blue-400 via-purple-300 to-pink-300 animate-gradientBackground"></div>
        <div className="absolute w-80 h-80 bg-purple-400 rounded-full opacity-30 blur-3xl top-[-10%] left-[-10%] animate-blob animation-delay-0"></div>
        <div className="absolute w-96 h-96 bg-pink-400 rounded-full opacity-30 blur-3xl top-20 right-[-20%] animate-blob animation-delay-2000"></div>
        <div className="absolute w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-2xl bottom-10 left-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top-right help button */}
      <div className="absolute top-5 right-5 hidden md:block z-50">
        <button className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="text-blue-600 font-bold text-sm">Help</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white shadow-md w-full p-5 flex items-center justify-start gap-3 sticky top-0 z-40">
        <div className="bg-blue-600 p-3 rounded-lg animate-pulse">
          <Hospital className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-wider animate-fadeIn">
          MediNearby
        </h1>
      </div>

      {/* Auth card */}
      <div className="flex-grow flex justify-center items-center px-4 py-9">
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-10 w-full max-w-md transform transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-8 animate-bounce">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-gray-400 w-6 h-6 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all duration-300 hover:scale-[1.01]"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-400 w-6 h-6 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all duration-300 hover:scale-[1.01]"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300
                ${loading ? "bg-blue-400 cursor-not-allowed animate-pulse" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 hover:scale-105"}`}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-semibold cursor-pointer hover:underline hover:text-purple-600 transition-colors"
            >
              {isLogin ? "Sign up" : "Login"}
            </span>
          </p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-500
          ${toast.type === "success" ? "bg-green-500 animate-fadeIn" : "bg-red-500 animate-fadeIn"}`}>
          {toast.message}
        </div>
      )}

      <Footer />

      <style>
        {`
          @keyframes gradientBackground { 0% {background-position:0% 50%;} 50% {background-position:100% 50%;} 100% {background-position:0% 50%;} }
          .animate-gradientBackground { background-size: 200% 200%; animation: gradientBackground 15s ease infinite; }
          @keyframes blob { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-50px) scale(1.1);} 66%{transform:translate(-20px,20px) scale(0.9);} }
          .animate-blob { animation: blob 12s infinite; }
          .animation-delay-0 { animation-delay:0s; }
          .animation-delay-2000 { animation-delay:2s; }
          .animation-delay-4000 { animation-delay:4s; }
          @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
          .animate-fadeIn { animation: fadeIn 1.2s ease forwards; }
          @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
          .animate-bounce { animation: bounce 2s infinite; }
        `}
      </style>
    </div>
  );
}

export default AuthFormWithHeader;

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Mail, Lock, Hospital } from "lucide-react";
import Footer from "./Footer";

function AuthForm({ onAuthSuccess }) {
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
        onAuthSuccess(userCredential.user);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setToast({ message: "Your account has been created ✅", type: "success" });
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
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

  const AuthHeader = () => (
    <div className="bg-white/70 backdrop-blur-md shadow-md w-full p-5 flex items-center justify-start gap-3 sticky top-0 z-40">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full animate-pulse">
        <Hospital className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-wider animate-fadeIn">
        MediNearby
      </h1>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Header */}
      <AuthHeader />

      {/* Auth card */}
      <div className="flex-grow flex justify-center items-center px-6 py-10">
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-md transform transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
          
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-gray-400 w-6 h-6 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none shadow-sm transition-all duration-300 hover:scale-[1.01]"
                required
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-400 w-6 h-6 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                placeholder={isLogin ? "Password" : "Create Password (min 6 chars)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 focus:outline-none shadow-sm transition-all duration-300 hover:scale-[1.01]"
                required
              />
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300
                ${loading ? "bg-blue-400 cursor-not-allowed animate-pulse" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 hover:scale-105"}`}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          {/* Toggle login/signup */}
          <p className="mt-6 text-center text-gray-600 text-sm">
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

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-500
          ${toast.type === "success" ? "bg-green-500 animate-fadeIn" : "bg-red-500 animate-fadeIn"}`}>
          {toast.message}
        </div>
      )}

      <Footer />

      <style>
        {`
          @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
          .animate-fadeIn { animation: fadeIn 1.2s ease forwards; }
        `}
      </style>
    </div>
  );
}

export default AuthForm;

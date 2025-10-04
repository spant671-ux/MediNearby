import React from "react";
import { Hospital, Navigation, LogOut, Loader2 } from "lucide-react";

export default function Header({ locating, onLocate, onLogout }) {
  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0">
        {/* Logo + Title */}
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
            <Hospital className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            MediNearby
          </h1>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onLocate}
            disabled={locating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 active:scale-95 transition-transform text-white px-5 py-2 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
            <span className="font-medium">{locating ? "Locating..." : "My Location"}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 active:scale-95 transition-transform text-white px-5 py-2 rounded-xl shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

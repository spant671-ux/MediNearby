import React from "react";
import { Hospital, Navigation, LogOut, Loader2 } from "lucide-react";
import type { HeaderProps } from "../types";

const Header: React.FC<HeaderProps> = ({ locating, onLocate, onLogout, user }) => {
  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-nav">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg">
            <Hospital className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">MediNearby</h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User badge */}
          {user?.email && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-xs text-slate-600 font-medium max-w-[120px] truncate">
                {user.email.split("@")[0]}
              </span>
              <span className="text-xs text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                {user.role}
              </span>
            </div>
          )}

          {/* Locate */}
          <button
            onClick={onLocate}
            disabled={locating}
            className="flex items-center gap-2 btn-primary px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {locating ? "Locating..." : "My Location"}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 btn-outline px-3 py-2 rounded-lg text-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

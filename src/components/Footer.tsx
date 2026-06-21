import React from "react";
import { Hospital } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-1.5 rounded-md">
              <Hospital className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900">MediNearby</span>
              <p className="text-xs text-slate-400">Healthcare near you</p>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-400">
            <span>&copy; {new Date().getFullYear()} MediNearby</span>
            <span className="hidden md:inline text-slate-200">|</span>
            <span className="hover:text-brand-600 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hidden md:inline text-slate-200">|</span>
            <span className="hover:text-brand-600 cursor-pointer transition-colors">
              Terms of Service
            </span>
          </div>

          {/* Contact */}
          <div className="text-xs text-slate-400">
            support@medinearby.com
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

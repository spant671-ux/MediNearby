import React from "react";
import { MapPin, Phone, Navigation, Hospital, Clock, Star, Heart } from "lucide-react";
import type { DoctorCardProps } from "../types";

const specialtyColors: Record<string, { bg: string; text: string }> = {
  Cardiologist: { bg: "bg-red-50", text: "text-red-600" },
  Dermatologist: { bg: "bg-amber-50", text: "text-amber-600" },
  Pediatrician: { bg: "bg-sky-50", text: "text-sky-600" },
  "General Physician": { bg: "bg-emerald-50", text: "text-emerald-600" },
  Orthopedic: { bg: "bg-orange-50", text: "text-orange-600" },
  Neurologist: { bg: "bg-purple-50", text: "text-purple-600" },
  Pharmacies: { bg: "bg-teal-50", text: "text-teal-600" },
  "Medical Stores": { bg: "bg-cyan-50", text: "text-cyan-600" },
};

const defaultColor = { bg: "bg-slate-50", text: "text-slate-600" };

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onLocate,
  isSelected,
  isBookmarked,
  onToggleBookmark,
}) => {
  const colors = specialtyColors[doctor.specialty] || defaultColor;

  return (
    <div
      className={`card rounded-xl p-5 transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-brand-500 border-brand-200 shadow-card-hover"
          : "hover:shadow-card-hover"
      }`}
    >
      {/* Top: Name + Rating */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {doctor.name}
          </h3>
          <span
            className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {doctor.specialty}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(doctor.id);
              }}
              className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${
                isBookmarked
                  ? "text-red-500 fill-red-500 animate-pulse"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
          {doctor.rating > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-700">
                {doctor.rating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-slate-500">
          <Hospital className="w-3.5 h-3.5 mr-2 text-brand-500 shrink-0" />
          <span className="text-sm truncate">{doctor.clinic}</span>
        </div>
        <div className="flex items-center text-slate-500">
          <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
          <span className="text-sm truncate">{doctor.address}</span>
        </div>
        {doctor.distance !== undefined && (
          <div className="flex items-center text-slate-500">
            <Navigation className="w-3.5 h-3.5 mr-2 text-teal-500 shrink-0" />
            <span className="text-sm">
              <span className="font-semibold text-teal-600">
                {doctor.distance}
              </span>{" "}
              km away
            </span>
          </div>
        )}
        <div className="flex items-center text-slate-500">
          <Phone className="w-3.5 h-3.5 mr-2 text-green-500 shrink-0" />
          <span className="text-sm">{doctor.phone}</span>
        </div>
        <div className="flex items-center text-slate-500">
          <Clock className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
          <span className="text-sm">{doctor.experience} experience</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onLocate(doctor)}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          isSelected
            ? "btn-primary"
            : "btn-outline text-brand-600 border-brand-200 hover:bg-brand-50 hover:border-brand-300"
        }`}
      >
        <Navigation className="w-3.5 h-3.5" />
        {isSelected ? "Located on Map" : "Locate on Map"}
      </button>
    </div>
  );
};

export default DoctorCard;

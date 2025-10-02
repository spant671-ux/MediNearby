import React from 'react';
import { MapPin, Phone, Navigation, Hospital, Clock, Star } from 'lucide-react';

export default function DoctorCard({ doctor, onLocate, isSelected }) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-2 ${
        isSelected ? 'border-blue-500 scale-105' : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.name}</h3>
          <p className="text-blue-600 font-semibold text-sm">{doctor.specialty}</p>
        </div>
        <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
          <span className="text-sm font-bold text-gray-900">{doctor.rating}</span>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <Hospital className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-sm">{doctor.clinic}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-red-500" />
          <span className="text-sm">{doctor.address}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2 text-green-500" />
          <span className="text-sm">{doctor.phone}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-purple-500" />
          <span className="text-sm">{doctor.experience} experience</span>
        </div>
      </div>
      
      <button
        onClick={() => onLocate(doctor)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        <Navigation className="w-4 h-4 mr-2" />
        Locate on Map
      </button>
    </div>
  );
}

  import React, { useState, useEffect } from "react";
  import DoctorCard from "../components/DoctorCard";
  import MapComponent from "../components/MapComponent";
  import doctorsData from "../data/doctors.json";
  import { Search, Navigation, Hospital } from "lucide-react";

  const specialties = [
    "All Specialties",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "General Physician",
    "Orthopedic",
    "Neurologist",
  ];

  export default function MediNearby() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
    const [filteredDoctors, setFilteredDoctors] = useState(doctorsData);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
      let filtered = doctorsData;

      if (selectedSpecialty !== "All Specialties") {
        filtered = filtered.filter((doc) => doc.specialty === selectedSpecialty);
      }

      if (searchQuery.trim()) {
        filtered = filtered.filter(
          (doc) =>
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.clinic.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredDoctors(filtered);
    }, [searchQuery, selectedSpecialty]);

    const getUserLocation = () => {
      setLocationLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setLocationLoading(false);
          },
          (err) => {
            console.error(err);
            setUserLocation([27.1767, 78.0081]); // default
            setLocationLoading(false);
          }
        );
      } else {
        setUserLocation([27.1767, 78.0081]); 
        setLocationLoading(false);
      }
    };

    useEffect(() => getUserLocation(), []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}

        <div className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MediNearby</h1>
            </div>
            <button
              onClick={getUserLocation}
              disabled={locationLoading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              <span>{locationLoading ? "Locating..." : "My Location"}</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="container mx-auto px-4 py-2 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg  focus:border-blue-500"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onLocate={setSelectedDoctor}
                isSelected={selectedDoctor?.id === doctor.id}
              />
            ))}
          </div>

          <div className="lg:col-span-2 h-[600px] lg:h-[800px] sticky top-24">
            <MapComponent
              doctors={filteredDoctors}
              selectedDoctor={selectedDoctor}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    );
  }

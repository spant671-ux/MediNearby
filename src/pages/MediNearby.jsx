import React, { useState, useEffect, useRef, useCallback } from "react";
import DoctorCard from "../components/DoctorCard";
import MapComponent from "../components/MapComponent";
import { Search, Navigation, Hospital } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const specialties = [
  "All Specialties",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "General Physician",
  "Orthopedic",
  "Neurologist",
];

// Haversine formula
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MediNearby() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [doctorsData, setDoctorsData] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const mapSectionRef = useRef(null);
  const mapRef = useRef(null);

  // Fetch doctors from Firestore
  useEffect(() => {
    const doctorsCol = collection(db, "doctors");
    const unsubscribe = onSnapshot(doctorsCol, (snapshot) => {
      const doctorsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDoctorsData(doctorsList);
      setLoadingDoctors(false);
    });
    return () => unsubscribe();
  }, []);

  // Get user location once
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setLocationLoading(false);
        },
        (err) => {
          console.error(err);
          setUserLocation([27.1767, 78.0081]); // fallback
          setLocationLoading(false);
        }
      );
    } else {
      setUserLocation([27.1767, 78.0081]);
      setLocationLoading(false);
    }
  };

  // Filter doctors (search + specialty + distance)
  const filterDoctors = useCallback(() => {
    if (!userLocation || loadingDoctors) return [];

    let filtered = doctorsData;

    if (selectedSpecialty !== "All Specialties") {
      filtered = filtered.filter((doc) => doc.specialty === selectedSpecialty);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.clinic.toLowerCase().includes(q)
      );
    }

    const MAX_DISTANCE_KM = 50;
    const [userLat, userLng] = userLocation;

    return filtered
      .map((doc) => ({
        ...doc,
        distance:
          doc.lat && doc.lng
            ? getDistanceFromLatLonInKm(userLat, userLng, doc.lat, doc.lng)
            : Infinity,
      }))
      .filter((doc) => doc.distance <= MAX_DISTANCE_KM)
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation, doctorsData, selectedSpecialty, searchQuery, loadingDoctors]);

  // Update filtered doctors (debounced search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilteredDoctors(filterDoctors());
    }, 300); // 300ms debounce
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedSpecialty, userLocation, doctorsData, filterDoctors]);

  // Handle “Locate on Map”
  const handleLocateOnMap = () => {
    setLocationLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setLocationLoading(false);

          if (mapRef.current) mapRef.current.panToUser(lat, lng);

          if (mapSectionRef.current) {
            mapSectionRef.current.scrollIntoView({
              behavior: "smooth",
              block: window.innerWidth < 1024 ? "center" : "start",
            });
          }
        },
        (err) => {
          console.error(err);
          setUserLocation([27.1767, 78.0081]);
          setLocationLoading(false);
        }
      );
    } else {
      setUserLocation([27.1767, 78.0081]);
      setLocationLoading(false);
    }
  };

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
            onClick={handleLocateOnMap}
            disabled={locationLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            <span>{locationLoading ? "Locating..." : "My Location"}</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="container mx-auto px-4 py-2 flex gap-3 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors duration-200"
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500"
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
          {loadingDoctors || !userLocation ? (
            <p className="text-gray-500 text-center mt-4">Loading doctors...</p>
          ) : filteredDoctors.length === 0 ? (
            <p className="text-gray-500 text-center mt-4">No doctors found nearby.</p>
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={{ ...doctor, distance: doctor.distance?.toFixed(1) }}
                onLocate={setSelectedDoctor}
                isSelected={selectedDoctor?.id === doctor.id}
              />
            ))
          )}
        </div>

        <div
          ref={mapSectionRef}
          className="lg:col-span-2 h-[600px] lg:h-[800px] sticky top-24"
        >
          <MapComponent
            ref={mapRef}
            doctors={filteredDoctors}
            selectedDoctor={selectedDoctor}
            userLocation={userLocation}
            fitBounds={true}
          />
        </div>
      </div>
    </div>
  );
}

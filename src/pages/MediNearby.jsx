import React, { useState, useEffect, useRef, useCallback } from "react";
import DoctorCard from "../components/DoctorCard";
import MapComponent from "../components/MapComponent";
import { Search } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import Header from "../components/Header";

const specialties = [
  "All Specialties",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "General Physician",
  "Orthopedic",
  "Neurologist",
  "Medical Store",
];

// Haversine distance
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
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [user, setUser] = useState(null);

  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);

  // Fetch doctors + medical stores
  useEffect(() => {
    const doctorsCol = collection(db, "doctors");
    const storesCol = collection(db, "medicalStores");

    setLoading(true);

    const unsubDoctors = onSnapshot(doctorsCol, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev) => {
        const oldStores = prev.filter((p) => p.specialty === "Medical Stores");
        return [...list, ...oldStores];
      });
    });

    const unsubStores = onSnapshot(storesCol, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        specialty: "Medical Stores",
      }));
      setData((prev) => {
        const oldDocs = prev.filter((p) => p.specialty !== "Medical Stores");
        return [...oldDocs, ...list];
      });
      setLoading(false);
    });

    return () => {
      unsubDoctors();
      unsubStores();
    };
  }, []);

  // Get user location
  useEffect(() => {
    if (!userLocation) getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => {
          setUserLocation([27.1767, 78.0081]); // fallback
          setLocating(false);
        }
      );
    } else {
      setUserLocation([27.1767, 78.0081]);
      setLocating(false);
    }
  };

  // Filter data
  const filterData = useCallback(() => {
    let filtered = data;
    if (selectedSpecialty !== "All Specialties") {
      filtered = filtered.filter((d) => d.specialty === selectedSpecialty);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.specialty?.toLowerCase().includes(q) ||
          d.clinic?.toLowerCase().includes(q)
      );
    }
    if (userLocation) {
      const [lat, lng] = userLocation;
      filtered = filtered
        .map((d) => ({
          ...d,
          distance:
            d.lat && d.lng ? getDistanceFromLatLonInKm(lat, lng, d.lat, d.lng) : Infinity,
        }))
        .filter((d) => d.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
    }
    return filtered;
  }, [data, searchQuery, selectedSpecialty, userLocation]);

  useEffect(() => {
    setFilteredData(filterData());
  }, [filterData]);

  // Locate on map
  const handleLocate = () => {
    getUserLocation();
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: window.innerWidth < 1024 ? "center" : "start",
      });
    }
  };

  // Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3500);
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully ✅", "success");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      showToast("Logout failed ❌", "error");
    }
  };

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && !user) {
        setUser(currentUser);
        showToast(`Welcome back, ${currentUser.email} ✅`, "success");
      } else if (!currentUser) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Header */}
      <Header locating={locating} onLocate={handleLocate} onLogout={handleLogout} />

      {/* Search + Filter */}
      <div className="container mx-auto px-4 py-3 flex gap-3 sticky top-20 backdrop-blur-md bg-white/70 z-40 rounded-md shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search doctors or stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors duration-200"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition"
        >
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-xl text-white font-semibold transition-all duration-500 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } ${toastVisible ? "animate-slideIn" : "animate-slideOut"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List */}
        <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-center mt-4">Loading nearby places...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-gray-500 text-center mt-4">No results found.</p>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:scale-[1.02] transition-transform duration-300"
              >
                <DoctorCard
                  doctor={{ ...item, distance: item.distance?.toFixed(1) }}
                  onLocate={setSelectedItem}
                  isSelected={selectedItem?.id === item.id}
                />
              </div>
            ))
          )}
        </div>

        {/* Right: Map */}
        <div
          ref={mapSectionRef}
          className="lg:col-span-2 h-[600px] lg:h-[800px] sticky top-24 rounded-xl overflow-hidden shadow-xl"
        >
          <MapComponent
            ref={mapRef}
            doctors={filteredData}
            selectedDoctor={selectedItem}
            userLocation={userLocation}
            fitBounds={true}
          />
        </div>
      </div>
    </div>
  );
}

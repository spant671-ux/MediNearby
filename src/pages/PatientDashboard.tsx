import React, { useState, useEffect, useRef, useCallback } from "react";
import DoctorCard from "../components/DoctorCard";
import MapComponent from "../components/MapComponent";
import {
  Search,
  X,
  MapPin,
  SearchX,
  Calendar,
  Heart,
  User,
  Stethoscope,
  Navigation,
  Star,
  Clock,
  Trash2,
  Phone,
  Shield,
  Plus,
  HeartHandshake,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { Doctor, DashboardProps, ToastMessage, Appointment, Review } from "../types";
import { SPECIALTIES, DEFAULT_LOCATION, SEARCH_RADIUS_KM } from "../types";

// Haversine distance
const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Skeleton card
const SkeletonCard: React.FC = () => (
  <div className="card rounded-xl p-5 space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2 flex-1">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-7 w-12 rounded-md" />
    </div>
    <div className="space-y-2">
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="skeleton h-3 w-2/3" />
    </div>
    <div className="skeleton h-9 w-full rounded-lg" />
  </div>
);

const PatientDashboard: React.FC<DashboardProps> = ({ user }) => {
  // Sidebar Tabs state
  const [activeTab, setActiveTab] = useState<"find" | "appointments" | "saved" | "profile">("find");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  
  // Data State
  const [data, setData] = useState<Doctor[]>([]);
  const [filteredData, setFilteredData] = useState<Doctor[]>([]);
  const [selectedItem, setSelectedItem] = useState<Doctor | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Firestore Sync State
  const [savedDoctors, setSavedDoctors] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [patientProfile, setPatientProfile] = useState({
    name: user.email?.split("@")[0] || "Patient",
    age: "",
    preferences: "",
  });

  // Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const mapRef = useRef(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch doctors and stores on snapshot
  useEffect(() => {
    const doctorsCol = collection(db, "doctors");
    const storesCol = collection(db, "medicalStores");
    setLoading(true);

    const unsubDoctors = onSnapshot(doctorsCol, (snapshot) => {
      const list: Doctor[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Doctor[];
      setData((prev) => {
        const oldStores = prev.filter((p) => p.specialty === "Medical Stores");
        return [...list, ...oldStores];
      });
    });

    const unsubStores = onSnapshot(storesCol, (snapshot) => {
      const list: Doctor[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        specialty: "Medical Stores",
      })) as Doctor[];
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

  // Fetch bookmarks & profile details
  useEffect(() => {
    if (!user.uid) return;
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        setSavedDoctors(d.savedDoctors || []);
        setPatientProfile({
          name: d.name || user.email?.split("@")[0] || "Patient",
          age: d.age || "",
          preferences: d.preferences || "",
        });
      }
    });
    return () => unsubUser();
  }, [user]);

  // Fetch patient's appointments
  useEffect(() => {
    if (!user.uid) return;
    const appointmentsCol = collection(db, "appointments");
    const q = query(appointmentsCol, where("patientId", "==", user.uid));
    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAppointments(list);
    });
    return () => unsubAppointments();
  }, [user]);

  // Fetch reviews for selected doctor
  useEffect(() => {
    if (!selectedItem) {
      setReviews([]);
      return;
    }
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, where("doctorId", "==", selectedItem.id));
    const unsubReviews = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(list);
    });
    return () => unsubReviews();
  }, [selectedItem]);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
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
          setUserLocation(DEFAULT_LOCATION);
          setLocating(false);
        }
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setLocating(false);
    }
  };

  // Filter functionality
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
            d.lat && d.lng
              ? getDistanceKm(lat, lng, d.lat, d.lng)
              : Infinity,
        }))
        .filter((d) => (d.distance ?? Infinity) <= SEARCH_RADIUS_KM)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return filtered;
  }, [data, searchQuery, selectedSpecialty, userLocation]);

  useEffect(() => {
    setFilteredData(filterData());
  }, [filterData]);

  const handleLocate = () => {
    getUserLocation();
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: window.innerWidth < 1024 ? "center" : "start",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
      showToast("Logout failed", "error");
    }
  };

  // Toggle doctor bookmark
  const toggleBookmark = async (doctorId: string) => {
    if (!user.uid) return;
    const userRef = doc(db, "users", user.uid);
    const isBookmarked = savedDoctors.includes(doctorId);
    try {
      if (isBookmarked) {
        await updateDoc(userRef, {
          savedDoctors: arrayRemove(doctorId),
        });
        showToast("Removed from bookmarks");
      } else {
        await updateDoc(userRef, {
          savedDoctors: arrayUnion(doctorId),
        });
        showToast("Added to bookmarks");
      }
    } catch (err) {
      console.error("Bookmark err: ", err);
      showToast("Error updating bookmark", "error");
    }
  };

  // Submit appointment request
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !bookingDate || !bookingTime) return;

    try {
      const appRef = doc(collection(db, "appointments"));
      const newApp: Appointment = {
        id: appRef.id,
        doctorId: selectedItem.id,
        doctorName: selectedItem.name,
        specialty: selectedItem.specialty,
        patientId: user.uid,
        patientEmail: user.email || "Patient",
        date: bookingDate,
        time: bookingTime,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await setDoc(appRef, newApp);
      showToast("Booking request sent successfully!", "success");
      setBookingModalOpen(false);
      setBookingDate("");
      setBookingTime("");
    } catch (err) {
      console.error("Booking error: ", err);
      showToast("Booking request failed", "error");
    }
  };

  // Submit Doctor review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || reviewRating === 0 || !reviewComment.trim()) return;

    try {
      const revRef = doc(collection(db, "reviews"));
      const newRev: Review = {
        id: revRef.id,
        doctorId: selectedItem.id,
        patientEmail: patientProfile.name || user.email || "Anonymous",
        rating: reviewRating,
        comment: reviewComment,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };

      await setDoc(revRef, newRev);

      // Re-calculate and write back the doctor's average rating in Firestore
      const updatedReviews = [...reviews, newRev];
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const newAvg = parseFloat((sum / updatedReviews.length).toFixed(1));

      const docRef = doc(db, "doctors", selectedItem.id);
      const isDoctor = await getDoc(docRef);
      if (isDoctor.exists()) {
        await updateDoc(docRef, { rating: newAvg });
      } else {
        const storeRef = doc(db, "medicalStores", selectedItem.id);
        const isStore = await getDoc(storeRef);
        if (isStore.exists()) {
          await updateDoc(storeRef, { rating: newAvg });
        }
      }

      showToast("Review submitted successfully!", "success");
      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewComment("");
    } catch (err) {
      console.error("Review err: ", err);
      showToast("Failed to submit review", "error");
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: patientProfile.name,
        age: patientProfile.age,
        preferences: patientProfile.preferences,
      });
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Profile err: ", err);
      showToast("Failed to save profile", "error");
    }
  };

  // Delete/Cancel Appointment
  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await deleteDoc(doc(db, "appointments", apptId));
      showToast("Appointment successfully cancelled", "success");
    } catch (err) {
      console.error("Cancel appt err: ", err);
      showToast("Failed to cancel appointment", "error");
    }
  };

  // Welcome toast (once)
  useEffect(() => {
    if (user?.email) {
      showToast(`Welcome back, ${user.email.split("@")[0]}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resultCount = filteredData.length;
  const bookmarkedList = data.filter((d) => savedDoctors.includes(d.id));

  // Time Slots Constants
  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        locating={locating}
        onLocate={handleLocate}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-1 md:space-y-2 flex md:flex-col md:sticky md:top-[57px] md:h-[calc(100vh-57px)] shrink-0 z-30">
          <div className="hidden md:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Patient Portal
          </div>
          {[
            { id: "find", label: "Find Healthcare", icon: Stethoscope },
            { id: "appointments", label: "My Appointments", icon: Calendar, badge: appointments.length },
            { id: "saved", label: "Saved Providers", icon: Heart, badge: savedDoctors.length },
            { id: "profile", label: "Patient Profile", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-brand-50 text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-brand-200 text-brand-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-4 md:p-6 transition-all duration-300">
          {/* TOAST DISPLAY */}
          {toast && (
            <div
              className={`fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 border border-white/10 ${
                toast.type === "success" ? "bg-brand-600" : "bg-red-500"
              } ${toastVisible ? "animate-slide-in" : "animate-slide-out"}`}
            >
              <Sparkles className="w-4 h-4" />
              {toast.message}
            </div>
          )}

          {/* TAB 1: FIND HEALTHCARE */}
          {activeTab === "find" && (
            <div className="space-y-6 animate-fade-in">
              {/* Search + Filter Header */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-3">
                <div className="jitter-search-container w-full">
                  <Search className="jitter-search-icon" />
                  <input
                    type="text"
                    placeholder="Search doctors, specialties, clinics, pharmacies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="jitter-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="jitter-search-clear text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {SPECIALTIES.map((s) => {
                    const isActive = selectedSpecialty === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSpecialty(s)}
                        className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                          isActive
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Listings + Split Map/Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Doctor List */}
                <div className="lg:col-span-1 space-y-3 max-h-[800px] overflow-y-auto pr-1">
                  {!loading && (
                    <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span>
                        {resultCount > 0
                          ? `${resultCount} providers within ${SEARCH_RADIUS_KM} km`
                          : "No providers nearby"}
                      </span>
                    </div>
                  )}

                  {loading ? (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                          <SkeletonCard />
                        </div>
                      ))}
                    </>
                  ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-100 p-6">
                      <div className="bg-slate-50 p-5 rounded-full mb-4">
                        <SearchX className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-700 mb-1">No results found</h3>
                      <p className="text-sm text-slate-400 max-w-[260px]">
                        Try adjusting your search or filters to find healthcare providers near you.
                      </p>
                    </div>
                  ) : (
                    filteredData.map((item, index) => (
                      <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <DoctorCard
                          doctor={{
                            ...item,
                            distance: item.distance ? parseFloat(item.distance.toFixed(1)) : undefined,
                          }}
                          onLocate={setSelectedItem}
                          isSelected={selectedItem?.id === item.id}
                          isBookmarked={savedDoctors.includes(item.id)}
                          onToggleBookmark={toggleBookmark}
                        />
                      </div>
                    ))
                  )}
                </div>

                {/* Right Panel: Map (Top 50%) + Detail Info Panel (Bottom 50%) */}
                <div className="lg:col-span-2 flex flex-col gap-6 lg:h-[800px]">
                  {/* Top 50% Map Container */}
                  <div
                    ref={mapSectionRef}
                    className="h-[350px] lg:h-[400px] rounded-2xl overflow-hidden card relative shadow-sm border border-slate-100"
                  >
                    <MapComponent
                      ref={mapRef}
                      doctors={filteredData}
                      selectedDoctor={selectedItem}
                      userLocation={userLocation}
                      onSelectDoctor={setSelectedItem}
                    />
                  </div>

                  {/* Bottom 50% Detail Panel */}
                  <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm overflow-y-auto max-h-[380px] lg:max-h-[380px] relative flex flex-col">
                    {selectedItem ? (
                      <div className="space-y-4 animate-fade-in">
                        {/* Upper info */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedItem.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                                {selectedItem.specialty}
                              </span>
                              <span className="text-slate-400 text-xs font-semibold">
                                {selectedItem.experience} experience
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleBookmark(selectedItem.id)}
                              className={`p-2 rounded-full border transition-all ${
                                savedDoctors.includes(selectedItem.id)
                                  ? "bg-red-50 border-red-200 text-red-500"
                                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${savedDoctors.includes(selectedItem.id) ? "fill-red-500" : ""}`} />
                            </button>
                            <button
                              onClick={() => setBookingModalOpen(true)}
                              className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Book Appointment
                            </button>
                          </div>
                        </div>

                        {/* Mid Grid details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Navigation className="w-4 h-4 mr-2.5 text-teal-600 shrink-0" />
                            <span>{selectedItem.clinic} ({selectedItem.address})</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2.5 text-green-500 shrink-0" />
                            <span>{selectedItem.phone}</span>
                          </div>
                        </div>

                        {/* Summary / Bio */}
                        <div className="space-y-1.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-brand-500" />
                            Provider Bio
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Dedicated healthcare professional committed to providing exceptional care. Experienced in modern diagnostic procedures, disease prevention, and patient advocacy. Offers customized treatment plans tailored to each patient's lifestyle and medical history.
                          </p>
                        </div>

                        {/* Review Feed Section */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              Patient Reviews ({reviews.length})
                            </h4>
                            <button
                              onClick={() => setReviewModalOpen(true)}
                              className="text-brand-600 hover:text-brand-700 text-xs font-bold flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Write a Review
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {reviews.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No reviews yet. Be the first to review!</p>
                            ) : (
                              reviews.map((rev) => (
                                <div key={rev.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700">{rev.patientEmail.split("@")[0]}</span>
                                    <span className="text-slate-400 font-medium">{rev.date}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">{rev.comment}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-400">
                        <HeartHandshake className="w-12 h-12 text-slate-300 mb-2.5 animate-bounce" />
                        <h4 className="font-bold text-slate-700 text-sm mb-1">Select a Healthcare Provider</h4>
                        <p className="text-xs text-slate-400 max-w-[280px]">
                          Click "Locate on Map" or select any card/marker to see details, reviews, and book slots.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">My Appointments</h2>
                  <p className="text-sm text-slate-500">Track and manage your scheduled consultations.</p>
                </div>
                <button
                  onClick={() => setActiveTab("find")}
                  className="btn-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Book Another
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-12 shadow-sm">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">No appointments yet</h3>
                  <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
                    You haven't scheduled any consultations. Browse our network of specialists to book.
                  </p>
                  <button onClick={() => setActiveTab("find")} className="btn-outline px-4 py-2 rounded-xl text-sm font-semibold">
                    Find Doctors
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((appt) => {
                    const statusColors =
                      appt.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : appt.status === "declined"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                    const statusLabels =
                      appt.status === "accepted"
                        ? "Confirmed"
                        : appt.status === "declined"
                          ? "Declined"
                          : "Pending Approval";

                    return (
                      <div key={appt.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{appt.doctorName}</h3>
                            <p className="text-xs font-semibold text-brand-600 bg-brand-50/50 inline-block px-2 py-0.5 rounded mt-1.5">
                              {appt.specialty}
                            </p>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors}`}>
                            {statusLabels}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="font-semibold text-slate-700">{appt.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="font-semibold text-slate-700">{appt.time}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-50 pt-3">
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 btn-outline text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 py-2 rounded-xl text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Cancel Booking
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED PROVIDERS */}
          {activeTab === "saved" && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Saved Healthcare Providers</h2>
                <p className="text-sm text-slate-500">Quick access to book appointments with your saved doctors.</p>
              </div>

              {bookmarkedList.length === 0 ? (
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-12 shadow-sm">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">No bookmarked doctors</h3>
                  <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
                    Heart any provider from the listings to add them to your collection for quick access.
                  </p>
                  <button onClick={() => setActiveTab("find")} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
                    Browse Listings
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarkedList.map((item) => (
                    <DoctorCard
                      key={item.id}
                      doctor={item}
                      onLocate={(doc) => {
                        setSelectedItem(doc);
                        setActiveTab("find");
                      }}
                      isSelected={selectedItem?.id === item.id}
                      isBookmarked={true}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">Patient Profile Settings</h2>
                <p className="text-sm text-slate-500">Manage your medical preferences and identity credentials.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 text-slate-500 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium cursor-not-allowed"
                      value={user.email || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                      value={patientProfile.name}
                      onChange={(e) => setPatientProfile({ ...patientProfile, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Age</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                      value={patientProfile.age}
                      onChange={(e) => setPatientProfile({ ...patientProfile, age: e.target.value })}
                      placeholder="e.g. 28"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Medical Conditions / Allergies</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                      value={patientProfile.preferences}
                      onChange={(e) => setPatientProfile({ ...patientProfile, preferences: e.target.value })}
                      placeholder="e.g. Penicillin allergy, diabetic, none..."
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-bold shadow-sm">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* BOOKING APPOINTMENT MODAL */}
      {bookingModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-slate-100 flex flex-col">
            <button
              onClick={() => setBookingModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 w-7 h-7 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Request Appointment
            </h3>
            <p className="text-slate-400 text-xs font-semibold mb-4 border-b border-slate-50 pb-2">
              with {selectedItem.name}
            </p>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => {
                    const isSelected = bookingTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setBookingTime(time)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!bookingDate || !bookingTime}
                className="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-sm mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Appointment Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {reviewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-slate-100 flex flex-col">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 w-7 h-7 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Write a Review
            </h3>
            <p className="text-slate-400 text-xs font-semibold mb-4 border-b border-slate-50 pb-2">
              for {selectedItem.name}
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = reviewRating >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-slate-300 hover:text-amber-500 focus:outline-none"
                      >
                        <Star className={`w-8 h-8 ${isLit ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                  value={reviewComment}
                  placeholder="Share details about your experience..."
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={reviewRating === 0 || !reviewComment.trim()}
                className="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-sm mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PatientDashboard;

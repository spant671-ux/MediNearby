import React, { useState, useEffect } from "react";
import {
  Hospital,
  LogOut,
  Eye,
  BarChart3,
  Clock,
  Star,
  Shield,
  Edit3,
  Calendar,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import Footer from "../components/Footer";
import type { DashboardProps, Appointment, Review, Doctor, ToastMessage } from "../types";
import { SPECIALTIES } from "../types";

const DoctorDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "profile" | "reviews">("overview");
  
  // Doctor profile, appointments, and reviews state
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Edit Profile Form State
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formClinic, setFormClinic] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formLat, setFormLat] = useState(27.1767);
  const [formLng, setFormLng] = useState(78.0081);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync Doctor Profile from Firestore
  useEffect(() => {
    if (!user.uid) return;
    const docRef = doc(db, "doctors", user.uid);
    const unsubProfile = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Doctor;
          setProfile({ ...data, id: snapshot.id });
          
          // Populate edit form states initially
          setFormName(data.name || "");
          setFormSpecialty(data.specialty || "General Physician");
          setFormClinic(data.clinic || "");
          setFormAddress(data.address || "");
          setFormPhone(data.phone || "");
          setFormExperience(data.experience || "");
          setFormLat(data.lat || 27.1767);
          setFormLng(data.lng || 78.0081);
        }
      },
      (error) => {
        console.warn("Doctor profile fetch failed, reading from localStorage fallback:", error);
        const localProfileStr = localStorage.getItem(`doctor_profile_${user.uid}`);
        if (localProfileStr) {
          const data = JSON.parse(localProfileStr) as Doctor;
          setProfile(data);
          setFormName(data.name || "");
          setFormSpecialty(data.specialty || "General Physician");
          setFormClinic(data.clinic || "");
          setFormAddress(data.address || "");
          setFormPhone(data.phone || "");
          setFormExperience(data.experience || "");
          setFormLat(data.lat || 27.1767);
          setFormLng(data.lng || 78.0081);
        } else {
          // Default mock profile if not present
          const docName = user.email?.split("@")[0].charAt(0).toUpperCase() + user.email?.split("@")[0].slice(1) || "Doctor";
          const defaultProfile: Doctor = {
            id: user.uid,
            name: `Dr. ${docName}`,
            specialty: "General Physician",
            clinic: "MediNearby Clinic",
            address: "Agra, Uttar Pradesh",
            phone: "+91 98765 43210",
            experience: "5+ years",
            rating: 4.8,
            lat: 27.1767,
            lng: 78.0081,
          };
          setProfile(defaultProfile);
          setFormName(defaultProfile.name);
          setFormSpecialty(defaultProfile.specialty);
          setFormClinic(defaultProfile.clinic);
          setFormAddress(defaultProfile.address);
          setFormPhone(defaultProfile.phone);
          setFormExperience(defaultProfile.experience);
          setFormLat(defaultProfile.lat);
          setFormLng(defaultProfile.lng);
        }
      }
    );
    return () => unsubProfile();
  }, [user]);

  // Sync incoming appointments from Firestore
  useEffect(() => {
    if (!user.uid) return;
    const appointmentsCol = collection(db, "appointments");
    const q = query(appointmentsCol, where("doctorId", "==", user.uid));
    const unsubAppointments = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setAppointments(list);
      },
      (error) => {
        console.warn("Doctor appointments fetch failed, reading from localStorage:", error);
        const localAppts = JSON.parse(localStorage.getItem("medinearby_appointments") || "[]");
        const docAppts = localAppts.filter((a: Appointment) => a.doctorId === user.uid);
        docAppts.sort((a: Appointment, b: Appointment) => b.createdAt.localeCompare(a.createdAt));
        setAppointments(docAppts);
      }
    );
    return () => unsubAppointments();
  }, [user]);

  // Sync reviews left for this doctor
  useEffect(() => {
    if (!user.uid) return;
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, where("doctorId", "==", user.uid));
    const unsubReviews = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(list);
      },
      (error) => {
        console.warn("Doctor reviews fetch failed, reading from localStorage:", error);
        const localRevs = JSON.parse(localStorage.getItem("medinearby_reviews") || "[]");
        const docRevs = localRevs.filter((r: Review) => r.doctorId === user.uid);
        setReviews(docRevs);
      }
    );
    return () => unsubReviews();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Appointment Action
  const handleAcceptAppointment = async (apptId: string) => {
    try {
      await updateDoc(doc(db, "appointments", apptId), {
        status: "accepted",
      });
      showToast("Appointment successfully accepted!", "success");
    } catch (err) {
      console.warn("Accept appointment cloud write failed, using localStorage fallback: ", err);
      const localAppts = JSON.parse(localStorage.getItem("medinearby_appointments") || "[]");
      const updated = localAppts.map((a: Appointment) =>
        a.id === apptId ? { ...a, status: "accepted" as const } : a
      );
      localStorage.setItem("medinearby_appointments", JSON.stringify(updated));
      setAppointments(updated.filter((a) => a.doctorId === user.uid));
      showToast("Appointment successfully accepted!", "success");
    }
  };

  // Decline Appointment Action
  const handleDeclineAppointment = async (apptId: string) => {
    try {
      await updateDoc(doc(db, "appointments", apptId), {
        status: "declined",
      });
      showToast("Appointment successfully declined", "success");
    } catch (err) {
      console.warn("Decline appointment cloud write failed, using localStorage fallback: ", err);
      const localAppts = JSON.parse(localStorage.getItem("medinearby_appointments") || "[]");
      const updated = localAppts.map((a: Appointment) =>
        a.id === apptId ? { ...a, status: "declined" as const } : a
      );
      localStorage.setItem("medinearby_appointments", JSON.stringify(updated));
      setAppointments(updated.filter((a) => a.doctorId === user.uid));
      showToast("Appointment successfully declined", "success");
    }
  };

  // Update Doctor Profile Action
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.uid) return;
    const updatedProfile = {
      id: user.uid,
      name: formName,
      specialty: formSpecialty,
      clinic: formClinic,
      address: formAddress,
      phone: formPhone,
      experience: formExperience,
      lat: Number(formLat),
      lng: Number(formLng),
      rating: profile?.rating || 4.8,
    };

    try {
      const docRef = doc(db, "doctors", user.uid);
      await setDoc(docRef, updatedProfile);
      showToast("Profile details updated successfully!", "success");
    } catch (err) {
      console.warn("Save profile cloud write failed, using localStorage fallback: ", err);
      
      // Save doctor details in doctor_profile
      localStorage.setItem(`doctor_profile_${user.uid}`, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      // Also insert/update this doctor in the global search directory list in localStorage
      const localDocs = JSON.parse(localStorage.getItem("medinearby_doctors") || "[]");
      const docIdx = localDocs.findIndex((d: Doctor) => d.id === user.uid);
      if (docIdx > -1) {
        localDocs[docIdx] = updatedProfile;
      } else {
        localDocs.push(updatedProfile);
      }
      localStorage.setItem("medinearby_doctors", JSON.stringify(localDocs));

      showToast("Profile details updated successfully!", "success");
    }
  };

  const displayName = profile?.name || user.email?.split("@")[0] || "Doctor";
  const initials = displayName.replace("Dr. ", "").charAt(0).toUpperCase();

  // Compute pending, confirmed counts
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "accepted").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-nav">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediNearby</h1>
              <span className="text-xs text-slate-400">Doctor Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold animate-pulse">
                {initials}
              </div>
              <span className="text-xs text-slate-600 font-semibold">
                {displayName}
              </span>
              <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 btn-outline px-3 py-2 rounded-lg text-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Layout */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-1 md:space-y-2 flex md:flex-col md:sticky md:top-[57px] md:h-[calc(100vh-57px)] shrink-0 z-30">
          <div className="hidden md:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {[
            { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
            { id: "appointments", label: "Patient Bookings", icon: Calendar, badge: pendingCount },
            { id: "profile", label: "Edit Public Profile", icon: Edit3 },
            { id: "reviews", label: "Patient Reviews", icon: MessageSquare, badge: reviews.length },
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

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {displayName}</h2>
                <p className="text-slate-500 mt-1">
                  Manage patient bookings, monitor performance, and customize clinic metadata.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Profile Views",
                    value: "1,247",
                    change: "+12% this month",
                    icon: Eye,
                    color: "text-brand-600",
                    bg: "bg-brand-50",
                  },
                  {
                    label: "Pending Approvals",
                    value: pendingCount.toString(),
                    change: "Awaiting confirmation",
                    icon: Calendar,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "Confirmed Appointments",
                    value: confirmedCount.toString(),
                    change: "Live synced schedule",
                    icon: Check,
                    color: "text-teal-600",
                    bg: "bg-teal-50",
                  },
                  {
                    label: "Average Rating",
                    value: profile?.rating ? profile.rating.toString() : "4.8",
                    change: `From ${reviews.length} reviews`,
                    icon: Star,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="card rounded-xl p-5 animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
                      <div className={`${stat.bg} p-2 rounded-lg`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{stat.change}</p>
                  </div>
                ))}
              </div>

              {/* Main row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Performance Chart Mock */}
                <div className="lg:col-span-2 card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                    Patient Search Appearances
                  </h3>
                  
                  {/* Mock line chart bar graph */}
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
                    {[
                      { day: "Mon", val: 40 },
                      { day: "Tue", val: 55 },
                      { day: "Wed", val: 80 },
                      { day: "Thu", val: 65 },
                      { day: "Fri", val: 95 },
                      { day: "Sat", val: 110 },
                      { day: "Sun", val: 85 },
                    ].map((item, i) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className="w-full bg-brand-100 group-hover:bg-brand-500 rounded-lg transition-all duration-500 relative flex justify-center items-end"
                          style={{ height: `${item.val * 1.8}px` }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded absolute -top-8 transition-opacity">
                            {item.val}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Quick Settings Preview */}
                <div className="card rounded-2xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600" />
                      Visibility Status
                    </h3>

                    <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-800">Listing Public & Verified</p>
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          Patients within 20 km search radius can discover your profile live.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-50 pt-4 text-xs text-slate-500 leading-relaxed font-semibold">
                      <div className="flex items-center justify-between">
                        <span>Profile Completeness</span>
                        <span className="text-brand-600">95%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-500 h-full w-[95%] transition-all duration-300" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className="w-full btn-outline py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Edit Profile Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT BOOKINGS */}
          {activeTab === "appointments" && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">Patient Consultation Bookings</h2>
                <p className="text-sm text-slate-500">Approve or reschedule incoming patient appointments.</p>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-12 shadow-sm">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">No appointments yet</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    You have not received any patient bookings yet. Complete your profile details to gain discoverability.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => {
                    const statusColors =
                      appt.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : appt.status === "declined"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                    const statusLabel =
                      appt.status === "accepted"
                        ? "Accepted & Confirmed"
                        : appt.status === "declined"
                          ? "Declined"
                          : "Awaiting Action";

                    return (
                      <div key={appt.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-bold text-slate-900 text-base">{appt.patientEmail.split("@")[0]}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">{appt.patientEmail}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-semibold">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {appt.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {appt.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${statusColors}`}>
                            {statusLabel}
                          </span>

                          {appt.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptAppointment(appt.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                title="Accept Appointment"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeclineAppointment(appt.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                title="Decline Appointment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDIT PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">Edit Public Profile Details</h2>
                <p className="text-sm text-slate-500">These details appear directly on the patient directory search results.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Doctor Display Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Dr. John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Specialty Category</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold bg-white"
                        value={formSpecialty}
                        onChange={(e) => setFormSpecialty(e.target.value)}
                        required
                      >
                        {SPECIALTIES.filter((s) => s !== "All Specialties").map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinic Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                        value={formClinic}
                        onChange={(e) => setFormClinic(e.target.value)}
                        placeholder="e.g. HealthFirst Clinic"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinic Address</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="e.g. Agra, Uttar Pradesh"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Years of Experience</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                        value={formExperience}
                        onChange={(e) => setFormExperience(e.target.value)}
                        placeholder="e.g. 8+ years"
                        required
                      />
                    </div>
                  </div>

                  {/* Coordinates Selection */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordinates (Geotagging for Maps)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none text-xs font-semibold"
                          value={formLat}
                          onChange={(e) => setFormLat(Number(e.target.value))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none text-xs font-semibold"
                          value={formLng}
                          onChange={(e) => setFormLng(Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      * Enter decimal coordinates (e.g. Agra is Lat 27.1767, Lng 78.0081) to place your clinic pinpoint precisely on the Leaflet map.
                    </p>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-bold shadow-sm">
                    Save and Publish Listing
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS FEED */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">Patient Reviews</h2>
                <p className="text-sm text-slate-500">Monitor feedback and reviews posted by verified patients.</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-12 shadow-sm">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">No reviews yet</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    Patients will be able to leave star ratings and comments here once you start completing appointments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 text-sm">{rev.patientEmail.split("@")[0]}</span>
                        <span className="text-slate-400 font-semibold">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-semibold">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorDashboard;

// ===== Data Models =====

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  address: string;
  phone: string;
  experience: string;
  rating: number;
  lat: number;
  lng: number;
  distance?: number;
}

export interface MedicalStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  specialty?: string;
  distance?: number;
}

// ===== Auth =====

export type UserRole = "patient" | "doctor";

export interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
}

// ===== UI =====

export interface ToastMessage {
  message: string;
  type: "success" | "error";
}

// ===== Component Props =====

export interface HeaderProps {
  locating: boolean;
  onLocate: () => void;
  onLogout: () => void;
  user?: AuthUser | null;
}

export interface DoctorCardProps {
  doctor: Doctor;
  onLocate: (doctor: Doctor) => void;
  isSelected: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (doctorId: string) => void;
}

export interface MapComponentProps {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  userLocation: [number, number] | null;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export interface AuthFormProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export interface DashboardProps {
  user: AuthUser;
}

// ===== Constants =====

export const SPECIALTIES = [
  "All Specialties",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "General Physician",
  "Orthopedic",
  "Neurologist",
  "Pharmacies",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

// Default fallback location (Agra, India)
export const DEFAULT_LOCATION: [number, number] = [27.1767, 78.0081];
export const SEARCH_RADIUS_KM = 20;

// ===== Appointments & Reviews =====

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientId: string;
  patientEmail: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientEmail: string;
  rating: number;
  comment: string;
  date: string;
}


import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { ClinicianUser, ScreeningRecord, Booking } from '../types';
import { INITIAL_SCREENINGS } from '../data/samplePatients';

// Standard Firebase Config (Supports env variables or fallback demo sandbox)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyRetinaCareAI2026ValidSandbox",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "retinacare-ai-screening.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "retinacare-ai-screening",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "retinacare-ai-screening.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475612",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475612:web:a1b2c3d4e5f6g7h8i9j0k"
};

// Initialize Firebase safely
let app;
let auth;
let db;
let isFirebaseLive = false;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Test if running in actual production Firebase or demo fallback
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    isFirebaseLive = true;
  }
} catch (e) {
  console.warn("RetinaCare AI: Running in resilient Offline/Demo Firebase Mode", e);
}

export { auth, db, isFirebaseLive };

// Admin verification helper
export const ADMIN_EMAILS = [
  'shauryavikramsingh02@gmail.com',
  'admin@retinacare.ai',
  'chief.ophthalmologist@retinacare.ai'
];

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// -------------------------------------------------------------
// Local Storage Persistence Helpers (Offline / Zero-Config First)
// -------------------------------------------------------------

const STORAGE_KEYS = {
  USER: 'retinacare_user',
  SCREENINGS: 'retinacare_screenings_v2',
  BOOKINGS: 'retinacare_bookings_v2',
};

// Initial local seeds
export function getStoredScreenings(): ScreeningRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCREENINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(INITIAL_SCREENINGS));
      return INITIAL_SCREENINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_SCREENINGS;
  }
}

export function saveStoredScreenings(screenings: ScreeningRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(screenings));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      const initialBookings: Booking[] = [
        {
          id: 'BK-DEL-8921',
          patientId: 'PAT-IND-1044',
          patientName: 'Ananya Iyer',
          patientPhone: '+91 94441 56789',
          patientAge: 34,
          doctorId: 'doc-del-01',
          doctorName: 'Dr. Atul Kumar',
          hospital: 'Dr. Rajendra Prasad Centre, AIIMS',
          preferredDate: '2026-09-30',
          preferredTime: '10:30 AM',
          triageLevel: 'EMERGENCY',
          drStageSummary: 'Proliferative DR (OS) with active neovascularization',
          status: 'CONFIRMED',
          createdAt: '2026-09-22T16:00:00Z',
          notes: 'Urgent laser photocoagulation & anti-VEGF injection triage',
        },
        {
          id: 'BK-MUM-4412',
          patientId: 'PAT-IND-1042',
          patientName: 'Rajesh K. Verma',
          patientPhone: '+91 98112 34567',
          patientAge: 58,
          doctorId: 'doc-mum-01',
          doctorName: 'Dr. Natarajan Sundaram',
          hospital: 'Aditya Jyot Eye Hospital',
          preferredDate: '2026-10-05',
          preferredTime: '02:00 PM',
          triageLevel: 'ELEVATED',
          drStageSummary: 'Moderate NPDR with macular exudates',
          status: 'PENDING',
          createdAt: '2026-09-15T11:30:00Z',
          notes: 'OCT macula assessment and angiography evaluation',
        }
      ];
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings));
      return initialBookings;
    }
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveStoredBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save bookings to localStorage:', err);
  }
}

// -------------------------------------------------------------
// Authentication Service
// -------------------------------------------------------------

export function getStoredUser(): ClinicianUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Default Demo Clinician
  const defaultUser: ClinicianUser = {
    uid: 'demo-clinician-001',
    email: 'dr.shaurya@retinacare.ai',
    displayName: 'Dr. Shaurya Singh, MD',
    role: 'clinician',
    institution: 'All India Institute of Medical Sciences (AIIMS)',
    licenseNumber: 'MCI-DEL-2021-8849',
    isDemoUser: true,
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setStoredUser(user: ClinicianUser): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function loginWithEmail(email: string, pass: string): Promise<ClinicianUser> {
  const isAdmin = checkIsAdmin(email);
  const namePart = email.split('@')[0].replace('.', ' ');
  const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  
  const user: ClinicianUser = {
    uid: `user-${Date.now()}`,
    email: email.toLowerCase(),
    displayName: isAdmin ? `Administrator (${capitalized})` : `Dr. ${capitalized}, MD`,
    role: isAdmin ? 'admin' : 'clinician',
    institution: isAdmin ? 'RetinaCare AI Clinical Governance Board' : 'Apollo / Fortis Eye Health Centre',
    licenseNumber: `MCI-${Math.floor(100000 + Math.random() * 900000)}`,
    isDemoUser: false,
  };

  setStoredUser(user);
  return user;
}

export async function loginWithGoogle(): Promise<ClinicianUser> {
  // If actual live Firebase auth is enabled, attempt popup
  if (isFirebaseLive && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const email = res.user.email || 'user@retinacare.ai';
      const isAdmin = checkIsAdmin(email);
      const user: ClinicianUser = {
        uid: res.user.uid,
        email: email,
        displayName: res.user.displayName || 'Dr. Clinician',
        role: isAdmin ? 'admin' : 'clinician',
        institution: 'National Retinopathy Screening Network',
        licenseNumber: `MCI-GOOG-${Math.floor(1000 + Math.random() * 9000)}`,
        isDemoUser: false,
      };
      setStoredUser(user);
      return user;
    } catch (e) {
      console.warn("Google popup failed, falling back to simulated session", e);
    }
  }

  // Simulated Google Auth for offline/sandbox
  const mockEmail = 'shauryavikramsingh02@gmail.com';
  const user: ClinicianUser = {
    uid: 'google-uid-shaurya-01',
    email: mockEmail,
    displayName: 'Shaurya Vikram Singh (Admin)',
    role: 'admin',
    institution: 'Ministry of Health & Family Welfare / RetinaCare AI',
    licenseNumber: 'ADMIN-IND-DIRECTOR',
    isDemoUser: false,
  };
  setStoredUser(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseLive && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {}
  }
  // Reset to default demo session
  const defaultUser: ClinicianUser = {
    uid: 'guest-clinician',
    email: 'guest.clinician@retinacare.ai',
    displayName: 'Guest Clinician',
    role: 'clinician',
    institution: 'Primary Health Center (PHC)',
    isDemoUser: true,
  };
  setStoredUser(defaultUser);
}

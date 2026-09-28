export type EyeLaterality = 'OD' | 'OS';

export type DiabetesType = 'Type 1' | 'Type 2' | 'Gestational' | 'Pre-diabetes' | 'None';

export type DRGrade = 
  | 'No Apparent DR' 
  | 'Mild NPDR' 
  | 'Moderate NPDR' 
  | 'Severe NPDR' 
  | 'Proliferative DR';

export type DMERisk = 'Low' | 'Moderate' | 'High';

export type GlaucomaRisk = 'Low Suspicion' | 'Borderline' | 'High Suspicion';

export type UrgencyTier = 'Normal' | 'Routine' | 'Elevated' | 'Urgent' | 'Emergency';

export interface QualityCheck {
  illumination: number;
  contrast: number;
  sharpness: number;
  fovAdequacy: number;
  overallScore: number;
  isAdequate: boolean;
}

export interface EyeAssessment {
  eye: EyeLaterality;
  imageUrl: string;
  drGrade: DRGrade;
  drStage: number; // 0 to 4
  confidence: number;
  dmeRisk: DMERisk;
  fovealInvolvement: boolean;
  cdrRatio: number; // e.g. 0.38 - 0.75
  glaucomaRisk: GlaucomaRisk;
  quality: QualityCheck;
  claheUrl?: string;
  vesselMaskUrl?: string;
  heatmapUrl?: string;
  lesions: string[];
  triageAction: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  contact: string;
  diabetesType: DiabetesType;
  yearsDiagnosed: number;
  hba1c: number;
  isInsulinDependent: boolean;
  symptoms: string[];
  createdAt: string;
}

export interface ScreeningRecord {
  id: string;
  userId?: string;
  patientId: string;
  patient: PatientProfile;
  od: EyeAssessment;
  os: EyeAssessment;
  asymmetryIndex: number;
  clinicalWarning?: string;
  primaryTriage: string;
  urgencyTier: UrgencyTier;
  recommendedRecallWeeks: number;
  clinicianId: string;
  clinicianName: string;
  clinicianNotes?: string;
  signature?: string;
  createdAt: string;
  status: 'Completed' | 'Draft' | 'Referred';
}

export interface Doctor {
  id: string;
  name: string;
  qualifications: string;
  specialty: string;
  hospital: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  consultationFee: number;
  consultation_fee?: number;
  rating: number;
  reviewCount: number;
  review_count?: number;
  experienceYears: number;
  experience_years?: number;
  distanceKm?: number;
  distance_km?: number;
}

export interface Booking {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  doctorId: string;
  doctorName: string;
  hospital: string;
  preferredDate: string;
  preferredTime: string;
  triageLevel: string;
  drStageSummary: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  notes?: string;
}

export interface ClinicianUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'clinician' | 'admin';
  institution: string;
  licenseNumber?: string;
  isDemoUser?: boolean;
}

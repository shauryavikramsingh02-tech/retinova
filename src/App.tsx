import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MedicalDisclaimer } from './components/MedicalDisclaimer';
import { PatientIntakeStep } from './components/NewScreeningWizard/PatientIntakeStep';
import { BilateralUploadQualityStep } from './components/NewScreeningWizard/BilateralUploadQualityStep';
import { AIPipelineStep } from './components/NewScreeningWizard/AIPipelineStep';
import { DiagnosticDashboardStep } from './components/NewScreeningWizard/DiagnosticDashboardStep';
import { PatientsView } from './components/PatientsView';
import { DoctorsDirectoryView } from './components/DoctorsDirectoryView';
import { ReportsView } from './components/ReportsView';
import { AdminPortalView } from './components/AdminPortalView';
import { BookingModal } from './components/BookingModal';
import { AuthModal } from './components/AuthModal';
import { PatientReportModal } from './components/PatientReportModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { 
  ClinicianUser, 
  ScreeningRecord, 
  PatientProfile, 
  Booking, 
  Doctor, 
  QualityCheck 
} from './types';
import { 
  getStoredUser, 
  getStoredScreenings, 
  saveStoredScreenings, 
  getStoredBookings, 
  saveStoredBookings, 
  logoutUser, 
  loginWithEmail 
} from './services/firebase';
import { checkBackendHealth } from './services/api';
import { DRStage } from './utils/sampleFundusGenerator';

export function App() {
  // Navigation & User State
  const [currentTab, setCurrentTab] = useState<string>('screening');
  const [user, setUser] = useState<ClinicianUser>(getStoredUser());
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Database Records State
  const [screenings, setScreenings] = useState<ScreeningRecord[]>(getStoredScreenings());
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings());

  // New Screening Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1); // 1: Intake, 2: Upload, 3: AI Pipeline, 4: Results
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [capturedImages, setCapturedImages] = useState<{
    odImage: string;
    osImage: string;
    odPreset?: DRStage;
    osPreset?: DRStage;
    odQuality: QualityCheck;
    osQuality: QualityCheck;
  } | null>(null);
  const [activeScreening, setActiveScreening] = useState<ScreeningRecord | null>(screenings[0] || null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [reportToInspect, setReportToInspect] = useState<ScreeningRecord | null>(null);

  // Check Python backend on mount
  useEffect(() => {
    async function checkHealth() {
      const res = await checkBackendHealth();
      setBackendOnline(res.online);
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Wizard Step Handlers
  const handleIntakeComplete = (patient: PatientProfile) => {
    setCurrentPatient(patient);
    setWizardStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadComplete = (data: {
    odImage: string;
    osImage: string;
    odPreset?: DRStage;
    osPreset?: DRStage;
    odQuality: QualityCheck;
    osQuality: QualityCheck;
  }) => {
    setCapturedImages(data);
    setWizardStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInferenceComplete = (screeningResult: ScreeningRecord) => {
    // Add clinician context
    const enriched: ScreeningRecord = {
      ...screeningResult,
      clinicianId: user.uid,
      clinicianName: user.displayName,
    };
    setActiveScreening(enriched);

    // Save to list & local storage
    const updated = [enriched, ...screenings];
    setScreenings(updated);
    saveStoredScreenings(updated);

    setWizardStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToFirestore = () => {
    saveStoredScreenings(screenings);
  };

  // Start fresh screening
  const handleResetScreening = () => {
    setCurrentPatient(null);
    setCapturedImages(null);
    setWizardStep(1);
    setCurrentTab('screening');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-fill screening with existing patient
  const handleNewScreeningForPatient = (patientId: string) => {
    const existing = screenings.find((s) => s.patient.id === patientId);
    if (existing) {
      setCurrentPatient(existing.patient);
      setWizardStep(2);
      setCurrentTab('screening');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Booking handlers
  const handleOpenBooking = (doctor?: Doctor, patientRec?: ScreeningRecord) => {
    setSelectedDoctorForBooking(doctor || null);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (newBooking: Booking) => {
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveStoredBookings(updated);
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
    setBookings(updated);
    saveStoredBookings(updated);
  };

  // Report viewing
  const handleInspectReport = (screening: ScreeningRecord) => {
    setReportToInspect(screening);
    setIsReportOpen(true);
  };

  // Admin elevation quick-test
  const handleElevateToAdmin = async () => {
    const adminUser = await loginWithEmail('shauryavikramsingh02@gmail.com', 'adminPass');
    setUser(adminUser);
    setCurrentTab('admin');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(getStoredUser());
  };

  const handleDeleteScreening = (id: string) => {
    if (confirm('Delete this clinical screening record?')) {
      const updated = screenings.filter((s) => s.id !== id);
      setScreenings(updated);
      saveStoredScreenings(updated);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. Header Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        backendOnline={backendOnline}
        totalScreenings={screenings.length}
      />

      {/* 2. Regulatory Medical Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* 3. Main Application Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* TAB 1: NEW SCREENING WIZARD */}
        {currentTab === 'screening' && (
          <ErrorBoundary fallbackTabName="New Screening">
            <div className="space-y-6">
              
              {/* Step Navigation Progress Indicator (Step 1-4) */}
              <div className="max-w-3xl mx-auto pb-4">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0"></div>
                  <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-teal-600 -translate-y-1/2 -z-0 transition-all duration-300"
                    style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                  ></div>

                  {[
                    { step: 1, label: 'Intake' },
                    { step: 2, label: 'Fundus QC' },
                    { step: 3, label: 'AI Inference' },
                    { step: 4, label: 'Diagnosis' },
                  ].map((s) => (
                    <div key={s.step} className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all ${
                        wizardStep >= s.step
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}>
                        {s.step}
                      </div>
                      <span className={`text-[11px] font-semibold mt-1 ${
                        wizardStep >= s.step ? 'text-teal-900' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Views */}
              {wizardStep === 1 && (
                <PatientIntakeStep
                  initialData={currentPatient}
                  onComplete={handleIntakeComplete}
                />
              )}

              {wizardStep === 2 && (
                <BilateralUploadQualityStep
                  onBack={() => setWizardStep(1)}
                  onProceed={handleUploadComplete}
                />
              )}

              {wizardStep === 3 && currentPatient && capturedImages && (
                <AIPipelineStep
                  patient={currentPatient}
                  odImage={capturedImages.odImage}
                  osImage={capturedImages.osImage}
                  odPreset={capturedImages.odPreset}
                  osPreset={capturedImages.osPreset}
                  odQuality={capturedImages.odQuality}
                  osQuality={capturedImages.osQuality}
                  onInferenceComplete={handleInferenceComplete}
                />
              )}

              {wizardStep === 4 && activeScreening && (
                <DiagnosticDashboardStep
                  screening={activeScreening}
                  onSaveToFirestore={handleSaveToFirestore}
                  onPrintReport={() => handleInspectReport(activeScreening)}
                  onBookReferral={() => handleOpenBooking(undefined, activeScreening)}
                  onStartNewScreening={handleResetScreening}
                />
              )}
            </div>
          </ErrorBoundary>
        )}

        {/* TAB 2: PATIENTS DIRECTORY */}
        {currentTab === 'patients' && (
          <ErrorBoundary fallbackTabName="Patients Directory">
            <PatientsView
              screenings={screenings}
              onSelectScreening={handleInspectReport}
              onNewScreeningForPatient={handleNewScreeningForPatient}
              onDeleteScreening={handleDeleteScreening}
              onLaunchNewScreening={handleResetScreening}
            />
          </ErrorBoundary>
        )}

        {/* TAB 3: NEARBY DOCTORS DIRECTORY */}
        {currentTab === 'doctors' && (
          <ErrorBoundary fallbackTabName="Nearby Doctors">
            <DoctorsDirectoryView
              onBookDoctor={(doc) => handleOpenBooking(doc, activeScreening)}
            />
          </ErrorBoundary>
        )}

        {/* TAB 4: CLINICAL REPORTS & ANALYTICS */}
        {currentTab === 'reports' && (
          <ErrorBoundary fallbackTabName="Reports & Analytics">
            <ReportsView
              screenings={screenings}
              onSelectScreeningForPrint={handleInspectReport}
            />
          </ErrorBoundary>
        )}

        {/* TAB 5: ADMIN PORTAL */}
        {currentTab === 'admin' && (
          <ErrorBoundary fallbackTabName="Admin Portal">
            <AdminPortalView
              user={user}
              screenings={screenings}
              bookings={bookings}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onAddBooking={handleConfirmBooking}
              onSelectScreening={handleInspectReport}
              onLaunchScreeningWithPatient={(pt) => {
                setCurrentPatient({
                  id: `PAT-${Date.now().toString().slice(-6)}`,
                  name: pt.name,
                  age: pt.age,
                  sex: 'Male',
                  contact: pt.contact,
                  diabetesType: pt.diabetesType,
                  yearsDiagnosed: 8,
                  hba1c: pt.hba1c,
                  isInsulinDependent: false,
                  symptoms: ['blurry_vision'],
                  createdAt: new Date().toISOString(),
                });
                setWizardStep(2);
                setCurrentTab('screening');
              }}
              onElevateToAdmin={handleElevateToAdmin}
            />
          </ErrorBoundary>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">RetinaCare AI Platform</span>
            <span>•</span>
            <span>Clinical Bilateral Retinal Screening & Telemedicine</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Admin: shauryavikramsingh02@gmail.com
            </span>
            <span>ISO 13485:2016</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedDoctor={selectedDoctorForBooking}
        patientRecord={activeScreening}
        onConfirmBooking={handleConfirmBooking}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onUserChange={(newUser) => setUser(newUser)}
      />

      <PatientReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        screening={reportToInspect}
      />

    </div>
  );
}

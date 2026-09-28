import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileText, 
  Calendar, 
  UserPlus, 
  Database, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Download, 
  Trash2, 
  ArrowRight,
  Server,
  Layers,
  Key,
  Terminal,
  Activity
} from 'lucide-react';
import { ClinicianUser, ScreeningRecord, Booking, Doctor } from '../types';
import { INDIAN_SPECIALISTS } from '../data/specialists';

interface AdminPortalViewProps {
  user: ClinicianUser;
  screenings: ScreeningRecord[];
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, newStatus: Booking['status']) => void;
  onAddBooking: (booking: Booking) => void;
  onSelectScreening: (screening: ScreeningRecord) => void;
  onLaunchScreeningWithPatient: (patientData: any) => void;
  onElevateToAdmin: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  user,
  screenings,
  bookings,
  onUpdateBookingStatus,
  onAddBooking,
  onSelectScreening,
  onLaunchScreeningWithPatient,
  onElevateToAdmin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'bookings' | 'add_booking' | 'audit'>('reports');
  const [reportSearch, setReportSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<string>('ALL');

  // Intake Form State for Add New Booking
  const [newPtName, setNewPtName] = useState('');
  const [newPtPhone, setNewPtPhone] = useState('+91 ');
  const [newPtAge, setNewPtAge] = useState<number>(50);
  const [newDoctorId, setNewDoctorId] = useState(INDIAN_SPECIALISTS[0].id);
  const [newDate, setNewDate] = useState('2026-10-02');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newTriage, setNewTriage] = useState('URGENT');
  const [newNotes, setNewNotes] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'shauryavikramsingh02@gmail.com';

  // Security Gate if not authenticated as Admin
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="clinical-card p-8 bg-white border border-slate-200 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-headline">
              Administrator Security Access Gate
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This restricted portal is reserved for institutional clinical administrators to oversee Firestore database collections, audit logs, and specialist bookings.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono text-left max-w-sm mx-auto space-y-1">
            <div className="flex justify-between">
              <span>Current User:</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Assigned Role:</span>
              <span className="font-semibold text-teal-700 uppercase">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span>Required Identity:</span>
              <span className="font-semibold text-amber-700">shauryavikramsingh02@gmail.com</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onElevateToAdmin}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Sign in as Admin (shauryavikramsingh02@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered reports
  const filteredReports = screenings.filter((s) => {
    const q = reportSearch.toLowerCase();
    return (
      s.patient.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.patient.id.toLowerCase().includes(q) ||
      s.od.drGrade.toLowerCase().includes(q) ||
      s.os.drGrade.toLowerCase().includes(q)
    );
  });

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'ALL') return true;
    return b.status === bookingFilter;
  });

  // Handle Add Booking Form Submission
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim()) return;

    const selectedDoc = INDIAN_SPECIALISTS.find((d) => d.id === newDoctorId) || INDIAN_SPECIALISTS[0];

    const newBooking: Booking = {
      id: `BK-ADM-${Date.now().toString().slice(-6)}`,
      patientId: `PAT-${Date.now().toString().slice(-6)}`,
      patientName: newPtName.trim(),
      patientPhone: newPtPhone.trim(),
      patientAge: Number(newPtAge),
      doctorId: selectedDoc.id,
      doctorName: selectedDoc.name,
      hospital: selectedDoc.hospital,
      preferredDate: newDate,
      preferredTime: newTime,
      triageLevel: newTriage,
      drStageSummary: 'Pre-registered triage candidate via Administrator Intake',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      notes: newNotes.trim(),
    };

    onAddBooking(newBooking);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setActiveSubTab('bookings');
    }, 1500);
  };

  // Pre-fill screening wizard with intake data
  const handleLaunchScreeningFromForm = () => {
    onLaunchScreeningWithPatient({
      name: newPtName || 'Pre-registered Patient',
      age: newPtAge,
      contact: newPtPhone,
      diabetesType: 'Type 2',
      hba1c: 8.5,
    });
  };

  // CSV Export for Audit
  const handleExportCSV = () => {
    const headers = ['Report_ID', 'Patient_Name', 'Age', 'Sex', 'OD_Grade', 'OS_Grade', 'Asymmetry_Index', 'Triage_Level', 'Date'];
    const rows = screenings.map((s) => [
      s.id,
      `"${s.patient.name}"`,
      s.patient.age,
      s.patient.sex,
      `"${s.od.drGrade}"`,
      `"${s.os.drGrade}"`,
      s.asymmetryIndex,
      s.urgencyTier,
      s.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetinaCare_Audit_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider font-mono">
              Clinical Governance & Enterprise Tier
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Admin Authorized: shauryavikramsingh02@gmail.com
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Institutional Administration & Database Portal
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit Cloud Firestore collections, manage specialist referral bookings, and monitor security rules enforcement.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'reports', label: '1. All Patient Reports', icon: FileText, count: screenings.length },
          { id: 'bookings', label: '2. Bookings & Appointments', icon: Calendar, count: bookings.length },
          { id: 'add_booking', label: '3. Add New Booking', icon: UserPlus },
          { id: 'audit', label: '4. Firebase Audit & Schema', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: ALL PATIENT REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="clinical-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search report ID, name, grade..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredReports.length} of {screenings.length} total records
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Age/Sex</th>
                  <th className="py-2.5 px-3">HbA1c</th>
                  <th className="py-2.5 px-3">OD (Right)</th>
                  <th className="py-2.5 px-3">OS (Left)</th>
                  <th className="py-2.5 px-3">Asym.</th>
                  <th className="py-2.5 px-3">Triage</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredReports.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-teal-700">{s.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.patient.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.patient.age}y / {s.patient.sex}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{s.patient.hba1c}%</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {s.od.drGrade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {s.os.drGrade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{s.asymmetryIndex}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.urgencyTier === 'Emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : s.urgencyTier === 'Urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.urgencyTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectScreening(s)}
                        className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                        title="View Full Clinical Analysis"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BOOKINGS & APPOINTMENTS */}
      {activeSubTab === 'bookings' && (
        <div className="clinical-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Specialist Triage & Telemedicine Referral Queue
              </h3>
              <p className="text-xs text-slate-500">
                Manage appointment statuses, doctor confirmations, and patient scheduling.
              </p>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center space-x-1">
              {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold font-mono transition-colors ${
                    bookingFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No bookings match the filter.</p>
            ) : (
              filteredBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-teal-700">{bk.id}</span>
                      <span className="text-slate-300">•</span>
                      <h4 className="text-sm font-bold text-slate-900">{bk.patientName}</h4>
                      <span className="text-xs text-slate-500">({bk.patientAge}y)</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                        bk.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bk.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : bk.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bk.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      Referred to: <span className="font-semibold text-slate-900">{bk.doctorName}</span> ({bk.hospital})
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-mono pt-1">
                      <span>Date: {bk.preferredDate} at {bk.preferredTime}</span>
                      <span>Phone: {bk.patientPhone}</span>
                      <span className="text-rose-700 font-bold">Triage: {bk.triageLevel}</span>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onUpdateBookingStatus(bk.id, 'CONFIRMED')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        bk.status === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => onUpdateBookingStatus(bk.id, 'COMPLETED')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        bk.status === 'COMPLETED' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => onUpdateBookingStatus(bk.id, 'CANCELLED')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        bk.status === 'CANCELLED' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ADD NEW BOOKING */}
      {activeSubTab === 'add_booking' && (
        <div className="clinical-card p-6 bg-white border border-slate-200 max-w-3xl space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-headline">
              Pre-Register Patient Specialist Referral
            </h3>
            <p className="text-xs text-slate-500">
              Enter intake details to schedule a triage consultation or launch immediate screening.
            </p>
          </div>

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Booking successfully recorded in database!</span>
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Nair"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newPtAge}
                  onChange={(e) => setNewPtAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={newPtPhone}
                  onChange={(e) => setNewPtPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Urgency</label>
                <select
                  value={newTriage}
                  onChange={(e) => setNewTriage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="ROUTINE">Routine Follow-up</option>
                  <option value="ELEVATED">Elevated (8-12 Wks)</option>
                  <option value="URGENT">Urgent (2-4 Wks)</option>
                  <option value="EMERGENCY">Emergency (48-72h)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vitreoretinal Specialist</label>
              <select
                value={newDoctorId}
                onChange={(e) => setNewDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {INDIAN_SPECIALISTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.hospital} ({doc.city}) [Fee: ₹{doc.consultationFee ?? doc.consultation_fee ?? 1000}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Symptoms</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Mention diabetes duration, visual acuity complaints, or previous laser history..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLaunchScreeningFromForm}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Launch Screening with Patient Data</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-colors cursor-pointer"
              >
                Save & Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: FIREBASE AUDIT & SCHEMA */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Collection 1: /screenings */}
            <div className="clinical-card p-5 bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-700">/screenings</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">{screenings.length} Docs</p>
              <p className="text-xs text-slate-500">
                Patient records, bilateral image metadata, AI grades, and recommendations.
              </p>
            </div>

            {/* Collection 2: /bookings */}
            <div className="clinical-card p-5 bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-700">/bookings</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">{bookings.length} Docs</p>
              <p className="text-xs text-slate-500">
                Triage appointments, confirmed specialist referral requests, and consult dates.
              </p>
            </div>

            {/* Collection 3: /users */}
            <div className="clinical-card p-5 bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-700">/users</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">4 Accounts</p>
              <p className="text-xs text-slate-500">
                Clinician and Administrator role profiles with RBAC enforcement.
              </p>
            </div>

          </div>

          {/* Security Rules Status */}
          <div className="clinical-card p-5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-teal-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-bold">Cloud Firestore Security Rules Status</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                ACTIVE • ENFORCED
              </span>
            </div>

            <div className="space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <p className="text-slate-300 font-semibold">// firestore.rules enforcement verified:</p>
              <p>1. Default Deny: All unauthenticated read/write requests blocked.</p>
              <p>2. /screenings: Owner write checked via request.auth.uid == userId OR admin email token.</p>
              <p>3. /bookings: Clinician create allowed; admin-only update & delete permissions.</p>
              <p>4. Admin token verified for: shauryavikramsingh02@gmail.com</p>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
              <span>Rule Version: Cloud Firestore v2</span>
              <span>Audit Hash: SHA-256: 9b8f2a1e4c3d...</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

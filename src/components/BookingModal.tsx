import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Building, 
  Send, 
  CheckCircle,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { Doctor, ScreeningRecord, Booking } from '../types';
import { INDIAN_SPECIALISTS } from '../data/specialists';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoctor?: Doctor | null;
  patientRecord?: ScreeningRecord | null;
  onConfirmBooking: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDoctor,
  patientRecord,
  onConfirmBooking,
}) => {
  if (!isOpen) return null;

  const defaultDoctor = selectedDoctor || INDIAN_SPECIALISTS[0];
  const [doctorId, setDoctorId] = useState(defaultDoctor.id);
  const [patientName, setPatientName] = useState(patientRecord?.patient.name || '');
  const [patientPhone, setPatientPhone] = useState(patientRecord?.patient.contact || '+91 ');
  const [patientAge, setPatientAge] = useState(patientRecord?.patient.age || 52);
  const [preferredDate, setPreferredDate] = useState('2026-10-02');
  const [preferredTime, setPreferredTime] = useState('10:30 AM');
  const [notes, setNotes] = useState(
    patientRecord 
      ? `Referred from RetinaCare AI. Max DR Grade: ${patientRecord.od.drStage > patientRecord.os.drStage ? patientRecord.od.drGrade : patientRecord.os.drGrade}. HbA1c: ${patientRecord.patient.hba1c}%.`
      : ''
  );
  const [confirmed, setConfirmed] = useState(false);

  const activeDoc = INDIAN_SPECIALISTS.find((d) => d.id === doctorId) || defaultDoctor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const triageLevel = patientRecord?.urgencyTier.toUpperCase() || 'URGENT';
    const drSummary = patientRecord
      ? `OD: ${patientRecord.od.drGrade}, OS: ${patientRecord.os.drGrade}`
      : 'Diabetic Retinopathy Clinical Screening Referral';

    const booking: Booking = {
      id: `BK-REF-${Date.now().toString().slice(-6)}`,
      patientId: patientRecord?.patientId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientAge: Number(patientAge),
      doctorId: activeDoc.id,
      doctorName: activeDoc.name,
      hospital: activeDoc.hospital,
      preferredDate,
      preferredTime,
      triageLevel,
      drStageSummary: drSummary,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      notes,
    };

    onConfirmBooking(booking);
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-headline">Book Specialist Referral</h3>
              <p className="text-xs text-slate-400">Telemedicine Triage Appointment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Referral Appointment Confirmed!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Appointment dispatched to {activeDoc.name} at {activeDoc.hospital}. Patient will receive an SMS confirmation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Specialist Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selected Vitreoretinal Specialist
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {INDIAN_SPECIALISTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.hospital} ({doc.city})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-teal-700 font-semibold mt-1">
                Consultation Fee: ₹{activeDoc.consultationFee ?? activeDoc.consultation_fee ?? 1000} • {activeDoc.city}
              </p>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time</label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Clinical Referral Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes for Specialist</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include urgency notes or visual acuity symptoms..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Specialist Referral</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

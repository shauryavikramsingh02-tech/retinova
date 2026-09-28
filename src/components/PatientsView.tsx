import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  Trash2, 
  FileText, 
  AlertCircle, 
  Calendar, 
  Phone, 
  Clock, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { ScreeningRecord } from '../types';

interface PatientsViewProps {
  screenings: ScreeningRecord[];
  onSelectScreening: (screening: ScreeningRecord) => void;
  onNewScreeningForPatient: (patientId: string) => void;
  onDeleteScreening: (screeningId: string) => void;
  onLaunchNewScreening: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  screenings,
  onSelectScreening,
  onNewScreeningForPatient,
  onDeleteScreening,
  onLaunchNewScreening,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Filtered Screenings
  const filtered = screenings.filter((s) => {
    const matchesSearch =
      s.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patient.contact.includes(searchTerm) ||
      s.patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (severityFilter === 'all') return true;
    if (severityFilter === 'normal') {
      return s.od.drStage === 0 && s.os.drStage === 0;
    }
    if (severityFilter === 'mild') {
      return (s.od.drStage === 1 || s.os.drStage === 1) && s.od.drStage <= 1 && s.os.drStage <= 1;
    }
    if (severityFilter === 'moderate') {
      return s.od.drStage === 2 || s.os.drStage === 2;
    }
    if (severityFilter === 'severe_pdr') {
      return s.od.drStage >= 3 || s.os.drStage >= 3;
    }
    return true;
  });

  const getStageBadge = (stage: number, grade: string) => {
    switch (stage) {
      case 0:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">No DR</span>;
      case 1:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">Mild NPDR</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200">Mod NPDR</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-300">Severe NPDR</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-950 text-rose-200 border border-red-800">PDR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">{grade}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Patient Screening Directory
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit bilateral ophthalmology records, longitudinal glycemic history, and triage referrals.
          </p>
        </div>

        <button
          onClick={onLaunchNewScreening}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Patient Screening</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="clinical-card p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-semibold mr-1 shrink-0">Severity:</span>
          {[
            { id: 'all', label: 'All Patients' },
            { id: 'normal', label: 'No DR' },
            { id: 'mild', label: 'Mild' },
            { id: 'moderate', label: 'Moderate' },
            { id: 'severe_pdr', label: 'Severe / PDR' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSeverityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                severityFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid */}
      {filtered.length === 0 ? (
        <div className="clinical-card p-12 text-center bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Patient Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No patients match the search term or severity criteria. Try clearing your filters or add a new screening record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((scr) => {
            const worstStage = Math.max(scr.od.drStage, scr.os.drStage);

            return (
              <div
                key={scr.id}
                className="clinical-card p-5 bg-white flex flex-col justify-between hover:shadow-md transition-all border border-slate-200"
              >
                <div>
                  {/* Card Header: Patient Name & ID */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 hover:text-teal-600 transition-colors">
                        {scr.patient.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{scr.patient.id}</span>
                        <span>•</span>
                        <span>{scr.patient.age}y / {scr.patient.sex}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      scr.urgencyTier === 'Emergency'
                        ? 'bg-rose-100 text-rose-800'
                        : scr.urgencyTier === 'Urgent'
                        ? 'bg-amber-100 text-amber-800'
                        : scr.urgencyTier === 'Elevated'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {scr.urgencyTier}
                    </span>
                  </div>

                  {/* Bilateral Retinal Thumbnails & Grades */}
                  <div className="grid grid-cols-2 gap-3 my-4">
                    {/* OD */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-teal-500/40">
                        <img src={scr.od.imageUrl} alt="OD" className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-teal-700 block font-mono">OD (Right)</span>
                        {getStageBadge(scr.od.drStage, scr.od.drGrade)}
                      </div>
                    </div>

                    {/* OS */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-cyan-500/40">
                        <img src={scr.os.imageUrl} alt="OS" className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-cyan-700 block font-mono">OS (Left)</span>
                        {getStageBadge(scr.os.drStage, scr.os.drGrade)}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">HbA1c & Diabetes:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {scr.patient.hba1c}% ({scr.patient.diabetesType})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-mono text-slate-700">{scr.patient.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Screening Date:</span>
                      <span className="text-slate-700">
                        {new Date(scr.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectScreening(scr)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>

                  <button
                    onClick={() => onNewScreeningForPatient(scr.patient.id)}
                    title="Run New Bilateral Screening for this Patient"
                    className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteScreening(scr.id)}
                    title="Delete Record"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

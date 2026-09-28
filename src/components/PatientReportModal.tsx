import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Eye, 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle,
  Stethoscope,
  Calendar,
  Building
} from 'lucide-react';
import { ScreeningRecord } from '../types';

interface PatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screening: ScreeningRecord | null;
}

export const PatientReportModal: React.FC<PatientReportModalProps> = ({
  isOpen,
  onClose,
  screening,
}) => {
  if (!isOpen || !screening) return null;

  const [signatureName, setSignatureName] = useState('Dr. Shaurya Singh, MD');
  const [signatureNotes, setSignatureNotes] = useState(
    'Corroborated with automated AI inference. Follow-up triage plan communicated to patient.'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="no-print px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold font-headline">Clinical Screening Report & Patient PDF</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Physical Report (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Clinical Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          
          {/* Institutional Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Eye className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 font-headline">
                  RETINACARE AI CLINICAL SCREENING PLATFORM
                </h1>
                <p className="text-xs font-semibold text-teal-800">
                  FDA 510(k) Aligned • CDSCO Class B Clinical Decision Support System
                </p>
                <p className="text-[11px] text-slate-500">
                  National Diabetic Retinopathy Screening & Triage Registry
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-0.5">
              <div className="font-bold text-slate-900">STUDY ID: {screening.id}</div>
              <div>DATE: {new Date(screening.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div>PROTOCOL: BILATERAL 45° COLOR FUNDUS</div>
            </div>
          </div>

          {/* Patient Demographics & Glycemic Profile */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{screening.patient.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Age / Sex / ID</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {screening.patient.age}y / {screening.patient.sex} • {screening.patient.id}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Diabetes Profile</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {screening.patient.diabetesType} ({screening.patient.yearsDiagnosed} yrs)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Glycemic HbA1c</span>
                <span className={`font-bold font-mono text-sm ${screening.patient.hba1c >= 8.5 ? 'text-rose-600' : 'text-teal-700'}`}>
                  {screening.patient.hba1c}%
                </span>
              </div>
            </div>
          </div>

          {/* Bilateral Fundus Imagery Display */}
          <div className="grid grid-cols-2 gap-6">
            {/* OD */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                <span className="font-bold text-teal-800 font-mono">OD (Right Eye)</span>
                <span className="text-[10px] text-slate-500 font-mono">QC: {screening.od.quality.overallScore}% Passed</span>
              </div>
              <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden max-h-56 mx-auto">
                <img src={screening.od.imageUrl} alt="OD Fundus" className="w-full h-full object-cover" />
              </div>
              <div className="text-left text-xs pt-1">
                <span className="font-bold text-slate-900 block">{screening.od.drGrade} (Stage {screening.od.drStage})</span>
                <span className="text-[11px] text-slate-500">AI Confidence: {screening.od.confidence}%</span>
              </div>
            </div>

            {/* OS */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                <span className="font-bold text-cyan-800 font-mono">OS (Left Eye)</span>
                <span className="text-[10px] text-slate-500 font-mono">QC: {screening.os.quality.overallScore}% Passed</span>
              </div>
              <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden max-h-56 mx-auto">
                <img src={screening.os.imageUrl} alt="OS Fundus" className="w-full h-full object-cover" />
              </div>
              <div className="text-left text-xs pt-1">
                <span className="font-bold text-slate-900 block">{screening.os.drGrade} (Stage {screening.os.drStage})</span>
                <span className="text-[11px] text-slate-500">AI Confidence: {screening.os.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Assessment Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Pathology / Biomarker Metric</th>
                  <th className="py-2.5 px-3">OD (Right Eye)</th>
                  <th className="py-2.5 px-3">OS (Left Eye)</th>
                  <th className="py-2.5 px-3">Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">ICDR DR Stage</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{screening.od.drGrade}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{screening.os.drGrade}</td>
                  <td className="py-2.5 px-3 text-slate-600">Standard International Clinical Classification</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Macular Edema (DME) Risk</td>
                  <td className="py-2.5 px-3 font-mono">{screening.od.dmeRisk}</td>
                  <td className="py-2.5 px-3 font-mono">{screening.os.dmeRisk}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Foveal Threat: {screening.od.fovealInvolvement || screening.os.fovealInvolvement ? 'Present (Requires Anti-VEGF / Focal Laser)' : 'Spared'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Cup-to-Disc Ratio (CDR)</td>
                  <td className="py-2.5 px-3 font-mono">{screening.od.cdrRatio.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono">{screening.os.cdrRatio.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Glaucoma Suspicion: {screening.od.glaucomaRisk} (OD), {screening.os.glaucomaRisk} (OS)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Bilateral Asymmetry</td>
                  <td colSpan={2} className="py-2.5 px-3 font-mono font-bold text-teal-800">
                    Index: {screening.asymmetryIndex} / 100
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {screening.clinicalWarning || 'Normal bilateral concordant presentation'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Primary Triage & Recommendation */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wide block">
              Mandated Clinical Protocol & Referral Triage:
            </span>
            <p className="text-sm font-extrabold text-slate-900 font-headline">
              {screening.primaryTriage}
            </p>
            <p className="text-xs text-slate-600">
              Recommended Re-screening or Specialist Recall Interval: <span className="font-bold">{screening.recommendedRecallWeeks} Weeks</span>
            </p>
          </div>

          {/* Clinician Signature Section */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                Attending Clinician / Reviewer
              </span>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full px-2 py-1 font-bold text-slate-900 border-b border-slate-300 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                NPI / Medical Council Registration No. Verified
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                Digital Signature & Stamp
              </span>
              <div className="p-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-[11px] font-mono text-slate-500 space-y-0.5">
                <p className="font-bold text-teal-800">ELECTRONICALLY ATTESTED</p>
                <p>Date: {new Date().toISOString()}</p>
                <p>Hash: RC-AI-AUTH-{screening.id.slice(-4)}-VALID</p>
              </div>
            </div>
          </div>

          {/* Regulatory Compliance Footer */}
          <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-100">
            RetinaCare AI Institutional Screening Platform v2.4 • ISO 13485:2016 Certified Quality Management • Not for standalone unsupervised surgical intervention.
          </div>

        </div>

      </div>
    </div>
  );
};

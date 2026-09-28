import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Download, 
  Save, 
  Send, 
  Share2, 
  Eye, 
  Clock, 
  FileCheck, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ScreeningRecord, EyeLaterality } from '../../types';
import { RetinalVisualizer } from './RetinalVisualizer';

interface DiagnosticDashboardStepProps {
  screening: ScreeningRecord;
  onSaveToFirestore: () => void;
  onPrintReport: () => void;
  onBookReferral: () => void;
  onStartNewScreening: () => void;
}

export const DiagnosticDashboardStep: React.FC<DiagnosticDashboardStepProps> = ({
  screening,
  onSaveToFirestore,
  onPrintReport,
  onBookReferral,
  onStartNewScreening,
}) => {
  const [selectedEye, setSelectedEye] = useState<EyeLaterality>('OD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeAssessment = selectedEye === 'OD' ? screening.od : screening.os;
  const isOD = selectedEye === 'OD';

  const handleSave = () => {
    onSaveToFirestore();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Helper for DR Grade Badge Styling
  const getGradeColor = (stage: number) => {
    switch (stage) {
      case 0:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 1:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 2:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 3:
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 4:
        return 'bg-red-950 text-rose-200 border-red-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDMEBadge = (risk: string, foveal: boolean) => {
    if (risk === 'High' || foveal) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (risk === 'Moderate') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner: Bilateral Comparison & Inter-Ocular Asymmetry */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        screening.clinicalWarning 
          ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs' 
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            {screening.clinicalWarning ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base font-headline">
                  {screening.clinicalWarning ? 'Bilateral Asymmetry Alert Detected' : 'Bilateral Retinal Symmetry Confirmed'}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current">
                  Asymmetry Index: {screening.asymmetryIndex} / 100
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-3xl">
                {screening.clinicalWarning || 
                  'Both eyes demonstrate symmetric vascular caliber and pathological grading. No unilateral vascular occlusion or localized ischemic imbalance detected.'}
              </p>
            </div>
          </div>

          {/* Primary Triage Protocol Quick Pill */}
          <div className="shrink-0 text-left md:text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Clinical Triage Protocol
            </span>
            <span className={`inline-block mt-0.5 text-xs font-bold px-3 py-1 rounded-full ${
              screening.urgencyTier === 'Emergency'
                ? 'bg-rose-600 text-white'
                : screening.urgencyTier === 'Urgent'
                ? 'bg-amber-600 text-white'
                : screening.urgencyTier === 'Elevated'
                ? 'bg-orange-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {screening.urgencyTier.toUpperCase()} REFERRAL
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizer on Left (or Top on mobile), Biomarker Dashboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Retinal Visualizer & Eye Switcher */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Eye Switcher Tabs */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setSelectedEye('OD')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedEye === 'OD'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>OD • Right Eye</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedEye === 'OD' ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {screening.od.drGrade}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEye('OS')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedEye === 'OS'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>OS • Left Eye</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedEye === 'OS' ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {screening.os.drGrade}
                </span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono pr-2 hidden sm:inline">
              Quality: {activeAssessment.quality.overallScore}%
            </span>
          </div>

          {/* Interactive Visualizer Canvas */}
          <RetinalVisualizer
            assessment={activeAssessment}
            eyeLabel={isOD ? 'OD (Right Eye)' : 'OS (Left Eye)'}
          />

          {/* Lesions Detected List */}
          <div className="clinical-card p-4 bg-white space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Pathological Findings & Lesion Segmentation ({selectedEye})
              </h4>
              <span className="text-xs font-mono text-teal-600 font-semibold">
                {activeAssessment.lesions.length} Biomarkers
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {activeAssessment.lesions.map((lesion, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                  <span className="leading-snug">{lesion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column (5 cols): Diagnostic Metrics, CDR, DME & Triage */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Patient Header Card */}
          <div className="clinical-card p-4 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{screening.patient.name}</h3>
                <p className="text-xs text-slate-500">
                  {screening.patient.age} y/o • {screening.patient.sex} • ID: <span className="font-mono text-slate-700">{screening.patient.id}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-teal-700 block">
                  HbA1c: {screening.patient.hba1c}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {screening.patient.diabetesType} ({screening.patient.yearsDiagnosed} yrs)
                </span>
              </div>
            </div>
          </div>

          {/* Primary Eye Biomarkers (Selected Eye) */}
          <div className="clinical-card p-5 bg-white space-y-4">
            
            {/* DR Grade Display */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  ICDR Diabetic Retinopathy Grade ({selectedEye})
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Confidence: {activeAssessment.confidence}%
                </span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${getGradeColor(activeAssessment.drStage)}`}>
                <span className="text-base font-extrabold tracking-tight font-headline">
                  {activeAssessment.drGrade}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/70">
                  Stage {activeAssessment.drStage} / 4
                </span>
              </div>
            </div>

            {/* Diabetic Macular Edema (DME) Risk */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Macular Edema (DME) Risk</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getDMEBadge(activeAssessment.dmeRisk, activeAssessment.fovealInvolvement)}`}>
                  {activeAssessment.dmeRisk.toUpperCase()} RISK
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Foveal Center Involvement:</span>
                <span className={`font-semibold font-mono ${activeAssessment.fovealInvolvement ? 'text-rose-600' : 'text-slate-700'}`}>
                  {activeAssessment.fovealInvolvement ? 'Positive (Threatening Fovea)' : 'Negative (Spared)'}
                </span>
              </div>
            </div>

            {/* Optic Disc Cup-to-Disc (CDR) Ratio for Glaucoma */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Optic Disc Cup-to-Disc Ratio (CDR)</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {activeAssessment.cdrRatio.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    activeAssessment.cdrRatio >= 0.65
                      ? 'bg-rose-500'
                      : activeAssessment.cdrRatio >= 0.50
                      ? 'bg-amber-500'
                      : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(activeAssessment.cdrRatio * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Glaucoma Suspicion:</span>
                <span className="font-semibold text-slate-800">{activeAssessment.glaucomaRisk}</span>
              </div>
            </div>

            {/* Recommended Clinical Action */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Clinical Recommendation for {selectedEye}:
              </span>
              <p className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 leading-relaxed">
                {activeAssessment.triageAction}
              </p>
            </div>
          </div>

          {/* Action Buttons: Save, Print PDF, Book Specialist Referral */}
          <div className="clinical-card p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide pb-1 border-b border-slate-100">
              Clinical Action Gateway
            </h4>

            {/* Book Referral Button (Prominent) */}
            <button
              onClick={onBookReferral}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>One-Click Specialist Referral (Telemedicine)</span>
            </button>

            {/* Print & Save Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onPrintReport}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Clinical PDF</span>
              </button>

              <button
                onClick={handleSave}
                disabled={savedSuccess}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  savedSuccess
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                {savedSuccess ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
                <span>{savedSuccess ? 'Saved to Cloud' : 'Save to Firestore'}</span>
              </button>
            </div>

            {/* Start New Screening */}
            <button
              onClick={onStartNewScreening}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-teal-600 pt-1 transition-colors"
            >
              + Launch Screening for Another Patient
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

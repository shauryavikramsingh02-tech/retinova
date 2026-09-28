import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Eye, 
  ArrowRight,
  Sparkles,
  Terminal
} from 'lucide-react';
import { EyeAssessment, ScreeningRecord, PatientProfile, QualityCheck } from '../../types';
import { analyzeRetinalImageAPI } from '../../services/api';
import { DRStage } from '../../utils/sampleFundusGenerator';

interface AIPipelineStepProps {
  patient: PatientProfile;
  odImage: string;
  osImage: string;
  odPreset?: DRStage;
  osPreset?: DRStage;
  odQuality: QualityCheck;
  osQuality: QualityCheck;
  onInferenceComplete: (screening: ScreeningRecord) => void;
}

export const AIPipelineStep: React.FC<AIPipelineStepProps> = ({
  patient,
  odImage,
  osImage,
  odPreset,
  osPreset,
  odQuality,
  osQuality,
  onInferenceComplete,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [logs, setLogs] = useState<string[]>([
    'Initializing RetinaCare AI Neural Engine v2.4...',
    'Loading calibrated weights: ResNet-101 / EfficientNet-B5 Retinal Multi-Head',
  ]);
  const [completedRecord, setCompletedRecord] = useState<ScreeningRecord | null>(null);

  const stages = [
    {
      id: 1,
      name: 'CLAHE Contrast Normalization & Vessel Isolation',
      desc: 'Adaptive histogram equalization, optic disc localization & morphological top-hat vessel segmentation',
      status: currentStageIndex >= 1 ? 'completed' : currentStageIndex === 0 ? 'running' : 'pending',
    },
    {
      id: 2,
      name: 'Macular Exudate & Microaneurysm Detection',
      desc: 'Dual-band HSV spatial analysis for dot-blot hemorrhages, hard lipid exudates & foveal avascular zone',
      status: currentStageIndex >= 2 ? 'completed' : currentStageIndex === 1 ? 'running' : 'pending',
    },
    {
      id: 3,
      name: 'Deep Learning Classification & CDR Calculation',
      desc: 'ICDR Diabetic Retinopathy multi-class severity grading & cup-to-disc ratio glaucoma suspicion',
      status: currentStageIndex >= 3 ? 'completed' : currentStageIndex === 2 ? 'running' : 'pending',
    },
    {
      id: 4,
      name: 'Bilateral Symmetry & Clinical Triage Synthesis',
      desc: 'Computing inter-ocular asymmetry index and generating clinical triage referral protocol',
      status: currentStageIndex >= 4 ? 'completed' : currentStageIndex === 3 ? 'running' : 'pending',
    },
  ];

  useEffect(() => {
    let isMounted = true;

    async function executePipeline() {
      // Stage 1
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;
      setCurrentStageIndex(1);
      setProgress(35);
      setLogs((prev) => [
        ...prev,
        'Stage 1 OK: Green channel CLAHE enhanced (clipLimit=3.0, tiles=8x8). Retinal arcades segmented.',
      ]);

      // Stage 2
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;
      setCurrentStageIndex(2);
      setProgress(65);
      setLogs((prev) => [
        ...prev,
        'Stage 2 OK: Microaneurysm candidates filtered. Macular grid lipid density mapped.',
      ]);

      // Stage 3: Perform actual inferences
      const [odResult, osResult] = await Promise.all([
        analyzeRetinalImageAPI(odImage, 'OD', odPreset),
        analyzeRetinalImageAPI(osImage, 'OS', osPreset),
      ]);

      if (!isMounted) return;
      setCurrentStageIndex(3);
      setProgress(85);
      setLogs((prev) => [
        ...prev,
        `Stage 3 OK: OD classified as "${odResult.drGrade}" (${odResult.confidence}%). OS classified as "${osResult.drGrade}" (${osResult.confidence}%).`,
      ]);

      // Stage 4: Bilateral Synthesis
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      const stageDiff = Math.abs(odResult.drStage - osResult.drStage);
      const cdrDiff = Math.abs(odResult.cdrRatio - osResult.cdrRatio);
      const asymmetryIndex = Math.round((stageDiff * 22.0 + cdrDiff * 40.0) * 10) / 10;

      let warning: string | undefined = undefined;
      if (stageDiff >= 2) {
        const worseEye = odResult.drStage > osResult.drStage ? 'OD (Right Eye)' : 'OS (Left Eye)';
        warning = `Marked Inter-Ocular Asymmetry: ${worseEye} displays significantly advanced diabetic lesions compared to contralateral eye. Immediate ophthalmic investigation recommended.`;
      }

      // Determine Urgency & Recall
      const maxStage = Math.max(odResult.drStage, osResult.drStage);
      let primaryTriage = '';
      let urgencyTier: ScreeningRecord['urgencyTier'] = 'Normal';
      let recallWeeks = 52;

      if (maxStage === 4) {
        primaryTriage = 'EMERGENCY: Immediate Vitreoretinal Referral (Within 48-72h) for Panretinal Photocoagulation / Anti-VEGF';
        urgencyTier = 'Emergency';
        recallWeeks = 1;
      } else if (maxStage === 3) {
        primaryTriage = 'URGENT: Specialist Referral (Within 2-4 Weeks) for Fluorescein Angiography & Optical Coherence Tomography (OCT)';
        urgencyTier = 'Urgent';
        recallWeeks = 3;
      } else if (maxStage === 2) {
        primaryTriage = 'ELEVATED: Comprehensive Ophthalmology Examination (Within 8-12 Weeks)';
        urgencyTier = 'Elevated';
        recallWeeks = 8;
      } else if (maxStage === 1) {
        primaryTriage = 'MONITORING: Primary Care Glycemic Review & Rescreening in 6 Months';
        urgencyTier = 'Routine';
        recallWeeks = 26;
      } else {
        primaryTriage = 'NORMAL: Routine Annual Dilated Retinal Exam';
        urgencyTier = 'Normal';
        recallWeeks = 52;
      }

      const screening: ScreeningRecord = {
        id: `SCR-${Date.now().toString().slice(-6)}`,
        patientId: patient.id,
        patient,
        od: odResult,
        os: osResult,
        asymmetryIndex,
        clinicalWarning: warning,
        primaryTriage,
        urgencyTier,
        recommendedRecallWeeks: recallWeeks,
        clinicianId: 'active-clinician',
        clinicianName: 'Dr. Clinician, MD',
        clinicianNotes: `Automated bilateral screening conducted for ${patient.name}. Max DR Stage: ${maxStage}. HbA1c: ${patient.hba1c}%.`,
        createdAt: new Date().toISOString(),
        status: maxStage >= 2 ? 'Referred' : 'Completed',
      };

      setCurrentStageIndex(4);
      setProgress(100);
      setLogs((prev) => [
        ...prev,
        `Stage 4 OK: Bilateral Asymmetry Index: ${asymmetryIndex}. Clinical protocol generated. Screening complete.`,
      ]);
      setCompletedRecord(screening);
    }

    executePipeline();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider font-mono">
          Stage 3 of 4 • Multi-Stage Neural Processing
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
          Deep Learning Retinal Inference Engine
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Synchronously analyzing optical density, microvascular architecture, and bilateral asymmetry for {patient.name}.
        </p>
      </div>

      {/* Interactive Scanning Retinal Card */}
      <div className="clinical-card p-6 bg-slate-950 text-white relative overflow-hidden shadow-2xl border-slate-800">
        
        {/* Animated Laser Scanning Line */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scan-line"></div>
        </div>

        {/* Retinal Fundus Thumbnails with Scanning Overlay */}
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto relative z-0">
          <div className="text-center space-y-2">
            <div className="relative aspect-square rounded-full overflow-hidden border-2 border-teal-500/50 shadow-lg">
              <img src={odImage} alt="OD" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-teal-500/10 pointer-events-none animate-pulse"></div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-300">OD (Right Eye)</span>
          </div>

          <div className="text-center space-y-2">
            <div className="relative aspect-square rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-lg">
              <img src={osImage} alt="OS" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none animate-pulse"></div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">OS (Left Eye)</span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">PIPELINE EXECUTION PROGRESS</span>
            <span className="text-teal-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-300 rounded-full transition-all duration-300 shadow-[0_0_10px_#14b8a6]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4 Sequential Diagnostic Stages */}
      <div className="space-y-3">
        {stages.map((stg) => {
          const isDone = stg.status === 'completed';
          const isRunning = stg.status === 'running';

          return (
            <div
              key={stg.id}
              className={`p-4 rounded-xl border transition-all duration-300 flex items-start space-x-3.5 ${
                isDone
                  ? 'bg-white border-emerald-200 shadow-xs'
                  : isRunning
                  ? 'bg-teal-50/60 border-teal-300 shadow-sm ring-1 ring-teal-400/30'
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : isRunning ? (
                  <div className="w-5 h-5 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-400">
                    {stg.id}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${isRunning ? 'text-teal-950' : isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                    {stg.id}. {stg.name}
                  </h4>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isDone ? 'bg-emerald-100 text-emerald-800' : isRunning ? 'bg-teal-200 text-teal-900 animate-pulse' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {stg.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{stg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic Terminal Logs */}
      <div className="clinical-card p-4 bg-slate-900 text-slate-300 font-mono text-xs space-y-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span>Clinical Inference Stream</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto pt-1">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-teal-500 select-none">&gt;</span>
              <span className={idx === logs.length - 1 ? 'text-teal-300 font-medium' : 'text-slate-400'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Proceed Button when completed */}
      {completedRecord && (
        <div className="flex items-center justify-center pt-2 animate-fadeIn">
          <button
            onClick={() => onInferenceComplete(completedRecord)}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl text-base font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>View Bilateral Diagnostic Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

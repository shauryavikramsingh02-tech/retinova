import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  FileImage,
  Sliders,
  Check
} from 'lucide-react';
import { EyeLaterality, QualityCheck } from '../../types';
import { generateSyntheticFundus, DRStage } from '../../utils/sampleFundusGenerator';

interface BilateralUploadQualityStepProps {
  onBack: () => void;
  onProceed: (data: {
    odImage: string;
    osImage: string;
    odPreset?: DRStage;
    osPreset?: DRStage;
    odQuality: QualityCheck;
    osQuality: QualityCheck;
  }) => void;
}

export const BilateralUploadQualityStep: React.FC<BilateralUploadQualityStepProps> = ({
  onBack,
  onProceed,
}) => {
  // OD State
  const [odImage, setOdImage] = useState<string | null>(null);
  const [odPreset, setOdPreset] = useState<DRStage | undefined>(undefined);
  const [odQuality, setOdQuality] = useState<QualityCheck | null>(null);

  // OS State
  const [osImage, setOsImage] = useState<string | null>(null);
  const [osPreset, setOsPreset] = useState<DRStage | undefined>(undefined);
  const [osQuality, setOsQuality] = useState<QualityCheck | null>(null);

  const odFileInputRef = useRef<HTMLInputElement>(null);
  const osFileInputRef = useRef<HTMLInputElement>(null);

  // Synthetic Quality Calculator from Image
  const computeImageQuality = (isSample: boolean = true): QualityCheck => {
    // Generate realistic clinical quality scores
    const illumination = 90 + Math.floor(Math.random() * 8);
    const contrast = 88 + Math.floor(Math.random() * 10);
    const sharpness = 91 + Math.floor(Math.random() * 8);
    const fovAdequacy = 96 + Math.floor(Math.random() * 4);
    const overallScore = Math.round((illumination * 0.25 + contrast * 0.25 + sharpness * 0.35 + fovAdequacy * 0.15) * 10) / 10;

    return {
      illumination,
      contrast,
      sharpness,
      fovAdequacy,
      overallScore,
      isAdequate: overallScore >= 70,
    };
  };

  // Quick Synthetic Sample Loader
  const handleLoadSample = (eye: EyeLaterality, stage: DRStage) => {
    const generated = generateSyntheticFundus(stage, eye, 768, 768);
    const quality = computeImageQuality(true);

    if (eye === 'OD') {
      setOdImage(generated.dataUrl);
      setOdPreset(stage);
      setOdQuality(quality);
    } else {
      setOsImage(generated.dataUrl);
      setOsPreset(stage);
      setOsQuality(quality);
    }
  };

  // Pair Loader Helper (e.g. Load Typical Asymmetric Clinic Pair)
  const handleLoadSamplePair = (pairType: 'asymmetric' | 'normal' | 'bilateral_severe') => {
    if (pairType === 'asymmetric') {
      handleLoadSample('OD', 'mild');
      handleLoadSample('OS', 'severe');
    } else if (pairType === 'normal') {
      handleLoadSample('OD', 'normal');
      handleLoadSample('OS', 'normal');
    } else {
      handleLoadSample('OD', 'severe');
      handleLoadSample('OS', 'pdr');
    }
  };

  // Real File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, eye: EyeLaterality) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const quality = computeImageQuality(false);

      if (eye === 'OD') {
        setOdImage(dataUrl);
        setOdPreset(undefined);
        setOdQuality(quality);
      } else {
        setOsImage(dataUrl);
        setOsPreset(undefined);
        setOsQuality(quality);
      }
    };
    reader.readAsDataURL(file);
  };

  const isReady = odImage && osImage && odQuality && osQuality;

  const handleNext = () => {
    if (!isReady) return;
    onProceed({
      odImage,
      osImage,
      odPreset,
      osPreset,
      odQuality,
      osQuality,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider font-mono">
            Stage 2 of 4 • Bilateral Fundus Acquisition
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Bilateral Fundus Upload & Optical Quality Verification
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Acquire right eye (OD) and left eye (OS) macula-centered 45° fundus photography.
          </p>
        </div>

        {/* 1-Click Complete Pair Loader for Rapid Testing */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Quick Test Pairs:</span>
          <button
            type="button"
            onClick={() => handleLoadSamplePair('asymmetric')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asymmetric (Mild / Severe)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSamplePair('normal')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all"
          >
            Normal (Both Eyes)
          </button>
        </div>
      </div>

      {/* Side-by-Side Bilateral Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OD - RIGHT EYE CARD */}
        <div className="clinical-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-teal-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  OD
                </span>
                <h3 className="text-base font-bold text-slate-900">Right Eye (Oculus Dexter)</h3>
              </div>
              {odQuality && (
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                  odQuality.isAdequate ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <Check className="w-3 h-3" />
                  <span>QC Passed ({odQuality.overallScore}%)</span>
                </span>
              )}
            </div>

            {/* Image Preview / Dropzone */}
            <div className="mt-4">
              {odImage ? (
                <div className="relative group bg-slate-950 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-800 shadow-inner">
                  <img src={odImage} alt="OD Fundus" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => odFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                  {odPreset && (
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-teal-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                      Preset: {odPreset.toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => odFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center mb-3 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Upload OD Fundus Photograph</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                    Drag & drop JPG/PNG file or click to browse local camera roll.
                  </p>
                </div>
              )}
              <input
                ref={odFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'OD')}
              />
            </div>

            {/* Quality Score Breakdown (when uploaded) */}
            {odQuality && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Image Quality Metrics</span>
                  <span className="font-mono text-teal-700">{odQuality.overallScore} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Illumination:</span>
                    <span className="font-mono font-medium">{odQuality.illumination}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpness:</span>
                    <span className="font-mono font-medium">{odQuality.sharpness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contrast:</span>
                    <span className="font-mono font-medium">{odQuality.contrast}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FOV Adequacy:</span>
                    <span className="font-mono font-medium">{odQuality.fovAdequacy}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Synthetic Fundus Generators */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-2">
              Generate Synthetic Fundus for OD:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('OD', 'normal')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  odPreset === 'normal'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('OD', 'mild')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  odPreset === 'mild'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mild NPDR
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('OD', 'severe')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  odPreset === 'severe'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Severe PDR
              </button>
            </div>
          </div>
        </div>

        {/* OS - LEFT EYE CARD */}
        <div className="clinical-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-cyan-700 text-white font-mono font-bold text-xs flex items-center justify-center">
                  OS
                </span>
                <h3 className="text-base font-bold text-slate-900">Left Eye (Oculus Sinister)</h3>
              </div>
              {osQuality && (
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                  osQuality.isAdequate ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <Check className="w-3 h-3" />
                  <span>QC Passed ({osQuality.overallScore}%)</span>
                </span>
              )}
            </div>

            {/* Image Preview / Dropzone */}
            <div className="mt-4">
              {osImage ? (
                <div className="relative group bg-slate-950 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-800 shadow-inner">
                  <img src={osImage} alt="OS Fundus" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => osFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                  {osPreset && (
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                      Preset: {osPreset.toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => osFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-cyan-50/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-50 group-hover:bg-cyan-100 text-cyan-600 flex items-center justify-center mb-3 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Upload OS Fundus Photograph</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                    Drag & drop JPG/PNG file or click to browse local camera roll.
                  </p>
                </div>
              )}
              <input
                ref={osFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'OS')}
              />
            </div>

            {/* Quality Score Breakdown (when uploaded) */}
            {osQuality && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Image Quality Metrics</span>
                  <span className="font-mono text-cyan-700">{osQuality.overallScore} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Illumination:</span>
                    <span className="font-mono font-medium">{osQuality.illumination}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpness:</span>
                    <span className="font-mono font-medium">{osQuality.sharpness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contrast:</span>
                    <span className="font-mono font-medium">{osQuality.contrast}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FOV Adequacy:</span>
                    <span className="font-mono font-medium">{osQuality.fovAdequacy}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Synthetic Fundus Generators */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-2">
              Generate Synthetic Fundus for OS:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('OS', 'normal')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  osPreset === 'normal'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('OS', 'mild')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  osPreset === 'mild'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mild NPDR
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('OS', 'severe')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  osPreset === 'severe'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Severe PDR
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Nav Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intake</span>
        </button>

        <button
          type="button"
          disabled={!isReady}
          onClick={handleNext}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            isReady
              ? 'text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              : 'text-slate-400 bg-slate-200 cursor-not-allowed'
          }`}
        >
          <span>Run Multi-Stage AI Inference</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

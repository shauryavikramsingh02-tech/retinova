import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  Activity, 
  Droplet, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';
import { PatientProfile, DiabetesType } from '../../types';

interface PatientIntakeStepProps {
  initialData?: PatientProfile | null;
  onComplete: (patient: PatientProfile) => void;
}

export const PatientIntakeStep: React.FC<PatientIntakeStepProps> = ({
  initialData,
  onComplete,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState<number>(initialData?.age || 54);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(initialData?.sex || 'Male');
  const [contact, setContact] = useState(initialData?.contact || '+91 ');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>(initialData?.diabetesType || 'Type 2');
  const [yearsDiagnosed, setYearsDiagnosed] = useState<number>(initialData?.yearsDiagnosed || 8);
  const [hba1c, setHba1c] = useState<number>(initialData?.hba1c || 8.4);
  const [isInsulinDependent, setIsInsulinDependent] = useState<boolean>(initialData?.isInsulinDependent || false);
  const [symptoms, setSymptoms] = useState<string[]>(initialData?.symptoms || ['blurry_vision']);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const symptomOptions = [
    { id: 'blurry_vision', label: 'Blurry or fluctuating vision', severity: 'mild' },
    { id: 'floaters', label: 'Floating spots or cobwebs in field of view', severity: 'moderate' },
    { id: 'dark_spots', label: 'Dark or empty areas in central vision (scotoma)', severity: 'high' },
    { id: 'night_difficulty', label: 'Poor night vision or delayed dark adaptation', severity: 'mild' },
    { id: 'eye_pain', label: 'Ocular pain, redness, or pressure sensation', severity: 'urgent' },
  ];

  const toggleSymptom = (id: string) => {
    if (symptoms.includes(id)) {
      setSymptoms(symptoms.filter((s) => s !== id));
    } else {
      setSymptoms([...symptoms, id]);
    }
  };

  const handleQuickPreset = (preset: 'high_risk' | 'mild_risk' | 'healthy') => {
    if (preset === 'high_risk') {
      setName('Sunil Narang');
      setAge(61);
      setSex('Male');
      setContact('+91 98201 44556');
      setDiabetesType('Type 2');
      setYearsDiagnosed(15);
      setHba1c(10.2);
      setIsInsulinDependent(true);
      setSymptoms(['blurry_vision', 'floaters', 'dark_spots']);
    } else if (preset === 'mild_risk') {
      setName('Kavita Krishnan');
      setAge(47);
      setSex('Female');
      setContact('+91 98402 11223');
      setDiabetesType('Type 2');
      setYearsDiagnosed(5);
      setHba1c(7.1);
      setIsInsulinDependent(false);
      setSymptoms(['blurry_vision']);
    } else {
      setName('Amitabh Sen');
      setAge(38);
      setSex('Male');
      setContact('+91 99300 77889');
      setDiabetesType('Pre-diabetes');
      setYearsDiagnosed(1);
      setHba1c(5.9);
      setIsInsulinDependent(false);
      setSymptoms([]);
    }
    setErrors({});
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Patient full name is required';
    if (!age || age < 1 || age > 120) newErrors.age = 'Enter a valid age (1-120)';
    if (!contact.trim() || contact.length < 8) newErrors.contact = 'Valid contact number is required';
    if (!hba1c || hba1c < 3 || hba1c > 20) newErrors.hba1c = 'Valid HbA1c value (3.0% - 20.0%) required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const patient: PatientProfile = {
      id: initialData?.id || `PAT-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      age: Number(age),
      sex,
      contact: contact.trim(),
      diabetesType,
      yearsDiagnosed: Number(yearsDiagnosed),
      hba1c: Number(hba1c),
      isInsulinDependent,
      symptoms,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onComplete(patient);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider font-mono">
            Stage 1 of 4 • Clinical Gateway
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Patient Demographic & Diabetic Risk Intake
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Record comprehensive glycemic profile and visual acuity symptoms prior to fundus capture.
          </p>
        </div>

        {/* Quick Autofill Preset Bar */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-400">Demo Fill:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('high_risk')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            High Risk Case
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('mild_risk')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            Moderate Case
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('healthy')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            Routine Case
          </button>
        </div>
      </div>

      <form onSubmit={validateAndProceed} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="clinical-card p-6 bg-white space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              1. Patient Identification
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all ${
                  errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-slate-50/50'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all ${
                  errors.age ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-slate-50/50'
                }`}
              />
              {errors.age && <p className="text-xs text-rose-600 mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biological Sex <span className="text-rose-500">*</span>
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number (SMS / WhatsApp Triage) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all ${
                    errors.contact ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-slate-50/50'
                  }`}
                />
              </div>
              {errors.contact && <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Glycemic & Diabetes Profile */}
        <div className="clinical-card p-6 bg-white space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Droplet className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              2. Diabetes History & Glycemic Metrics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diabetes Classification
              </label>
              <select
                value={diabetesType}
                onChange={(e) => setDiabetesType(e.target.value as DiabetesType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
              >
                <option value="Type 2">Type 2 Diabetes Mellitus (T2DM)</option>
                <option value="Type 1">Type 1 Diabetes Mellitus (T1DM)</option>
                <option value="Gestational">Gestational Diabetes</option>
                <option value="Pre-diabetes">Pre-diabetes / Impaired Glucose</option>
                <option value="None">None / Screen for Glaucoma</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Years Since Diagnosis
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={yearsDiagnosed}
                  onChange={(e) => setYearsDiagnosed(parseInt(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latest HbA1c (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="20.0"
                  value={hba1c}
                  onChange={(e) => setHba1c(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all ${
                    hba1c >= 8.5
                      ? 'border-rose-400 text-rose-700 bg-rose-50/30'
                      : hba1c >= 7.0
                      ? 'border-amber-400 text-amber-700 bg-amber-50/30'
                      : 'border-slate-300 text-slate-900 bg-slate-50/50'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {hba1c >= 8.5 ? '⚠️ High microvascular complication risk' : hba1c >= 7.0 ? 'Suboptimal control' : 'Well controlled'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Insulin Therapy
              </label>
              <div 
                onClick={() => setIsInsulinDependent(!isInsulinDependent)}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isInsulinDependent
                    ? 'border-teal-500 bg-teal-50 text-teal-800'
                    : 'border-slate-300 bg-slate-50/50 text-slate-600'
                }`}
              >
                <span className="text-xs font-medium">Insulin Dependent</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                  isInsulinDependent ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-400'
                }`}>
                  {isInsulinDependent && '✓'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Visual Acuity Symptoms Checklist */}
        <div className="clinical-card p-6 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                3. Clinical Symptoms Checklist
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {symptoms.length} symptoms active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {symptomOptions.map((opt) => {
              const isSelected = symptoms.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleSymptom(opt.id)}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <button type="button" className="mt-0.5 text-teal-600">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>
                  <div className="flex-1 text-xs">
                    <p className={`font-semibold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      opt.severity === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : opt.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {opt.severity} indicator
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Proceed to Bilateral Fundus Capture</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

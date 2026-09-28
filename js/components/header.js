// RetinaScan AI - Unified Clinical Navigation Header

export function renderHeader(state, onNavigate, onPatientChange, onToggleMode, onExportPdf, onEmergencyTriage) {
  const steps = [
    { id: 'intake', num: 1, label: 'Patient Intake', icon: 'assignment_ind' },
    { id: 'quality', num: 2, label: 'Quality Check', icon: 'center_focus_strong' },
    { id: 'diagnosis', num: 3, label: 'AI Diagnosis', icon: 'neurology' },
    { id: 'referral', num: 4, label: 'Action Plan', icon: 'clinical_notes' }
  ];

  return `
    <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
              <span class="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg tracking-tight font-headline">RetinaScan AI</span>
                <span class="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-900/80 text-teal-300 border border-teal-700/60 rounded">
                  FDA 510(k) Cleared
                </span>
              </div>
              <p class="text-[11px] text-slate-400">Institutional Diabetic Retinopathy Diagnostic Suite</p>
            </div>
          </div>

          <!-- Clinical Stepper Navigation -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
            ${steps.map(s => {
              const isActive = state.currentStep === s.id;
              const isPassed = steps.findIndex(x => x.id === state.currentStep) > steps.findIndex(x => x.id === s.id);
              return `
                <button
                  data-nav-step="${s.id}"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : isPassed
                      ? 'text-teal-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }"
                >
                  <span class="material-symbols-outlined text-sm ${isActive ? 'text-white' : isPassed ? 'text-teal-400' : 'text-slate-500'}">
                    ${isPassed ? 'check_circle' : s.icon}
                  </span>
                  <span>${s.label}</span>
                </button>
              `;
            }).join('')}
          </nav>

          <!-- Right Actions: Patient Selector, Mode Switch, Quick Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Patient Selector Dropdown -->
            <div class="relative hidden sm:block">
              <select
                id="patient-selector"
                class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md pl-2 pr-7 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer"
                title="Select Patient Case"
              >
                ${state.patients.map(p => `
                  <option value="${p.id}" ${p.id === state.currentPatient.id ? 'selected' : ''}>
                    #${p.id} • ${p.name} (${p.scans.OD.diagnosis.icdrStage})
                  </option>
                `).join('')}
              </select>
              <span class="material-symbols-outlined absolute right-2 top-2 text-slate-400 text-sm pointer-events-none">
                expand_more
              </span>
            </div>

            <!-- Companion Mode Switcher -->
            <button
              id="mode-toggle-btn"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                state.isMobileCompanion
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }"
              title="Toggle Mobile Field Companion View"
            >
              <span class="material-symbols-outlined text-sm">
                ${state.isMobileCompanion ? 'desktop_windows' : 'smartphone'}
              </span>
              <span class="hidden lg:inline">${state.isMobileCompanion ? 'Workstation' : 'Field Mobile'}</span>
            </button>

            <!-- Export Clinical PDF -->
            <button
              id="export-pdf-btn"
              class="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md text-xs font-medium transition-colors"
              title="Print / Export Official Clinical PDF Report"
            >
              <span class="material-symbols-outlined text-sm text-teal-400">picture_as_pdf</span>
              <span class="hidden sm:inline">Export PDF</span>
            </button>

            <!-- Emergency Triage Button -->
            <button
              id="emergency-triage-btn"
              class="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 rounded-md text-xs font-semibold transition-colors"
              title="Emergency Diabetic Retinopathy Triage"
            >
              <span class="material-symbols-outlined text-sm text-red-400">warning</span>
              <span class="hidden sm:inline">Triage Alert</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  `;
}

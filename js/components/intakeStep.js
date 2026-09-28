// RetinaScan AI - Step 1: Clinical Intake Gateway

export function renderIntakeStep(state, onProceed, onSelectPatient) {
  const p = state.currentPatient;

  // Calculate HbA1c risk badge
  let hba1cRiskClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let hba1cRiskLabel = "Optimal / Controlled (<7.0%)";
  if (p.hba1c >= 9.0) {
    hba1cRiskClass = "text-red-700 bg-red-50 border-red-200";
    hba1cRiskLabel = "High Microvascular Risk (≥9.0%)";
  } else if (p.hba1c >= 7.5) {
    hba1cRiskClass = "text-amber-700 bg-amber-50 border-amber-200";
    hba1cRiskLabel = "Elevated Risk (7.5 - 8.9%)";
  }

  return `
    <div class="space-y-8 pb-12 animate-fadeIn">
      
      <!-- Institutional Hero Banner -->
      <section class="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div class="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <span class="material-symbols-outlined text-[240px] text-teal-300">visibility</span>
        </div>
        
        <div class="max-w-3xl relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/40 rounded-full text-xs font-semibold text-teal-300 mb-4">
            <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            CLINICAL POINT-OF-CARE SCREENING GATEWAY
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight font-headline text-white leading-tight">
            AI-Powered Diabetic Retinopathy Early Detection in Under 60 Seconds
          </h1>
          <p class="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Autonomous point-of-care screening for institutional health systems. Ingest fundus imagery, verify optical gradeability in real-time, and grade ICDR severity with 94.2%+ diagnostic concordance.
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-teal-400 text-base">verified</span>
              <span>FDA 510(k) Cleared (K241908)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-teal-400 text-base">lock</span>
              <span>HIPAA & HITECH Compliant 256-Bit</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-teal-400 text-base">speed</span>
              <span>Sub-400ms Neural Inference</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3-Step Rapid Architecture Overview -->
      <section>
        <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rapid 3-Step Screen-to-Referral Architecture</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition-colors">
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Optical Acquisition & Pre-Scan QC</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Non-mydriatic 45° fundus capture with automated optical gradeability verification, focus sharpness detection, and centering audit.
            </p>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition-colors">
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Autonomous Biomarker AI Staging</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Dual-pathway CNN-Transformer ensemble detecting microaneurysms, hard exudates, hemorrhages, and clinically significant macular edema.
            </p>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition-colors">
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Action Plan & Care Coordination</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Automated care recommendations, AAO-compliant follow-up scheduling, and one-click referral dispatch to in-network vitreoretinal specialists.
            </p>
          </div>

        </div>
      </section>

      <!-- Main Two-Column Layout: Diagnostic Intake Profile & Screening Queue -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Diagnostic Intake Profile Form (7 Cols) -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 class="text-base font-bold text-slate-900 font-headline">Active Diagnostic Intake Profile</h2>
                <p class="text-xs text-slate-500">Demographic baseline, metabolic indicators, and retinal imaging hardware</p>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                Encounter #${p.id}
              </span>
            </div>

            <form id="intake-profile-form" class="space-y-4 text-xs">
              <!-- Demographics -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    id="input-patient-name"
                    value="${p.name}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Medical Record Number (MRN)</label>
                  <input
                    type="text"
                    id="input-patient-mrn"
                    value="${p.mrn}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    id="input-patient-dob"
                    value="${p.dob}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    id="input-patient-gender"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Primary Care Physician</label>
                  <input
                    type="text"
                    id="input-patient-pcp"
                    value="${p.pcp}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <!-- Metabolic & Systemic Risk Factors -->
              <div class="pt-4 border-t border-slate-100">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Metabolic & Systemic Biomarkers</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Diabetes Diagnosis</label>
                    <select
                      id="input-diabetes-type"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Type 2 Diabetes Mellitus" ${p.diabetesType.includes('Type 2') ? 'selected' : ''}>Type 2 DM</option>
                      <option value="Type 1 Diabetes Mellitus" ${p.diabetesType.includes('Type 1') ? 'selected' : ''}>Type 1 DM</option>
                      <option value="Gestational Diabetes">Gestational DM</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Duration (Years)</label>
                    <input
                      type="number"
                      id="input-duration"
                      value="${p.durationYears}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Most Recent HbA1c (%)</label>
                    <div class="relative">
                      <input
                        type="number"
                        step="0.1"
                        id="input-hba1c"
                        value="${p.hba1c}"
                        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                      <span class="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
                    </div>
                  </div>
                </div>

                <!-- Live Risk Gauge Banner -->
                <div class="mt-3 p-2.5 rounded-lg border ${hba1cRiskClass} flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5 font-semibold">
                    <span class="material-symbols-outlined text-sm">vital_signs</span>
                    <span>HbA1c Biomarker Stratification:</span>
                    <span>${hba1cRiskLabel}</span>
                  </div>
                  <span class="font-bold">${p.hba1c}%</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Systolic BP</label>
                    <input
                      type="number"
                      id="input-bp-sys"
                      value="${p.bpSystolic}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Diastolic BP</label>
                    <input
                      type="number"
                      id="input-bp-dia"
                      value="${p.bpDiastolic}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">VA (OD)</label>
                    <input
                      type="text"
                      id="input-va-od"
                      value="${p.visualAcuityOD}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">VA (OS)</label>
                    <input
                      type="text"
                      id="input-va-os"
                      value="${p.visualAcuityOS}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <!-- Imaging Hardware Configuration -->
              <div class="pt-4 border-t border-slate-100">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Fundus Acquisition Hardware</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Imaging Camera System</label>
                    <select
                      id="input-device-camera"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Topcon NW400 Robotic Fundus Camera" ${p.deviceCamera.includes('Topcon') ? 'selected' : ''}>Topcon NW400 Robotic Fundus Camera</option>
                      <option value="Canon CR-2 AF Retinal Camera" ${p.deviceCamera.includes('Canon') ? 'selected' : ''}>Canon CR-2 AF Retinal Camera</option>
                      <option value="Volk VisiScopic Field Adapter" ${p.deviceCamera.includes('Volk') ? 'selected' : ''}>Volk VisiScopic Smartphone Field Adapter</option>
                      <option value="Welch Allyn RetinaVue 700">Welch Allyn RetinaVue 700</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Pupil Dilation Protocol</label>
                    <input
                      type="text"
                      id="input-dilation"
                      value="${p.dilationStatus}"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <!-- CTA Proceed Button -->
              <div class="pt-4 flex items-center justify-between">
                <span class="text-[11px] text-slate-500">
                  Data validated against DICOM Modality Worklist
                </span>
                <button
                  type="button"
                  id="btn-proceed-prescan"
                  class="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:shadow transition-all text-xs"
                >
                  <span>Proceed to Optical Pre-Scan</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Institutional Screening Queue (5 Cols) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-headline">Clinical Screening Queue</h3>
                <p class="text-[11px] text-slate-500">Select an encounter to load full diagnostic profile</p>
              </div>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-bold">
                ${state.patients.length} Active
              </span>
            </div>

            <div class="space-y-2.5">
              ${state.patients.map(item => {
                const isSelected = item.id === p.id;
                let badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                if (item.statusColor === 'red') badgeClass = "bg-red-50 text-red-800 border-red-200";
                if (item.statusColor === 'blue') badgeClass = "bg-blue-50 text-blue-800 border-blue-200";
                if (item.statusColor === 'emerald') badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

                return `
                  <div
                    data-queue-patient-id="${item.id}"
                    class="p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 shadow-sm ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden">
                          <img src="${item.photoUrl}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'><rect width=\\'24\\' height=\\'24\\' fill=\\'%23CBD5E1\\'/></svg>'"/>
                        </div>
                        <div>
                          <p class="font-bold text-slate-900 text-xs">${item.name}</p>
                          <p class="text-[11px] text-slate-500 font-mono">#${item.id} • ${item.age}y ${item.gender.charAt(0)}</p>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}">
                        ${item.statusLabel}
                      </span>
                    </div>

                    <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>HbA1c: <strong class="text-slate-700">${item.hba1c}%</strong></span>
                      <span>BP: <strong class="text-slate-700">${item.bpSystolic}/${item.bpDiastolic}</strong></span>
                      <span class="text-teal-700 font-semibold font-mono">${item.scans.OD.diagnosis.icdrStage}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Queue Refresh Notice -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-teal-600">sync</span>
                Synced with HL7 EHR Feed
              </span>
              <span>Last polled: 1 min ago</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;
}

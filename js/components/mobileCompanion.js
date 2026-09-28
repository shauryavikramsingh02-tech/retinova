// RetinaScan AI - Mobile Field Companion Mode

export function renderMobileCompanion(state, onToggleMobileSubTab, onSimulateCapture, onExitMobile) {
  const p = state.currentPatient;
  const currentTab = state.mobileSubTab || 'capture'; // 'capture' | 'diagnosis'
  const scan = p.scans.OD;
  const diag = scan.diagnosis;

  return `
    <div class="py-6 flex flex-col items-center justify-center animate-fadeIn">
      
      <!-- Top Companion Control Bar -->
      <div class="w-full max-w-md mb-4 flex items-center justify-between px-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 bg-amber-500/10 text-amber-800 border border-amber-300 font-bold rounded text-[11px]">
            FIELD HANDHELD MODE
          </span>
          <span class="text-slate-500 font-mono">Simulated Viewport (390 x 844)</span>
        </div>

        <button
          id="btn-exit-mobile"
          class="flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold underline"
        >
          <span class="material-symbols-outlined text-sm">desktop_windows</span>
          <span>Return to Workstation</span>
        </button>
      </div>

      <!-- Smartphone Frame -->
      <div class="mobile-device-frame flex flex-col justify-between">
        <div class="mobile-notch"></div>

        <!-- Phone Header / Status Bar -->
        <div class="pt-8 px-4 pb-2 bg-slate-900 text-white flex items-center justify-between text-[11px] border-b border-slate-800 z-10">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-teal-400 text-sm">sync</span>
            <span class="font-bold">RetinaScan AI Mobile</span>
          </div>
          <div class="flex items-center gap-2 font-mono">
            <span>#PT-84920</span>
            <span class="text-emerald-400">● Live</span>
          </div>
        </div>

        <!-- Phone Screen Content Body -->
        <div class="flex-1 overflow-y-auto bg-slate-950 text-white p-3 space-y-3">
          
          ${currentTab === 'capture' ? `
            <!-- Screen 1: Field Capture & QC Viewfinder -->
            <div class="space-y-3">
              
              <!-- Viewfinder Container -->
              <div class="relative w-full h-80 rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner flex items-center justify-center">
                <img
                  src="assets/mobile_field_capture.jpg"
                  alt="Field Retinal Viewfinder"
                  class="w-full h-full object-cover"
                />

                <!-- Reticle & Alignment Guide -->
                <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div class="w-48 h-48 border-2 border-teal-400/80 rounded-full border-dashed animate-pulse"></div>
                  <div class="w-24 h-24 border border-teal-300 rounded-full absolute"></div>
                  <div class="w-2 h-2 bg-teal-400 rounded-full absolute"></div>
                </div>

                <!-- Viewfinder Floating Telemetry -->
                <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-teal-300 border border-slate-700">
                  AUTO-FOCUS: LOCKED (96.4%)
                </div>

                <div class="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-slate-700">
                  MACULA: ALIGNED
                </div>
              </div>

              <!-- Optical QC Quick Badges -->
              <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <span class="text-slate-400 block">Sharpness</span>
                  <span class="text-emerald-400 font-bold font-mono">96.4% (Pass)</span>
                </div>
                <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <span class="text-slate-400 block">Exposure</span>
                  <span class="text-emerald-400 font-bold font-mono">94.8% (Good)</span>
                </div>
                <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <span class="text-slate-400 block">Field</span>
                  <span class="text-emerald-400 font-bold font-mono">OD (Right Eye)</span>
                </div>
              </div>

              <!-- Capture Trigger Button -->
              <button
                id="btn-mobile-snap"
                class="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs"
              >
                <span class="material-symbols-outlined text-base">photo_camera</span>
                <span>Freeze Frame & Run Point-of-Care AI</span>
              </button>

            </div>
          ` : `
            <!-- Screen 2: Field AI Diagnosis Report -->
            <div class="space-y-3">
              
              <!-- Result Diagnostic Card -->
              <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-teal-400 tracking-wider">AI Clinical Verdict</span>
                  <span class="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700 rounded text-[10px] font-bold font-mono">
                    Grade 2 / 4
                  </span>
                </div>

                <h3 class="text-lg font-bold text-white font-headline leading-tight">
                  Moderate NPDR
                </h3>
                <p class="text-[11px] text-slate-400">
                  Moderate Non-Proliferative Diabetic Retinopathy with High Risk for DME (88.7%).
                </p>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Confidence: <strong class="text-teal-300">94.2%</strong></span>
                  <span>Target: <strong class="text-amber-400">2 - 4 Weeks</strong></span>
                </div>
              </div>

              <!-- Fundus Diagnostic Thumbnail -->
              <div class="relative h-44 rounded-xl overflow-hidden border border-slate-800 bg-black">
                <img
                  src="assets/mobile_diagnosis_fundus.jpg"
                  alt="Mobile Fundus Diagnosis"
                  class="w-full h-full object-cover"
                />
                <div class="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  OD Fundus • 4 Biomarkers Detected
                </div>
              </div>

              <!-- Key Biomarkers Chips -->
              <div class="space-y-1.5 text-xs">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Key Detected Biomarkers:</span>
                <div class="flex flex-wrap gap-1.5">
                  <span class="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded-full text-[10px]">
                    ● Microaneurysms (14)
                  </span>
                  <span class="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-full text-[10px]">
                    ● Hard Exudates (8)
                  </span>
                  <span class="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px]">
                    ● Hemorrhages (6)
                  </span>
                </div>
              </div>

              <!-- Mobile Referral & Share -->
              <div class="space-y-2 pt-2">
                <button
                  id="btn-mobile-dispatch"
                  class="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">emergency_share</span>
                  <span>Route Referral to Dr. Sarah Jenkins</span>
                </button>

                <button
                  id="btn-mobile-sms"
                  class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm text-teal-400">chat</span>
                  <span>Send Summary to Patient Phone</span>
                </button>
              </div>

            </div>
          `}

        </div>

        <!-- Phone Bottom Navigation Bar -->
        <div class="p-2 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <button
            id="mobile-tab-capture"
            class="py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors ${
              currentTab === 'capture'
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:text-white'
            }"
          >
            <span class="material-symbols-outlined text-sm">photo_camera</span>
            <span>Capture & QC</span>
          </button>
          
          <button
            id="mobile-tab-diagnosis"
            class="py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors ${
              currentTab === 'diagnosis'
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:text-white'
            }"
          >
            <span class="material-symbols-outlined text-sm">analytics</span>
            <span>AI Report</span>
          </button>
        </div>

      </div>

    </div>
  `;
}

// RetinaScan AI - Step 2: Retinal Upload & Automated Optical QC Engine

export function renderQualityCheckStep(state, onRunDiagnosis, onSwitchEye, onUploadNew) {
  const p = state.currentPatient;
  const currentEye = state.selectedEye || 'OD';
  const scan = p.scans[currentEye] || p.scans.OD;
  const qc = scan.qcMetrics;

  return `
    <div class="space-y-6 pb-12 animate-fadeIn">
      
      <!-- Patient & Encounter Status Header -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <img src="${p.photoUrl}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'><rect width=\\'24\\' height=\\'24\\' fill=\\'%23CBD5E1\\'/></svg>'"/>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold text-slate-900 font-headline">Patient: #${p.id} • ${p.name}</h1>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded">
                ${p.age}y / ${p.gender}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Hardware: <strong class="text-slate-700">${p.deviceCamera}</strong> • Captured: ${scan.captureTime} • ${p.dilationStatus}
            </p>
          </div>
        </div>

        <!-- Eye Target Selection Segmented Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Eye:</span>
          <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              id="eye-toggle-od"
              class="px-3 py-1.5 rounded-md transition-all ${
                currentEye === 'OD'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              OD (Right Eye)
            </button>
            <button
              id="eye-toggle-os"
              class="px-3 py-1.5 rounded-md transition-all ${
                currentEye === 'OS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              OS (Left Eye)
            </button>
          </div>
        </div>
      </div>

      <!-- Main Layout: Viewport (8 Cols) & Automated Optical QC Engine (4 Cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Retinal Viewport & Optical Controls (8 Cols) -->
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col">
            
            <!-- Viewport Top Toolbar -->
            <div class="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-teal-400 text-base">center_focus_strong</span>
                <span class="font-semibold text-white">Fundus Viewport (${currentEye})</span>
                <span class="text-[11px] text-slate-400 font-mono">45° Posterior Pole Matrix</span>
              </div>

              <!-- Zoom & Reset HUD -->
              <div class="flex items-center gap-1.5">
                <button id="qc-zoom-in" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Zoom In">
                  <span class="material-symbols-outlined text-sm">zoom_in</span>
                </button>
                <button id="qc-zoom-out" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Zoom Out">
                  <span class="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <button id="qc-zoom-reset" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono" title="Reset View">
                  100%
                </button>
              </div>
            </div>

            <!-- Canvas Container -->
            <div class="retinal-viewport-container relative w-full h-[460px] sm:h-[500px] flex items-center justify-center bg-black">
              <canvas id="qc-retinal-canvas" class="retinal-canvas w-full h-full block"></canvas>
              
              <!-- Floating Centering Reticle Overlay -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div class="w-64 h-64 border border-teal-400 rounded-full border-dashed"></div>
                <div class="w-32 h-32 border border-teal-400/70 rounded-full absolute"></div>
              </div>
            </div>

            <!-- Viewport Optical Adjustments Footer -->
            <div class="bg-slate-900 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-4 flex-wrap">
                <!-- Red-Free Green Channel Filter -->
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" id="qc-toggle-redfree" class="rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-800"/>
                  <span class="text-slate-300 font-medium">Red-Free (Green Optical Filter)</span>
                </label>

                <!-- Brightness -->
                <div class="flex items-center gap-2">
                  <span class="text-slate-400 text-[11px]">Brightness</span>
                  <input type="range" id="qc-slider-brightness" min="-50" max="50" value="0" class="w-20 accent-teal-500 h-1 bg-slate-700 rounded-lg"/>
                </div>

                <!-- Contrast -->
                <div class="flex items-center gap-2">
                  <span class="text-slate-400 text-[11px]">Contrast</span>
                  <input type="range" id="qc-slider-contrast" min="-50" max="50" value="0" class="w-20 accent-teal-500 h-1 bg-slate-700 rounded-lg"/>
                </div>
              </div>

              <!-- Upload Alternative Image -->
              <div>
                <label class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 text-xs font-semibold cursor-pointer">
                  <span class="material-symbols-outlined text-sm text-teal-400">upload_file</span>
                  <span>Upload Custom Scan</span>
                  <input type="file" id="qc-file-input" accept="image/*" class="hidden"/>
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Automated Optical QC Engine Panel (4 Cols) -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 class="text-sm font-bold text-slate-900 font-headline">Automated Optical QC Engine</h2>
                <p class="text-[11px] text-slate-500">ISO 10940 Fundus Camera Quality Standard</p>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold font-mono">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                GRADEABLE
              </span>
            </div>

            <!-- Gradeability Score Gauge -->
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Aggregated Image Gradeability Index
              </span>
              <div class="mt-2 flex items-baseline justify-center gap-1">
                <span class="text-3xl font-extrabold text-slate-900 font-headline">${qc.gradeability}%</span>
                <span class="text-xs text-emerald-600 font-semibold">(Threshold: ≥80.0%)</span>
              </div>

              <!-- Progress bar -->
              <div class="w-full bg-slate-200 rounded-full h-2 mt-2.5 overflow-hidden">
                <div class="bg-teal-600 h-2 rounded-full transition-all duration-700" style="width: ${qc.gradeability}%"></div>
              </div>
              <p class="text-[11px] text-slate-500 mt-2">
                High diagnostic signal-to-noise ratio. Suitable for autonomous deep neural inference.
              </p>
            </div>

            <!-- Individual Optical Metrics -->
            <div class="space-y-3 text-xs">
              
              <!-- Focus & Sharpness -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div class="flex items-center justify-between font-semibold">
                  <span class="text-slate-700 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-teal-600">center_focus_weak</span>
                    Focus Sharpness (Retinal Vasculature)
                  </span>
                  <span class="font-mono text-emerald-700 font-bold">${qc.sharpness}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5">
                  <div class="bg-emerald-600 h-1.5 rounded-full" style="width: ${qc.sharpness}%"></div>
                </div>
              </div>

              <!-- Illumination Uniformity -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div class="flex items-center justify-between font-semibold">
                  <span class="text-slate-700 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-teal-600">wb_sunny</span>
                    Illumination & Exposure Uniformity
                  </span>
                  <span class="font-mono text-emerald-700 font-bold">${qc.illumination}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5">
                  <div class="bg-emerald-600 h-1.5 rounded-full" style="width: ${qc.illumination}%"></div>
                </div>
              </div>

              <!-- Centering -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span class="font-semibold text-slate-700 block">Anatomical Field Centering</span>
                  <span class="text-[11px] text-slate-500">${qc.centering}</span>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  PASS
                </span>
              </div>

              <!-- Media Opacity -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span class="font-semibold text-slate-700 block">Media Opacity / Lens Interference</span>
                  <span class="text-[11px] text-slate-500">${qc.mediaOpacity}% (Minimal / Non-Obstructive)</span>
                </div>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  PASS
                </span>
              </div>

            </div>

            <!-- Live Telemetry & Inference Trigger -->
            <div class="pt-2 space-y-2">
              <button
                id="btn-run-ai-diagnosis"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md hover:shadow transition-all text-xs"
              >
                <span class="material-symbols-outlined text-base">neurology</span>
                <span id="btn-ai-text">Run AI Diagnostic Analysis</span>
              </button>

              <div id="ai-telemetry-progress" class="hidden space-y-1.5 pt-2">
                <div class="flex items-center justify-between text-[11px] text-teal-800 font-semibold">
                  <span id="telemetry-label">Executing Dual-Pathway CNN-Transformer...</span>
                  <span id="telemetry-percent">38%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div id="telemetry-bar" class="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style="width: 38%"></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <button id="btn-recapture-scan" class="hover:text-slate-700 underline">
                  Trigger Camera Re-capture
                </button>
                <button id="btn-bypass-qc" class="hover:text-slate-700 underline">
                  Bypass Optical Verification
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;
}
